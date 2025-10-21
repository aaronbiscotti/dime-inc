"""Campaign management routes for creating and browsing brand campaigns."""

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field, field_validator
from supabase_client import admin_client
from core.security import get_current_user
from typing import Optional, List
from datetime import datetime, timezone
import re
import uuid

router = APIRouter()

# Campaign status constants
CAMPAIGN_STATUS_DRAFT = 'draft'
CAMPAIGN_STATUS_ACTIVE = 'active'
CAMPAIGN_STATUS_COMPLETED = 'completed'
CAMPAIGN_STATUS_CANCELLED = 'cancelled'


def generate_chat_name(ambassador_username: str, campaign_title: str) -> str:
    """
    Generate a meaningful chat name from ambassador username and campaign title.
    
    Args:
        ambassador_username: The ambassador's username/handle
        campaign_title: The campaign title
        
    Returns:
        A formatted chat name string
    """
    # Clean and format the inputs
    ambassador_clean = ambassador_username.strip().replace('@', '')
    campaign_clean = campaign_title.strip()
    
    # Create a readable chat name
    chat_name = f"{ambassador_clean} - {campaign_clean}"
    
    # Ensure it's not too long (database might have limits)
    if len(chat_name) > 100:
        # Truncate campaign title if needed
        max_campaign_length = 100 - len(ambassador_clean) - 3  # 3 for " - "
        campaign_truncated = campaign_clean[:max_campaign_length] + "..." if len(campaign_clean) > max_campaign_length else campaign_clean
        chat_name = f"{ambassador_clean} - {campaign_truncated}"
    
    return chat_name


class CampaignMetadata(BaseModel):
    """Metadata model for campaign targeting and requirements."""
    target_niches: List[str]
    campaign_type: str
    deliverables: List[str]
    requirements: List[str]


class CreateCampaignRequest(BaseModel):
    """Input model for creating a new campaign - ONLY fields users can provide."""
    title: str
    description: str
    budget: str
    timeline: str
    requirements: str  # Changed from List[str] to str to match database
    target_niches: List[str] = []
    campaign_type: str = ""
    deliverables: List[str] = []


