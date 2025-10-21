"""Chat endpoints for managing chat rooms, messages, and participants."""

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import List, Optional, Literal
from datetime import datetime, timezone
from supabase_client import admin_client
from core.security import get_current_user

router = APIRouter()

UserRole = Literal["client", "ambassador"]


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class CreateChatRequest(BaseModel):
    """Request model for creating a private chat."""
    participant_id: str
    participant_name: Optional[str] = None
    participant_role: UserRole


class CreateGroupChatRequest(BaseModel):
    """Request model for creating a group chat."""
    name: str
    participant_ids: List[str]


class SendMessageRequest(BaseModel):
    """Request model for sending a message."""
    content: str
    file_url: Optional[str] = None


class ChatRoomResponse(BaseModel):
    """Response model for chat room data."""
    id: str
    name: Optional[str]
    is_group: bool
    created_by: str
    created_at: str
    updated_at: str


class MessageResponse(BaseModel):
    """Response model for message data."""
    id: str
    chat_room_id: str
    sender_id: str
    content: Optional[str]
    file_url: Optional[str]
    created_at: str


class ParticipantResponse(BaseModel):
    """Response model for chat participant data."""
    user_id: str
    role: UserRole
    name: str
    profile_photo: Optional[str] = None
    # Ambassador-specific fields
    bio: Optional[str] = None
    location: Optional[str] = None
    niche: Optional[List[str]] = None
    instagram_handle: Optional[str] = None
    tiktok_handle: Optional[str] = None
    twitter_handle: Optional[str] = None
    # Client-specific fields
    company_description: Optional[str] = None
    industry: Optional[str] = None
    logo_url: Optional[str] = None
    website: Optional[str] = None


class AddParticipantRequest(BaseModel):
    """Request model for adding a participant to a chat."""
    user_id: str


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def check_chat_membership(chat_room_id: str, user_id: str) -> bool:
    """Check if a user is a member of a chat room."""
    try:
        result = admin_client.table("chat_participants") \
            .select("id") \
            .eq("chat_room_id", chat_room_id) \
            .eq("user_id", user_id) \
            .maybe_single() \
            .execute()
        
        # Check if result exists and has data
        if result and result.data is not None:
            return True
        return False
    except Exception as e:
        print(f"Error checking chat membership: {e}")
        return False


