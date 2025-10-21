"""Portfolio management routes for ambassadors to showcase their campaign work."""

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field, field_validator
from supabase_client import admin_client
from core.security import get_current_user
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import re

router = APIRouter()


class CreatePortfolioRequest(BaseModel):
    """Input model for creating a new portfolio item - ONLY fields users can provide."""
    title: str = Field(..., max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    instagram_url: Optional[str] = Field(None, max_length=500)
    tiktok_url: Optional[str] = Field(None, max_length=500)
    media_urls: List[str] = Field(..., max_length=20)
    campaign_date: Optional[str] = Field(None, max_length=50)
    results: Optional[Dict[str, Any]] = None
    
    @field_validator('*', mode='before')
    @classmethod
    def sanitize_strings(cls, v):
        if isinstance(v, str):
            # Remove potentially dangerous characters
            v = re.sub(r'[<>"\']', '', v)
            # Prevent XSS patterns
            if '<script' in v.lower() or 'javascript:' in v.lower():
                raise ValueError('Invalid characters detected')
        elif isinstance(v, list):
            # Sanitize list items
            return [re.sub(r'[<>"\']', '', item) if isinstance(item, str) else item for item in v]
        return v
    
    class Config:
        # Prevent any additional fields from being accepted
        extra = 'forbid'


class UpdatePortfolioRequest(BaseModel):
    """Input model for updating portfolio item - ONLY fields users can modify."""
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    instagram_url: Optional[str] = Field(None, max_length=500)
    tiktok_url: Optional[str] = Field(None, max_length=500)
    media_urls: Optional[List[str]] = Field(None, max_length=20)
    campaign_date: Optional[str] = Field(None, max_length=50)
    results: Optional[Dict[str, Any]] = None
    
    @field_validator('*', mode='before')
    @classmethod
    def sanitize_strings(cls, v):
        if isinstance(v, str):
            # Remove potentially dangerous characters
            v = re.sub(r'[<>"\']', '', v)
            # Prevent XSS patterns
            if '<script' in v.lower() or 'javascript:' in v.lower():
                raise ValueError('Invalid characters detected')
        elif isinstance(v, list):
            # Sanitize list items
            return [re.sub(r'[<>"\']', '', item) if isinstance(item, str) else item for item in v]
        return v
    
    class Config:
        # Prevent any additional fields from being accepted
        extra = 'forbid'


class PortfolioRead(BaseModel):
    """Output model for portfolio item - ALL fields including system fields."""
    id: str
    ambassador_id: str
    client_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    instagram_url: Optional[str] = None
    tiktok_url: Optional[str] = None
    media_urls: Optional[List[str]] = None
    campaign_date: Optional[str] = None
    results: Optional[Dict[str, Any]] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


@router.post("/create")
async def create_portfolio_item(
    portfolio: CreatePortfolioRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new portfolio item. Only ambassadors can create portfolio items.
    """
    try:
        # Verify user is an ambassador
        if not current_user.get("profile") or current_user["profile"]["role"] != "ambassador":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only ambassadors can create portfolio items"
            )
        
        ambassador_profile = current_user.get("ambassador_profile")
        if not ambassador_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ambassador profile not found"
            )
        
        # Create portfolio item
        result = admin_client.table("portfolios").insert({
            "ambassador_id": ambassador_profile["id"],
            "title": portfolio.title,
            "description": portfolio.description,
            "instagram_url": portfolio.instagram_url,
            "tiktok_url": portfolio.tiktok_url,
            "media_urls": portfolio.media_urls,
            "campaign_date": portfolio.campaign_date,
            "results": portfolio.results,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create portfolio item"
            )
        
        return {
            "success": True,
            "portfolio": result.data[0]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating portfolio item: {str(e)}"
        )


@router.get("/ambassador/{ambassador_id}")
async def get_ambassador_portfolio(
    ambassador_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get all portfolio items for a specific ambassador.
    """
    try:
        # Fetch portfolio items
        result = admin_client.table("portfolios").select("*").eq("ambassador_id", ambassador_id).order("created_at", desc=True).execute()
        
        return {
            "data": result.data or []
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching portfolio: {str(e)}"
        )


@router.get("/{portfolio_id}")
async def get_portfolio_item(
    portfolio_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get a specific portfolio item.
    """
    try:
        result = admin_client.table("portfolios").select("*").eq("id", portfolio_id).maybe_single().execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Portfolio item not found"
            )
        
        return result.data
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching portfolio item: {str(e)}"
        )


@router.put("/{portfolio_id}")
async def update_portfolio_item(
    portfolio_id: str,
    portfolio: UpdatePortfolioRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Update a portfolio item. Only the owner can update it.
    """
    try:
        # Verify ownership
        existing = admin_client.table("portfolios").select("ambassador_id").eq("id", portfolio_id).maybe_single().execute()
        
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Portfolio item not found"
            )
        
        ambassador_profile = current_user.get("ambassador_profile")
        if not ambassador_profile or existing.data["ambassador_id"] != ambassador_profile["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this portfolio item"
            )
        
        # Prepare update data
        update_data = portfolio.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        # Update portfolio item
        result = admin_client.table("portfolios").update(update_data).eq("id", portfolio_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update portfolio item"
            )
        
        return {
            "success": True,
            "portfolio": result.data[0]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating portfolio item: {str(e)}"
        )


@router.delete("/{portfolio_id}")
async def delete_portfolio_item(
    portfolio_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a portfolio item. Only the owner can delete it.
    """
    try:
        # Verify ownership
        existing = admin_client.table("portfolios").select("ambassador_id").eq("id", portfolio_id).maybe_single().execute()
        
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Portfolio item not found"
            )
        
        ambassador_profile = current_user.get("ambassador_profile")
        if not ambassador_profile or existing.data["ambassador_id"] != ambassador_profile["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this portfolio item"
            )
        
        # Delete portfolio item
        admin_client.table("portfolios").delete().eq("id", portfolio_id).execute()
        
        return {
            "success": True,
            "message": "Portfolio item deleted successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting portfolio item: {str(e)}"
        )

