"""Instagram API integration routes for connecting accounts and fetching media insights."""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from pydantic import BaseModel
from supabase_client import admin_client
from core.security import get_current_user
from typing import Optional
from datetime import datetime, timedelta
import httpx

router = APIRouter()

INSTAGRAM_GRAPH_API_URL = "https://graph.instagram.com"


class InstagramConnectRequest(BaseModel):
    """Request model for connecting Instagram account with short-lived OAuth token."""
    short_lived_token: str
    instagram_user_id: str


class InstagramConnection(BaseModel):
    """Model representing an Instagram account connection with access token."""
    instagram_user_id: str
    instagram_username: str
    access_token: str
    token_expires_at: str


@router.post("/connect")
async def connect_instagram(
    request: InstagramConnectRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Save Instagram connection after OAuth.
    Exchanges short-lived token for long-lived token and saves to database.
    """
    try:
        # Check if user is an ambassador
        if not current_user.get("profile") or current_user["profile"]["role"] != "ambassador":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only ambassadors can connect Instagram"
            )
        
        ambassador_profile = current_user.get("ambassador_profile")
        if not ambassador_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ambassador profile not found"
            )
        
        # Exchange short-lived token for long-lived token
        async with httpx.AsyncClient() as client:
            token_response = await client.get(
                f"{INSTAGRAM_GRAPH_API_URL}/access_token",
                params={
                    "grant_type": "ig_exchange_token",
                    "client_secret": admin_client.supabase_key,  # Note: You'll need Instagram app secret in env
                    "access_token": request.short_lived_token
                }
            )
            
            if token_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to exchange token"
                )
            
            token_data = token_response.json()
            long_lived_token = token_data["access_token"]
            expires_in = token_data["expires_in"]
            
            # Fetch Instagram username
            user_response = await client.get(
                f"{INSTAGRAM_GRAPH_API_URL}/me",
                params={
                    "fields": "username",
                    "access_token": long_lived_token
                }
            )
            
            if user_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to fetch Instagram username"
                )
            
            user_data = user_response.json()
            username = user_data["username"]
        
        # Calculate expiration date
        expires_at = (datetime.utcnow() + timedelta(seconds=expires_in)).isoformat()
        
        # Save connection to database
        result = admin_client.table("instagram_connections").upsert({
            "ambassador_id": ambassador_profile["id"],
            "instagram_user_id": request.instagram_user_id,
            "instagram_username": username,
            "access_token": long_lived_token,
            "token_expires_at": expires_at,
            "updated_at": datetime.utcnow().isoformat()
        }, on_conflict="ambassador_id").execute()
        
        return {
            "success": True,
            "username": username,
            "expires_in": expires_in
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to connect Instagram: {str(e)}"
        )


@router.get("/connect")
async def check_instagram_connection(
    current_user: dict = Depends(get_current_user)
):
    """
    Check if user has Instagram connected.
    """
    try:
        ambassador_profile = current_user.get("ambassador_profile")
        if not ambassador_profile:
            return {"connected": False}
        
        # Get connection from database
        result = admin_client.table("instagram_connections").select("*").eq("ambassador_id", ambassador_profile["id"]).maybe_single().execute()
        
        connection = result.data
        
        return {
            "connected": bool(connection),
            "username": connection.get("instagram_username") if connection else None,
            "expires_at": connection.get("token_expires_at") if connection else None
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check connection: {str(e)}"
        )


@router.get("/media")
async def get_instagram_media(
    limit: int = Query(25, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """
    Fetch user's Instagram media (Reels, posts).
    """
    try:
        # Check if user is an ambassador
        if not current_user.get("profile") or current_user["profile"]["role"] != "ambassador":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only ambassadors can fetch media"
            )
        
        ambassador_profile = current_user.get("ambassador_profile")
        if not ambassador_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ambassador profile not found"
            )
        
        # Get Instagram connection
        result = admin_client.table("instagram_connections").select("*").eq("ambassador_id", ambassador_profile["id"]).maybe_single().execute()
        
        connection = result.data
        if not connection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Instagram not connected"
            )
        
        # Check if token needs refresh (within 7 days of expiration)
        token_expires_at = datetime.fromisoformat(connection["token_expires_at"].replace('Z', '+00:00'))
        days_until_expiry = (token_expires_at - datetime.utcnow()).days
        
        access_token = connection["access_token"]
        
        if days_until_expiry < 7:
            # Refresh token
            async with httpx.AsyncClient() as client:
                refresh_response = await client.get(
                    f"{INSTAGRAM_GRAPH_API_URL}/refresh_access_token",
                    params={
                        "grant_type": "ig_refresh_token",
                        "access_token": access_token
                    }
                )
                
                if refresh_response.status_code == 200:
                    refresh_data = refresh_response.json()
                    access_token = refresh_data["access_token"]
                    expires_in = refresh_data["expires_in"]
                    new_expires_at = (datetime.utcnow() + timedelta(seconds=expires_in)).isoformat()
                    
                    # Update token in database
                    admin_client.table("instagram_connections").update({
                        "access_token": access_token,
                        "token_expires_at": new_expires_at,
                        "updated_at": datetime.utcnow().isoformat()
                    }).eq("id", connection["id"]).execute()
        
        # Fetch media
        async with httpx.AsyncClient() as client:
            media_response = await client.get(
                f"{INSTAGRAM_GRAPH_API_URL}/{connection['instagram_user_id']}/media",
                params={
                    "fields": "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username",
                    "limit": str(limit),
                    "access_token": access_token
                }
            )
            
            if media_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to fetch media"
                )
            
            media_data = media_response.json()
            media_list = media_data.get("data", [])
            
            # Filter for Reels (videos) only
            reels = [item for item in media_list if item.get("media_type") == "VIDEO"]
            
            return {"data": reels}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch media: {str(e)}"
        )


@router.get("/insights/{media_id}")
async def get_media_insights(
    media_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Fetch insights for a specific media item.
    """
    try:
        # Check if user is an ambassador
        if not current_user.get("profile") or current_user["profile"]["role"] != "ambassador":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only ambassadors can fetch insights"
            )
        
        ambassador_profile = current_user.get("ambassador_profile")
        if not ambassador_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ambassador profile not found"
            )
        
        # Get Instagram connection
        result = admin_client.table("instagram_connections").select("*").eq("ambassador_id", ambassador_profile["id"]).maybe_single().execute()
        
        connection = result.data
        if not connection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Instagram not connected"
            )
        
        access_token = connection["access_token"]
        
        # Fetch insights
        async with httpx.AsyncClient() as client:
            insights_response = await client.get(
                f"{INSTAGRAM_GRAPH_API_URL}/{media_id}/insights",
                params={
                    "metric": "plays,reach,likes,comments,shares,saved,total_interactions",
                    "access_token": access_token
                }
            )
            
            if insights_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to fetch insights"
                )
            
            insights_data = insights_response.json()
            
            # Parse insights
            insights = {}
            for metric in insights_data.get("data", []):
                name = metric.get("name")
                value = metric.get("values", [{}])[0].get("value")
                insights[name] = value
            
            return {"data": insights}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch insights: {str(e)}"
        )