def get_participant_info(user_id: str) -> Optional[ParticipantResponse]:
    """Get detailed participant information including role-specific profile."""
    try:
        # Get user's role
        profile = admin_client.table("profiles") \
            .select("role") \
            .eq("id", user_id) \
            .maybe_single() \
            .execute()
        
        if not profile or not profile.data:
            return None
        
        role = profile.data["role"]
        
        # Get role-specific profile
        if role == "ambassador":
            ambassador = admin_client.table("ambassador_profiles") \
                .select("*") \
                .eq("user_id", user_id) \
                .maybe_single() \
                .execute()
            
            if not ambassador or not ambassador.data:
                return None
            
            return ParticipantResponse(
                user_id=user_id,
                role="ambassador",
                name=ambassador.data.get("full_name", ""),
                profile_photo=ambassador.data.get("profile_photo_url"),
                bio=ambassador.data.get("bio"),
                location=ambassador.data.get("location"),
                niche=ambassador.data.get("niche"),
                instagram_handle=ambassador.data.get("instagram_handle"),
                tiktok_handle=ambassador.data.get("tiktok_handle"),
                twitter_handle=ambassador.data.get("twitter_handle")
            )
        else:  # client
            client = admin_client.table("client_profiles") \
                .select("*") \
                .eq("user_id", user_id) \
                .maybe_single() \
                .execute()
            
            if not client or not client.data:
                return None
            
            return ParticipantResponse(
                user_id=user_id,
                role="client",
                name=client.data.get("company_name", ""),
                profile_photo=client.data.get("logo_url"),
                company_description=client.data.get("company_description"),
                industry=client.data.get("industry"),
                logo_url=client.data.get("logo_url"),
                website=client.data.get("website")
            )
    except Exception as e:
        print(f"Error getting participant info: {e}")
        return None


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post("/create")
async def create_private_chat(
    request: CreateChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a private chat between current user and another user.
    Returns existing chat if one already exists between these users.
    """
    try:
        user_id = current_user["id"]
        
        # Check if a private chat already exists between these two users
        # Query chat_participants for rooms that have both users
        participant_check = admin_client.table("chat_participants") \
            .select("chat_room_id") \
            .eq("user_id", user_id) \
            .execute()
        
        if participant_check.data:
            # Check each chat room to see if the other user is also in it
            for participant in participant_check.data:
                chat_room_id = participant["chat_room_id"]
                
                # Get the chat room to check if it's a group chat
                chat_room = admin_client.table("chat_rooms") \
                    .select("id, is_group") \
                    .eq("id", chat_room_id) \
                    .maybe_single() \
                    .execute()
                
                # Skip group chats
                if chat_room.data and chat_room.data.get("is_group"):
                    continue
                
                # Check if the other user is in this chat
                other_participant = admin_client.table("chat_participants") \
                    .select("id") \
                    .eq("chat_room_id", chat_room_id) \
                    .eq("user_id", request.participant_id) \
                    .maybe_single() \
                    .execute()
                
                if other_participant.data:
                    # Found existing chat!
                    return {
                        "chat": chat_room.data,
                        "existed": True,
                        "message": "Found existing private chat"
                    }
        
        # No existing chat found, create new one
        # Create a neutral chat name using sorted user IDs
        sorted_ids = sorted([user_id, request.participant_id])
        chat_name = f"chat_{sorted_ids[0]}_{sorted_ids[1]}"
        
        # Create the chat room
        chat_room = admin_client.table("chat_rooms") \
            .insert({
                "name": chat_name,
                "is_group": False,
                "created_by": user_id,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }) \
            .execute()
        
        if not chat_room.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create chat room"
            )
        
        chat_room_id = chat_room.data[0]["id"]
        
        # Add both participants
        participants = admin_client.table("chat_participants") \
            .insert([
                {"chat_room_id": chat_room_id, "user_id": user_id, "joined_at": datetime.now(timezone.utc).isoformat()},
                {"chat_room_id": chat_room_id, "user_id": request.participant_id, "joined_at": datetime.now(timezone.utc).isoformat()}
            ]) \
            .execute()
        
        if not participants.data:
            # Rollback: delete the chat room
            admin_client.table("chat_rooms").delete().eq("id", chat_room_id).execute()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to add participants to chat"
            )
        
        return {
            "chat": chat_room.data[0],
            "existed": False,
            "message": "Created new private chat"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating chat: {str(e)}"
        )


@router.post("/group")
async def create_group_chat(
    request: CreateGroupChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a group chat with multiple participants."""
    try:
        user_id = current_user["id"]
        
        if len(request.participant_ids) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Group chat requires at least 2 other participants"
            )
        
        # Create the chat room
        chat_room = admin_client.table("chat_rooms") \
            .insert({
                "name": request.name,
                "is_group": True,
                "created_by": user_id,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }) \
            .execute()
        
        if not chat_room.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create group chat room"
            )
        
        chat_room_id = chat_room.data[0]["id"]
        
        # Add creator + all participants
        participant_records = [{"chat_room_id": chat_room_id, "user_id": user_id, "joined_at": datetime.now(timezone.utc).isoformat()}]
        participant_records.extend([
            {"chat_room_id": chat_room_id, "user_id": pid, "joined_at": datetime.now(timezone.utc).isoformat()}
            for pid in request.participant_ids
        ])
        
        participants = admin_client.table("chat_participants") \
            .insert(participant_records) \
            .execute()
        
        if not participants.data:
            # Rollback
            admin_client.table("chat_rooms").delete().eq("id", chat_room_id).execute()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to add participants to group chat"
            )
        
        return {
            "chat": chat_room.data[0],
            "message": "Group chat created successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating group chat: {str(e)}"
        )


