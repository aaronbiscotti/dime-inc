"""Campaign management routes for creating and browsing brand campaigns."""

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field, field_validator
from supabase_client import admin_client
from core.security import get_current_user
from typing import Optional, List
from datetime import datetime, timezone
import re

router = APIRouter()

# Campaign placeholder ID for open campaigns (without assigned ambassadors)
CAMPAIGN_PLACEHOLDER_ID = '00000000-0000-0000-0000-000000000000'


class CampaignMetadata(BaseModel):
    """Metadata model for campaign targeting and requirements."""
    target_niches: List[str]
    campaign_type: str
    deliverables: List[str]
    requirements: List[str]


class CreateCampaignRequest(BaseModel):
    """Input model for creating a new campaign - ONLY fields users can provide."""
    title: str = Field(..., max_length=200)
    description: str = Field(..., max_length=2000)
    budget: str = Field(..., max_length=50)
    timeline: str = Field(..., max_length=100)
    requirements: List[str] = Field(..., max_length=20)
    target_niches: List[str] = Field(..., max_length=10)
    campaign_type: str = Field(..., max_length=50)
    deliverables: List[str] = Field(..., max_length=20)
    
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


class CampaignRead(BaseModel):
    """Output model for campaign - ALL fields including system fields."""
    id: str
    client_id: str
    ambassador_id: str
    campaign_title: str
    campaign_description: str
    budget: Optional[float] = None
    timeline: str
    requirements: Optional[str] = None
    status: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


@router.post("/create")
async def create_campaign(
    campaign: CreateCampaignRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new campaign. Only clients can create campaigns.
    """
    try:
        # Verify user is a client
        if not current_user.get("profile") or current_user["profile"]["role"] != "client":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only clients can create campaigns"
            )
        
        client_profile = current_user.get("client_profile")
        if not client_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Client profile not found"
            )
        
        # Prepare campaign metadata
        campaign_metadata = {
            "targetNiches": campaign.target_niches,
            "campaignType": campaign.campaign_type,
            "deliverables": campaign.deliverables,
            "requirements": campaign.requirements
        }
        
        # Parse budget
        try:
            budget_value = float(campaign.budget.replace('$', '').replace(',', '').strip())
        except:
            budget_value = None
        
        # Create campaign as a bid with placeholder ambassador_id
        result = admin_client.table("bids").insert({
            "client_id": client_profile["id"],
            "ambassador_id": CAMPAIGN_PLACEHOLDER_ID,
            "campaign_title": campaign.title,
            "campaign_description": campaign.description,
            "budget": budget_value,
            "timeline": campaign.timeline,
            "requirements": str(campaign_metadata),  # Store as JSON string
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create campaign"
            )
        
        return {
            "success": True,
            "campaign": result.data[0]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating campaign: {str(e)}"
        )


@router.get("/client/{client_id}")
async def get_campaigns_for_client(
    client_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get all campaigns for a specific client.
    """
    try:
        # Verify user is authorized (must be the client or an admin)
        if current_user["id"] != client_id:
            client_profile = current_user.get("client_profile")
            if not client_profile or client_profile["id"] != client_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to view these campaigns"
                )
        
        # Fetch campaigns (bids with placeholder ambassador_id)
        result = admin_client.table("bids").select("*").eq("client_id", client_id).eq("ambassador_id", CAMPAIGN_PLACEHOLDER_ID).order("created_at", desc=True).execute()
        
        return {
            "data": result.data or [],
            "error": None
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching campaigns: {str(e)}"
        )


@router.get("/all")
async def get_all_open_campaigns(
    current_user: dict = Depends(get_current_user)
):
    """
    Get all open campaigns (for ambassadors to browse).
    """
    try:
        # Fetch all open campaigns
        result = admin_client.table("bids").select("*, client_profiles(*)").eq("ambassador_id", CAMPAIGN_PLACEHOLDER_ID).eq("status", "pending").order("created_at", desc=True).execute()
        
        return {
            "data": result.data or []
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching campaigns: {str(e)}"
        )


@router.get("/{campaign_id}")
async def get_campaign(
    campaign_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get details for a specific campaign.
    """
    try:
        result = admin_client.table("bids").select("*, client_profiles(*)").eq("id", campaign_id).maybe_single().execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign not found"
            )
        
        return result.data
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching campaign: {str(e)}"
        )

