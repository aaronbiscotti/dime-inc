"""Profile update routes for ambassador and client profile management."""

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from supabase_client import admin_client
from core.security import get_current_user
from core.validation import SecureStringField
from typing import Optional
from datetime import datetime, timezone

router = APIRouter()


class AmbassadorProfileUpdate(BaseModel):
    """Input model for updating ambassador profile - ONLY fields users can modify."""
    full_name: Optional[SecureStringField] = Field(None, max_length=100)
    bio: Optional[SecureStringField] = Field(None, max_length=500)
    location: Optional[SecureStringField] = Field(None, max_length=100)
    instagram_handle: Optional[SecureStringField] = Field(None, max_length=50)
    tiktok_handle: Optional[SecureStringField] = Field(None, max_length=50)
    twitter_handle: Optional[SecureStringField] = Field(None, max_length=50)
    profile_photo_url: Optional[SecureStringField] = Field(None, max_length=500)
    
    class Config:
        # Prevent any additional fields from being accepted
        extra = 'forbid'


class AmbassadorProfileRead(BaseModel):
    """Output model for ambassador profile - ALL fields including system fields."""
    id: str
    user_id: str
    full_name: str
    bio: Optional[str] = None
    location: Optional[str] = None
    instagram_handle: Optional[str] = None
    tiktok_handle: Optional[str] = None
    twitter_handle: Optional[str] = None
    profile_photo_url: Optional[str] = None
    niche: Optional[list] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class ClientProfileUpdate(BaseModel):
    """Input model for updating client profile - ONLY fields users can modify."""
    company_name: Optional[SecureStringField] = Field(None, max_length=100)
    company_description: Optional[SecureStringField] = Field(None, max_length=1000)
    industry: Optional[SecureStringField] = Field(None, max_length=50)
    website: Optional[SecureStringField] = Field(None, max_length=200)
    logo_url: Optional[SecureStringField] = Field(None, max_length=500)
    
    class Config:
        # Prevent any additional fields from being accepted
        extra = 'forbid'


class ClientProfileRead(BaseModel):
    """Output model for client profile - ALL fields including system fields."""
    id: str
    user_id: str
    company_name: str
    company_description: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


@router.put("/ambassador")
async def update_ambassador_profile(
    profile_data: AmbassadorProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update the current user's ambassador profile.
    Requires authentication.
    """
    try:
        # Check if user has an ambassador profile
        if not current_user.get("profile") or current_user["profile"]["role"] != "ambassador":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is not an ambassador"
            )
        
        ambassador_profile = current_user.get("ambassador_profile")
        if not ambassador_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ambassador profile not found"
            )
        
        # Prepare update data (sanitization handled by Pydantic validators)
        update_data = profile_data.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        # Update the profile
        result = admin_client.table("ambassador_profiles").update(update_data).eq("id", ambassador_profile["id"]).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update profile"
            )
        
        # Return using the proper output model
        profile_response = AmbassadorProfileRead(**result.data[0])
        return {"success": True, "message": "Profile updated successfully", "profile": profile_response}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating profile: {str(e)}"
        )


@router.put("/client")
async def update_client_profile(
    profile_data: ClientProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update the current user's client profile.
    Requires authentication.
    """
    try:
        # Check if user has a client profile
        if not current_user.get("profile") or current_user["profile"]["role"] != "client":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is not a client"
            )
        
        client_profile = current_user.get("client_profile")
        if not client_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Client profile not found"
            )
        
        # Prepare update data (sanitization handled by Pydantic validators)
        update_data = profile_data.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        # Update the profile
        result = admin_client.table("client_profiles").update(update_data).eq("id", client_profile["id"]).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update profile"
            )
        
        # Return using the proper output model
        profile_response = ClientProfileRead(**result.data[0])
        return {"success": True, "message": "Profile updated successfully", "profile": profile_response}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating profile: {str(e)}"
        )