@router.get("/{chat_room_id}")
async def get_chat_room(
    chat_room_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get chat room details."""
    try:
        user_id = current_user["id"]
        
        # Check membership
        if not check_chat_membership(chat_room_id, user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this chat"
            )
        
        # Get chat room
        chat_room = admin_client.table("chat_rooms") \
            .select("*") \
            .eq("id", chat_room_id) \
            .maybe_single() \
            .execute()
        
        if not chat_room.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat room not found"
            )
        
        return chat_room.data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching chat room: {str(e)}"
        )


@router.post("/{chat_room_id}/messages")
async def send_message(
    chat_room_id: str,
    request: SendMessageRequest,
    current_user: dict = Depends(get_current_user)
):
    """Send a message to a chat room."""
    try:
        user_id = current_user["id"]
        
        # Check membership
        if not check_chat_membership(chat_room_id, user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this chat"
            )
        
        # Send message
        message = admin_client.table("messages") \
            .insert({
                "chat_room_id": chat_room_id,
                "sender_id": user_id,
                "content": request.content.strip() if request.content else None,
                "file_url": request.file_url
            }) \
            .execute()
        
        if not message.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send message"
            )
        
        return {
            "message": message.data[0],
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error sending message: {str(e)}"
        )


@router.get("/{chat_room_id}/messages")
async def get_messages(
    chat_room_id: str,
    limit: int = 50,
    offset: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """Get messages from a chat room."""
    try:
        user_id = current_user["id"]
        
        # Check membership
        if not check_chat_membership(chat_room_id, user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this chat"
            )
        
        # Get messages
        messages = admin_client.table("messages") \
            .select("*") \
            .eq("chat_room_id", chat_room_id) \
            .order("created_at", desc=False) \
            .range(offset, offset + limit - 1) \
            .execute()
        
        return {
            "messages": messages.data or [],
            "count": len(messages.data) if messages.data else 0
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching messages: {str(e)}"
        )


@router.get("/{chat_room_id}/participants")
async def get_chat_participants(
    chat_room_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all participants in a chat room with their profile information."""
    try:
        user_id = current_user["id"]
        
        # Check membership
        if not check_chat_membership(chat_room_id, user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this chat"
            )
        
        # Get all participant user IDs
        participants = admin_client.table("chat_participants") \
            .select("user_id") \
            .eq("chat_room_id", chat_room_id) \
            .execute()
        
        if not participants.data:
            return {"participants": []}
        
        # Get detailed info for each participant
        participant_details = []
        for participant in participants.data:
            participant_id = participant["user_id"]
            info = get_participant_info(participant_id)
            if info:
                participant_details.append(info)
        
        return {"participants": participant_details}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching participants: {str(e)}"
        )


