"""Chat endpoints for managing chat rooms, messages, and participants."""

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Literal
from datetime import datetime, timezone
from uuid import UUID
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
    name: str = Field(..., min_length=1, max_length=100)
    participant_ids: List[str] = Field(..., min_items=1)

    @validator("participant_ids")
    def validate_participant_ids(cls, v):
        """Validate that all participant IDs are valid UUIDs and are unique."""
        if not v:
            raise ValueError("Participant IDs cannot be empty.")
        
        unique_ids = set()
        for user_id in v:
            try:
                # Check if it's a valid UUID
                UUID(user_id)
                unique_ids.add(user_id)
            except (ValueError, TypeError):
                raise ValueError(f"Invalid participant ID format: {user_id}")
        
        # Return a list of unique, validated UUID strings
        return list(unique_ids)


class SendMessageRequest(BaseModel):
    """Request model for sending a message."""
    content: str
    file_url: Optional[str] = None
    reply_to_message_id: Optional[str] = None


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


# Cleanup helper
async def mark_chat_for_cleanup(chat_room_id: str):
    """Mark a chat room for cleanup due to orphaned data.
    Performs best-effort cleanup of messages, participants, chat room record,
    and clears any campaign_ambassadors references to this chat.
    """
    try:
        # Delete messages for this chat
        admin_client.table("messages").delete().eq("chat_room_id", chat_room_id).execute()

        # Delete participants for this chat
        admin_client.table("chat_participants").delete().eq("chat_room_id", chat_room_id).execute()

        # Delete the chat room itself
        admin_client.table("chat_rooms").delete().eq("id", chat_room_id).execute()

        # Clear any campaign_ambassadors references to this chat
        admin_client.table("campaign_ambassadors").update({
            "chat_room_id": None
        }).eq("chat_room_id", chat_room_id).execute()
    except Exception as e:
        print(f"Error cleaning up chat {chat_room_id}: {e}")

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