class CampaignRead(BaseModel):
    """Output model for campaign - ALL fields including system fields."""
    id: str
    client_id: str
    title: str
    description: str
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    deadline: Optional[str] = None
    requirements: Optional[str] = None
    status: str
    max_ambassadors: Optional[int] = None
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
        print(f"Received campaign data: {campaign}")
        
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
        
        # Prepare campaign metadata (store structured data in requirements field)
        import json
        campaign_metadata = {
            "requirements": campaign.requirements,
            "target_niches": campaign.target_niches,
            "campaign_type": campaign.campaign_type,
            "deliverables": campaign.deliverables
        }
        
        # Store structured metadata as JSON in requirements field
        requirements_json = json.dumps(campaign_metadata)
        
        # Parse budget range (e.g., "$100 - $200" or "$500")
        try:
            budget_str = campaign.budget.replace('$', '').replace(',', '').strip()
            if ' - ' in budget_str:
                # Range format: "100 - 200"
                min_str, max_str = budget_str.split(' - ')
                budget_min = float(min_str.strip())
                budget_max = float(max_str.strip())
            else:
                # Single value format: "500"
                budget_value = float(budget_str)
                budget_min = budget_value
                budget_max = budget_value
        except:
            budget_min = 0
            budget_max = 0
        
        # Create campaign in campaigns table
        result = admin_client.table("campaigns").insert({
            "client_id": client_profile["id"],
            "title": campaign.title,
            "description": campaign.description,
            "budget_min": budget_min,
            "budget_max": budget_max,
            "deadline": campaign.timeline if campaign.timeline != "No deadline" else None,
            "requirements": requirements_json,  # Store structured data as JSON
            "status": CAMPAIGN_STATUS_DRAFT,
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
        client_profile = current_user.get("client_profile")
        if not client_profile or client_profile["id"] != client_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view these campaigns"
            )
        
        # Fetch campaigns for this client
        result = admin_client.table("campaigns").select("*").eq("client_id", client_id).order("created_at", desc=True).execute()
        
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
        # Fetch all active campaigns
        result = admin_client.table("campaigns").select("*, client_profiles(*)").eq("status", CAMPAIGN_STATUS_ACTIVE).order("created_at", desc=True).execute()
        
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
        result = admin_client.table("campaigns").select("*, client_profiles(*)").eq("id", campaign_id).maybe_single().execute()
        
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


@router.get("/{campaign_id}/ambassadors")
async def get_campaign_ambassadors(
    campaign_id: str, 
    current_user: dict = Depends(get_current_user)
):
    """Get all ambassadors for a specific campaign."""
    try:
        # Verify the campaign exists
        campaign_result = admin_client.table("campaigns").select("id").eq("id", campaign_id).maybe_single().execute()
        if not campaign_result or not campaign_result.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")

        # Efficiently fetch campaign ambassadors with their profiles in one query
        ca_result = admin_client.table("campaign_ambassadors").select("""
            *,
            ambassador_profiles(*)
        """).eq("campaign_id", campaign_id).execute()

        if not ca_result.data:
            return {"data": []}

        ambassadors = []
        for ca in ca_result.data:
            ambassador_profile = ca.get("ambassador_profiles")
            if ambassador_profile:
                ambassadors.append({
                    "id": ambassador_profile["id"],
                    "user_id": ambassador_profile["user_id"], 
                    "full_name": ambassador_profile.get("full_name", "Unknown"),
                    "username": ambassador_profile.get("instagram_handle", ""),
                    "bio": ambassador_profile.get("bio", ""),
                    "niche": ambassador_profile.get("niche", []),
                    "status": ca.get("status", "pending"),
                    "chatroom_id": ca.get("chat_room_id")
                })

        return {"data": ambassadors}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error fetching campaign ambassadors: {str(e)}")


@router.get("/{campaign_id}/ambassador-rows")
async def get_campaign_ambassador_rows(
    campaign_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get campaign-ambassador join table rows for a specific campaign."""
    try:
        # Verify the campaign exists
        campaign_result = admin_client.table("campaigns").select("*").eq("id", campaign_id).maybe_single().execute()
        if not campaign_result or not campaign_result.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found")
        
        # Get campaign ambassador rows
        ca_result = admin_client.table("campaign_ambassadors").select("*").eq("campaign_id", campaign_id).execute()
        
        return {"rows": ca_result.data or []}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error fetching campaign ambassador rows: {str(e)}")


@router.get("/ambassador/{ambassador_id}")
async def get_campaigns_for_ambassador(
    ambassador_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all campaigns for a specific ambassador."""
    try:
        # Verify the ambassador exists
        ambassador_result = admin_client.table("ambassador_profiles").select("*").eq("id", ambassador_id).maybe_single().execute()
        if not ambassador_result or not ambassador_result.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ambassador not found")
        
        # Get campaign-ambassador relationships for this ambassador
        ca_result = admin_client.table("campaign_ambassadors").select("*, campaigns(*)").eq("ambassador_id", ambassador_id).execute()
        
        # Extract campaigns from the relationships
        campaigns = []
        for ca in ca_result.data or []:
            if ca.get("campaigns"):
                campaigns.append(ca["campaigns"])
        
        return {"data": campaigns}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error fetching ambassador campaigns: {str(e)}")


@router.post("/{campaign_id}/ambassadors/{ambassador_id}")
async def add_ambassador_to_campaign(
    campaign_id: str,
    ambassador_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Add an ambassador to a campaign. This creates a campaign_ambassadors relationship
    and a chat room for communication.
    """
    try:
        # Verify user is authorized (must be a client who owns the campaign)
        if not current_user.get("profile") or current_user["profile"]["role"] != "client":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only clients can add ambassadors to campaigns"
            )
        
        client_profile = current_user.get("client_profile")
        if not client_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Client profile not found"
            )
        
        # Verify the campaign exists and belongs to this client
        campaign_result = admin_client.table("campaigns").select("*").eq("id", campaign_id).eq("client_id", client_profile["id"]).maybe_single().execute()
        
        if not campaign_result or not campaign_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign not found or you don't have permission to modify it"
            )
        
        # Verify the ambassador exists
        ambassador_result = admin_client.table("ambassador_profiles").select("*").eq("id", ambassador_id).maybe_single().execute()
        
        if not ambassador_result or not ambassador_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ambassador not found"
            )
        
        # Check if ambassador is already added to this campaign
        existing_ca = admin_client.table("campaign_ambassadors").select("*").eq("campaign_id", campaign_id).eq("ambassador_id", ambassador_id).maybe_single().execute()
        
        if existing_ca and existing_ca.data:
            # Ambassador already added, return existing chat room ID
            return {
                "message": "Ambassador was already added to this campaign",
                "campaign_ambassador_id": existing_ca.data["id"],
                "chat_room_id": existing_ca.data["chat_room_id"]
            }
        
        # Create a chat room for this campaign-ambassador relationship
        chat_room_id = str(uuid.uuid4())
        
        # Generate a meaningful chat name using ambassador username and campaign title
        ambassador_username = ambassador_result.data.get("instagram_handle") or ambassador_result.data.get("full_name", "Ambassador")
        campaign_title = campaign_result.data.get("title", "Campaign")
        chat_name = generate_chat_name(ambassador_username, campaign_title)
        
        # Try to create chat room with explicit RLS bypass
        try:
            chat_room_result = admin_client.table("chat_rooms").insert({
                "id": chat_room_id,
                "name": chat_name,
                "is_group": False,
                "created_by": current_user["id"],  # Add created_by field
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }).execute()
        except Exception as e:
            print(f"Error creating chat room: {e}")
            # Try without explicit timestamps
            chat_room_result = admin_client.table("chat_rooms").insert({
                "id": chat_room_id,
                "name": chat_name,
                "is_group": False,
                "created_by": current_user["id"]  # Add created_by field
            }).execute()
        
        if not chat_room_result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create chat room"
            )
        
        # Add participants to the chat room
        participants_data = [
            {"chat_room_id": chat_room_id, "user_id": current_user["id"], "joined_at": datetime.now(timezone.utc).isoformat()},
            {"chat_room_id": chat_room_id, "user_id": ambassador_result.data["user_id"], "joined_at": datetime.now(timezone.utc).isoformat()}
        ]
        
        participants_result = admin_client.table("chat_participants").insert(participants_data).execute()
        
        if not participants_result.data:
            # Clean up chat room if participants failed
            admin_client.table("chat_rooms").delete().eq("id", chat_room_id).execute()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to add participants to chat room"
            )
        
        # Create the campaign_ambassadors relationship
        ca_id = str(uuid.uuid4())
        ca_result = admin_client.table("campaign_ambassadors").insert({
            "id": ca_id,
            "campaign_id": campaign_id,
            "ambassador_id": ambassador_id,
            "chat_room_id": chat_room_id,
            "status": "proposal_received",  # Changed from "invited" to valid enum value
            "created_at": datetime.now(timezone.utc).isoformat()
            # Removed "updated_at" as it doesn't exist in campaign_ambassadors table
        }).execute()
        
        if not ca_result.data:
            # Clean up chat room and participants if campaign_ambassadors failed
            admin_client.table("chat_participants").delete().eq("chat_room_id", chat_room_id).execute()
            admin_client.table("chat_rooms").delete().eq("id", chat_room_id).execute()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create campaign-ambassador relationship"
            )
        
        # Send automatic welcome message to notify the ambassador
        try:
            campaign_title = campaign_result.data.get("title", "Campaign")
            ambassador_name = ambassador_result.data.get("full_name", "Ambassador")
            
            # Send automatic welcome message with proper error handling
            welcome_message = f"Welcome to {campaign_title}! You've been invited to participate in this campaign. Please review the details and let us know if you're interested!"
            
            message_data = {
                "chat_room_id": chat_room_id,
                "sender_id": current_user["id"],  # System/client sending the message
                "content": welcome_message,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            message_result = admin_client.table("messages").insert(message_data).execute()
            
            if not message_result.data:
                print(f"Warning: Failed to send welcome message to ambassador {ambassador_name}")
                
        except Exception as e:
            print(f"Error: Failed to send welcome message: {e}")
            # Don't fail the entire process, just log the error
        
        return {
            "message": "Ambassador added to campaign successfully",
            "campaign_ambassador_id": ca_id,
            "chat_room_id": chat_room_id
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error adding ambassador to campaign: {str(e)}"
        )


@router.put("/{campaign_id}/status")
async def update_campaign_status(
    campaign_id: str,
    status_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Update campaign status. Only the client who owns the campaign can update it.
    """
    try:
        # Verify user is a client
        if not current_user.get("profile") or current_user["profile"]["role"] != "client":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only clients can update campaign status"
            )
        
        client_profile = current_user.get("client_profile")
        if not client_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Client profile not found"
            )
        
        # Verify the campaign exists and belongs to this client
        campaign_result = admin_client.table("campaigns").select("*").eq("id", campaign_id).eq("client_id", client_profile["id"]).maybe_single().execute()
        
        if not campaign_result or not campaign_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign not found or you don't have permission to modify it"
            )
        
        # Get the new status from the request
        new_status = status_data.get("status")
        if not new_status or new_status not in [CAMPAIGN_STATUS_DRAFT, CAMPAIGN_STATUS_ACTIVE, CAMPAIGN_STATUS_COMPLETED, CAMPAIGN_STATUS_CANCELLED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid status value"
            )
        
        # Update the campaign status
        result = admin_client.table("campaigns").update({
            "status": new_status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", campaign_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update campaign status"
            )
        
        return {
            "success": True,
            "message": f"Campaign status updated to {new_status}"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating campaign status: {str(e)}"
        )


@router.delete("/{campaign_id}")
async def delete_campaign(
    campaign_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a campaign. Only the client who owns the campaign can delete it.
    """
    try:
        # Verify user is a client
        if not current_user.get("profile") or current_user["profile"]["role"] != "client":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only clients can delete campaigns"
            )
        
        client_profile = current_user.get("client_profile")
        if not client_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Client profile not found"
            )
        
        # Verify the campaign exists and belongs to this client
        campaign_result = admin_client.table("campaigns").select("*").eq("id", campaign_id).eq("client_id", client_profile["id"]).maybe_single().execute()
        
        if not campaign_result or not campaign_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign not found or you don't have permission to delete it"
            )
        
        # Delete related records first (due to foreign key constraints)
        # 1. Delete contracts that reference campaign_ambassadors for this campaign
        ca_result = admin_client.table("campaign_ambassadors").select("id").eq("campaign_id", campaign_id).execute()
        
        if ca_result.data:
            ca_ids = [ca["id"] for ca in ca_result.data]
            # Delete contracts
            admin_client.table("contracts").delete().in_("campaign_ambassador_id", ca_ids).execute()
            
            # Delete chat rooms associated with campaign_ambassadors
            chat_room_ids = []
            for ca in ca_result.data:
                ca_detail = admin_client.table("campaign_ambassadors").select("chat_room_id").eq("id", ca["id"]).maybe_single().execute()
                if ca_detail.data and ca_detail.data.get("chat_room_id"):
                    chat_room_ids.append(ca_detail.data["chat_room_id"])
            
            if chat_room_ids:
                # Delete messages, participants, and chat rooms
                admin_client.table("messages").delete().in_("chat_room_id", chat_room_ids).execute()
                admin_client.table("chat_participants").delete().in_("chat_room_id", chat_room_ids).execute()
                admin_client.table("chat_rooms").delete().in_("id", chat_room_ids).execute()
            
            # Delete campaign_ambassadors
            admin_client.table("campaign_ambassadors").delete().eq("campaign_id", campaign_id).execute()
        
        # Finally, delete the campaign itself
        admin_client.table("campaigns").delete().eq("id", campaign_id).execute()
        
        return {
            "message": "Campaign deleted successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting campaign: {str(e)}"
        )


@router.put("/{campaign_id}")
async def update_campaign(
    campaign_id: str,
    campaign_updates: CreateCampaignRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Update a campaign. Only the client who created it can update it.
    """
    try:
        # Verify user is a client
        if not current_user.get("profile") or current_user["profile"]["role"] != "client":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only clients can update campaigns"
            )
        
        client_profile = current_user.get("client_profile")
        if not client_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Client profile not found"
            )
        
        # Verify the campaign exists and belongs to this client
        campaign_result = admin_client.table("campaigns").select("*").eq("id", campaign_id).eq("client_id", client_profile["id"]).maybe_single().execute()
        
        if not campaign_result or not campaign_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign not found or you don't have permission to update it"
            )
        
        # Update the campaign
        update_data = campaign_updates.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        result = admin_client.table("campaigns").update(update_data).eq("id", campaign_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update campaign"
            )
        
        return {"campaign": result.data[0]}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating campaign: {str(e)}"
        )