@router.get("/{chat_room_id}/other-participant")
async def get_other_participant(
    chat_room_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get the other participant in a private chat (not the current user).
    This endpoint is specifically for 1-on-1 chats.
    """
    try:
        user_id = current_user["id"]
        
        # Check membership
        if not check_chat_membership(chat_room_id, user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this chat"
            )
        
        # Get all participants except current user
        participants = admin_client.table("chat_participants") \
            .select("user_id") \
            .eq("chat_room_id", chat_room_id) \
            .neq("user_id", user_id) \
            .execute()
        
        if not participants.data or len(participants.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No other participant found in this chat"
            )
        
        # For private chats, there should be exactly one other participant
        other_user_id = participants.data[0]["user_id"]
        
        # Get detailed participant info
        participant_info = get_participant_info(other_user_id)
        
        if not participant_info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Participant profile not found"
            )
        
        return {"participant": participant_info}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching other participant: {str(e)}"
        )


@router.post("/{chat_room_id}/participants")
async def add_participant(
    chat_room_id: str,
    request: AddParticipantRequest,
    current_user: dict = Depends(get_current_user)
):
    """Add a participant to a group chat (only group chats allow this)."""
    try:
        user_id = current_user["id"]
        
        # Check membership
        if not check_chat_membership(chat_room_id, user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this chat"
            )
        
        # Check if it's a group chat
        chat_room = admin_client.table("chat_rooms") \
            .select("is_group, created_by") \
            .eq("id", chat_room_id) \
            .maybe_single() \
            .execute()
        
        if not chat_room.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat room not found"
            )
        
        if not chat_room.data["is_group"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot add participants to private chats"
            )
        
        # Check if user is already a participant
        existing = admin_client.table("chat_participants") \
            .select("id") \
            .eq("chat_room_id", chat_room_id) \
            .eq("user_id", request.user_id) \
            .maybe_single() \
            .execute()
        
        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already a participant"
            )
        
        # Add participant
        participant = admin_client.table("chat_participants") \
            .insert({
                "chat_room_id": chat_room_id,
                "user_id": request.user_id,
                "joined_at": datetime.now(timezone.utc).isoformat()
            }) \
            .execute()
        
        if not participant.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to add participant"
            )
        
        return {
            "success": True,
            "message": "Participant added successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error adding participant: {str(e)}"
        )


@router.delete("/{chat_room_id}/participants/{user_id}")
async def remove_participant(
    chat_room_id: str,
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Remove a participant from a group chat."""
    try:
        current_user_id = current_user["id"]
        
        # Check membership
        if not check_chat_membership(chat_room_id, current_user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this chat"
            )
        
        # Check if it's a group chat
        chat_room = admin_client.table("chat_rooms") \
            .select("is_group, created_by") \
            .eq("id", chat_room_id) \
            .maybe_single() \
            .execute()
        
        if not chat_room.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat room not found"
            )
        
        if not chat_room.data["is_group"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove participants from private chats"
            )
        
        # Only chat creator or the user themselves can remove the participant
        if current_user_id != chat_room.data["created_by"] and current_user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only chat creator or the user themselves can remove participants"
            )
        
        # Remove participant
        result = admin_client.table("chat_participants") \
            .delete() \
            .eq("chat_room_id", chat_room_id) \
            .eq("user_id", user_id) \
            .execute()
        
        return {
            "success": True,
            "message": "Participant removed successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error removing participant: {str(e)}"
        )