@router.post("/groups")
async def create_group_chat(
    request: CreateGroupChatRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a group chat with multiple participants."""
    try:
        user_id = current_user["id"]
        
        # Combine creator and other participants, ensuring no duplicates
        all_participant_ids = {user_id, *request.participant_ids}
        
        # Validate that all participant IDs exist in the 'profiles' table
        for pid in all_participant_ids:
            profile_check = admin_client.table("profiles") \
                .select("id") \
                .eq("id", pid) \
                .maybe_single() \
                .execute()
            if not profile_check.data:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Participant with ID {pid} not found."
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
        
        # Prepare records for all participants
        participant_records = [
            {
                "chat_room_id": chat_room_id,
                "user_id": pid,
                "joined_at": datetime.now(timezone.utc).isoformat()
            }
            for pid in all_participant_ids
        ]
        
        participants = admin_client.table("chat_participants") \
            .insert(participant_records) \
            .execute()
        
        if not participants.data:
            # Rollback: delete the created chat room if adding participants fails
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
        # Catch any other unexpected errors
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
        message_data = {
            "chat_room_id": chat_room_id,
            "sender_id": user_id,
            "content": request.content.strip() if request.content else None,
        }
        
        if request.file_url:
            message_data["file_url"] = request.file_url
        
        if request.reply_to_message_id:
            message_data["reply_to_message_id"] = request.reply_to_message_id
        
        message = admin_client.table("messages") \
            .insert(message_data) \
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
        
        # Get detailed info for all participants in a single query
        user_ids = [p["user_id"] for p in participants.data]
        
        # Get all profiles and role-specific profiles in one query
        profiles_result = admin_client.table("profiles").select("id, role").in_("id", user_ids).execute()
        
        if not profiles_result.data:
            return {"participants": []}
        
        # Group by role
        ambassador_ids = []
        client_ids = []
        for profile in profiles_result.data:
            if profile["role"] == "ambassador":
                ambassador_ids.append(profile["id"])
            else:
                client_ids.append(profile["id"])
        
        participant_details = []
        
        # Get ambassador profiles
        if ambassador_ids:
            ambassadors = admin_client.table("ambassador_profiles").select("*").in_("user_id", ambassador_ids).execute()
            for ambassador in ambassadors.data or []:
                participant_details.append(ParticipantResponse(
                    user_id=ambassador["user_id"],
                    role="ambassador",
                    name=ambassador.get("full_name", ""),
                    profile_photo=ambassador.get("profile_photo_url"),
                    bio=ambassador.get("bio"),
                    location=ambassador.get("location"),
                    niche=ambassador.get("niche"),
                    instagram_handle=ambassador.get("instagram_handle"),
                    tiktok_handle=ambassador.get("tiktok_handle"),
                    twitter_handle=ambassador.get("twitter_handle")
                ))
        
        # Get client profiles
        if client_ids:
            clients = admin_client.table("client_profiles").select("*").in_("user_id", client_ids).execute()
            for client in clients.data or []:
                participant_details.append(ParticipantResponse(
                    user_id=client["user_id"],
                    role="client",
                    name=client.get("company_name", ""),
                    profile_photo=client.get("logo_url"),
                    company_description=client.get("company_description"),
                    industry=client.get("industry"),
                    logo_url=client.get("logo_url"),
                    website=client.get("website")
                ))
        
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
                detail="Other participant not found in this chat."
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


# Endpoint to proactively cleanup orphaned chats (idempotent)
@router.post("/cleanup-orphaned")
async def cleanup_orphaned_chats(
    current_user: dict = Depends(get_current_user)
):
    """Best-effort cleanup for chats that have become orphaned.
    This scans for chat rooms with < 1 participants and removes them.
    """
    try:
        # Find chat rooms with 0 or 1 participants
        chats = admin_client.table("chat_rooms").select("id").execute()
        removed = 0
        if chats and chats.data:
            for chat in chats.data:
                chat_id = chat.get("id")
                if not chat_id:
                    continue
                parts = admin_client.table("chat_participants").select("id").eq("chat_room_id", chat_id).execute()
                count = len(parts.data or [])
                if count <= 1:
                    await mark_chat_for_cleanup(chat_id)
                    removed += 1
        return {"success": True, "removed": removed}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error cleaning orphaned chats: {str(e)}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching other participant: {str(e)}"
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
    """Get all chat rooms for the current user with latest messages and participant info."""
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
        
        # Get all latest messages for all chats in one query
        chat_ids = [chat["id"] for chat in chats.data or []]
        if chat_ids:
            # Get latest messages for all chats
            latest_messages = admin_client.table("messages") \
                .select("chat_room_id, id, content, created_at, sender_id") \
                .in_("chat_room_id", chat_ids) \
                .order("created_at", desc=True) \
                .execute()
            
            # Group messages by chat_room_id and get the latest for each
            messages_by_chat = {}
            for message in latest_messages.data or []:
                chat_id = message["chat_room_id"]
                if chat_id not in messages_by_chat:
                    messages_by_chat[chat_id] = message
        
        # Get all participants for private chats in one query
        private_chat_ids = [chat["id"] for chat in chats.data or [] if not chat.get("is_group")]
        other_participants = {}
        if private_chat_ids:
            participants_result = admin_client.table("chat_participants") \
                .select("chat_room_id, user_id") \
                .in_("chat_room_id", private_chat_ids) \
                .neq("user_id", user_id) \
                .execute()
            
            for participant in participants_result.data or []:
                other_participants[participant["chat_room_id"]] = participant["user_id"]
        
        # Get all participant profiles in one query
        participant_ids = list(other_participants.values())
        participant_profiles = {}
        if participant_ids:
            profiles_result = admin_client.table("profiles").select("id, role").in_("id", participant_ids).execute()
            for profile in profiles_result.data or []:
                participant_profiles[profile["id"]] = profile["role"]
        
        # Get ambassador names
        ambassador_ids = [pid for pid, role in participant_profiles.items() if role == "ambassador"]
        ambassador_names = {}
        if ambassador_ids:
            ambassadors = admin_client.table("ambassador_profiles").select("user_id, full_name").in_("user_id", ambassador_ids).execute()
            for ambassador in ambassadors.data or []:
                ambassador_names[ambassador["user_id"]] = ambassador["full_name"]
        
        # Get client names
        client_ids = [pid for pid, role in participant_profiles.items() if role == "client"]
        client_names = {}
        if client_ids:
            clients = admin_client.table("client_profiles").select("user_id, company_name").in_("user_id", client_ids).execute()
            for client in clients.data or []:
                client_names[client["user_id"]] = client["company_name"]
        
        enriched_chats = []
        for chat in chats.data or []:
            # Add latest message
            chat["latest_message"] = messages_by_chat.get(chat["id"])
            
            # For private chats, get display name from other participant
            if not chat.get("is_group"):
                other_user_id = other_participants.get(chat["id"])
                if other_user_id:
                    role = participant_profiles.get(other_user_id)
                    if role == "ambassador":
                        name = ambassador_names.get(other_user_id)
                        if name:
                            chat["display_name"] = f"Chat with {name}"
                    elif role == "client":
                        name = client_names.get(other_user_id)
                        if name:
                            chat["display_name"] = f"Chat with {name}"
                
                if "display_name" not in chat:
                    chat["display_name"] = "Private Chat"
            else:
                chat["display_name"] = chat.get("name", "Group Chat")
            
            enriched_chats.append(chat)
        
        return {"chats": enriched_chats}
        
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
