"""Exploration and discovery routes for browsing ambassadors and clients."""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from supabase_client import admin_client
from core.security import get_current_user
from typing import Optional, List

router = APIRouter()


@router.get("/ambassadors")
async def get_ambassadors(
    search: Optional[str] = Query(None),
    niches: Optional[List[str]] = Query(None),
    location: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    """
    Get all ambassadors for exploration/discovery.
    Supports filtering by search query, niches, and location.
    Includes user emails for proper identification.
    """
    try:
        # Start with a base query that joins with the profiles table to get the email
        query = admin_client.table("ambassador_profiles").select("*, profiles(email)")

        # Apply filters if provided
        if niches and len(niches) > 0:
            query = query.contains("niche", niches)

        if location:
            query = query.ilike("location", f"%{location}%")

        if search:
            query = query.or_(f"full_name.ilike.%{search}%,bio.ilike.%{search}%")

        result = query.order("created_at", desc=True).execute()

        if not result.data:
            return {"data": []}

        # Format ambassadors for frontend, now including the email from the join
        ambassadors = []
        for ambassador in result.data:
            user_id = ambassador["user_id"]
            email = ambassador.get("profiles", {}).get("email") # Get email from nested profiles object

            ambassadors.append(
                {
                    "id": user_id,
                    "profileId": ambassador["id"],
                    "name": ambassador.get("full_name", "Unknown"),
                    "email": email, # Include the actual email
                    "username": ambassador.get("full_name", "unknown")
                    .lower()
                    .replace(" ", ""),
                    "bio": ambassador.get("bio", "Ambassador on Dime"),
                    "location": ambassador.get("location", "Location not specified"),
                    "followers": "N/A",
                    "niche": ambassador.get("niche", []),
                    "rating": 4.8,
                    "completedCampaigns": 0,
                    "avgEngagement": "N/A",
                    "profilePhotoUrl": ambassador.get("profile_photo_url"),
                    "instagramHandle": ambassador.get("instagram_handle"),
                    "tiktokHandle": ambassador.get("tiktok_handle"),
                    "twitterHandle": ambassador.get("twitter_handle"),
                }
            )

        return {"data": ambassadors}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching ambassadors: {str(e)}",
        )


@router.get("/clients")
async def get_clients(
    search: Optional[str] = Query(None),
    industry: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Get all clients for exploration/discovery.
    Supports filtering by search query and industry.
    """
    try:
        # Start with base query
        query = admin_client.table("client_profiles").select("*")
        
        # Apply filters if provided
        if industry:
            query = query.ilike("industry", f"%{industry}%")
        
        if search:
            # Search in company_name and company_description
            query = query.or_(f"company_name.ilike.%{search}%,company_description.ilike.%{search}%")
        
        result = query.order("created_at", desc=True).execute()
        
        # Format clients for frontend
        clients = []
        for client in result.data or []:
            clients.append({
                "id": client["user_id"],
                "profileId": client["id"],
                "companyName": client.get("company_name", "Unknown Company"),
                "industry": client.get("industry", "Not specified"),
                "description": client.get("company_description", "No description available"),
                "activeCampaigns": 0,
                "totalBudget": "N/A",
                "logoUrl": client.get("logo_url"),
            })
        
        return {"data": clients}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching clients: {str(e)}"
        )


@router.get("/ambassador/{ambassador_id}")
async def get_ambassador_details(
    ambassador_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get detailed information about a specific ambassador.
    """
    try:
        result = admin_client.table("ambassador_profiles").select("*").eq("user_id", ambassador_id).maybe_single().execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ambassador not found"
            )
        
        ambassador = result.data
        
        return {
            "id": ambassador["user_id"],
            "profileId": ambassador["id"],
            "name": ambassador.get("full_name", "Unknown"),
            "bio": ambassador.get("bio", ""),
            "location": ambassador.get("location", ""),
            "niche": ambassador.get("niche", []),
            "profilePhotoUrl": ambassador.get("profile_photo_url"),
            "instagramHandle": ambassador.get("instagram_handle"),
            "tiktokHandle": ambassador.get("tiktok_handle"),
            "twitterHandle": ambassador.get("twitter_handle"),
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching ambassador: {str(e)}"
        )


@router.get("/client/{client_id}")
async def get_client_details(
    client_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get detailed information about a specific client.
    """
    try:
        result = admin_client.table("client_profiles").select("*").eq("user_id", client_id).maybe_single().execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Client not found"
            )
        
        client = result.data
        
        return {
            "id": client["user_id"],
            "profileId": client["id"],
            "companyName": client.get("company_name", ""),
            "industry": client.get("industry", ""),
            "description": client.get("company_description", ""),
            "website": client.get("website"),
            "logoUrl": client.get("logo_url"),
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching client: {str(e)}"
        )