@router.delete("/{chat_room_id}")
async def delete_chat(
    chat_room_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a chat room and all associated data.
    Only the creator can delete a chat.
    """
    try:
        user_id = current_user["id"]
        
        # Get chat room
        chat_room = admin_client.table("chat_rooms") \
            .select("created_by") \
            .eq("id", chat_room_id) \
            .maybe_single() \
            .execute()
        
        if not chat_room.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat room not found"
            )
        
        # Only creator can delete
        if chat_room.data["created_by"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the chat creator can delete the chat"
            )
        
        # Delete contracts that reference campaign_ambassadors linked to this chat
        try:
            # First, get all campaign_ambassadors linked to this chat
            campaign_ambassadors = admin_client.table("campaign_ambassadors") \
                .select("id") \
                .eq("chat_room_id", chat_room_id) \
                .execute()
            
            if campaign_ambassadors.data:
                campaign_ambassador_ids = [ca["id"] for ca in campaign_ambassadors.data]
                
                # Delete contracts that reference these campaign_ambassadors
                admin_client.table("contracts") \
                    .delete() \
                    .in_("campaign_ambassador_id", campaign_ambassador_ids) \
                    .execute()
                
                # Now delete the campaign_ambassadors
                admin_client.table("campaign_ambassadors") \
                    .delete() \
                    .eq("chat_room_id", chat_room_id) \
                    .execute()
        except Exception as e:
            print(f"Note: No campaign_ambassadors or contracts to delete: {e}")
        
        # Delete messages (cascade should handle this, but be explicit)
        admin_client.table("messages") \
            .delete() \
            .eq("chat_room_id", chat_room_id) \
            .execute()
        
        # Delete participants
        admin_client.table("chat_participants") \
            .delete() \
            .eq("chat_room_id", chat_room_id) \
            .execute()
        
        # Delete the chat room itself
        admin_client.table("chat_rooms") \
            .delete() \
            .eq("id", chat_room_id) \
            .execute()
        
        return {
            "success": True,
            "message": "Chat deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting chat: {str(e)}"
        )


@router.get("/")
async def get_user_chats(
    current_user: dict = Depends(get_current_user)
):
    """Get all chat rooms for the current user."""
    try:
        user_id = current_user["id"]
        
        # Get all chat room IDs for this user
        participants = admin_client.table("chat_participants") \
            .select("chat_room_id") \
            .eq("user_id", user_id) \
            .execute()
        
        if not participants.data:
            return {"chats": []}
        
        # Get chat room details for each
        chat_room_ids = [p["chat_room_id"] for p in participants.data]
        
        chats = admin_client.table("chat_rooms") \
            .select("*") \
            .in_("id", chat_room_ids) \
            .order("updated_at", desc=True) \
            .execute()
        
        return {"chats": chats.data or []}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching user chats: {str(e)}"
        )


@router.get("/{chat_room_id}/contract")
async def get_chat_contract(
    chat_room_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get contract associated with a chat room (via campaign_ambassadors)."""
    try:
        user_id = current_user["id"]
        
        # Check membership
        if not check_chat_membership(chat_room_id, user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this chat"
            )
        
        # Find campaign_ambassador for this chat
        ca_result = admin_client.table("campaign_ambassadors") \
            .select("id") \
            .eq("chat_room_id", chat_room_id) \
            .maybe_single() \
            .execute()
        
        if not ca_result or not ca_result.data:
            return {
                "contract": None,
                "message": "No campaign associated with this chat"
            }
        
        # Find contract for this campaign_ambassador
        contract_result = admin_client.table("contracts") \
            .select("*") \
            .eq("campaign_ambassador_id", ca_result.data["id"]) \
            .maybe_single() \
            .execute()
        
        if not contract_result or not contract_result.data:
            return {
                "contract": None,
                "message": "No contract found for this chat"
            }
        
        return {"contract": contract_result.data}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching chat contract: {str(e)}"
        )


@router.get("/{chat_room_id}/campaign-info")
async def get_chat_campaign_info(
    chat_room_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get campaign and ambassador information for a chat room (for contract creation)."""
    try:
        user_id = current_user["id"]
        
        # Check membership
        if not check_chat_membership(chat_room_id, user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this chat"
            )
        
        # Find campaign_ambassador for this chat
        ca_result = admin_client.table("campaign_ambassadors") \
            .select("id, campaign_id, ambassador_id") \
            .eq("chat_room_id", chat_room_id) \
            .maybe_single() \
            .execute()
        
        if not ca_result or not ca_result.data:
            return {
                "campaign": None,
                "ambassador": None,
                "message": "No campaign associated with this chat"
            }
        
        ca_data = ca_result.data
        
        # Get campaign details
        campaign_result = admin_client.table("campaigns") \
            .select("id, title, client_id") \
            .eq("id", ca_data["campaign_id"]) \
            .maybe_single() \
            .execute()
        
        # Get ambassador details
        ambassador_result = admin_client.table("ambassador_profiles") \
            .select("id, user_id, full_name, instagram_handle") \
            .eq("id", ca_data["ambassador_id"]) \
            .maybe_single() \
            .execute()
        
        return {
            "campaign": campaign_result.data if campaign_result.data else None,
            "ambassador": ambassador_result.data if ambassador_result.data else None,
            "campaign_ambassador_id": ca_data["id"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching chat campaign info: {str(e)}"
        )

