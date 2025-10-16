from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from supabase_client import admin_client

router = APIRouter()


class DeleteUserRequest(BaseModel):
    user_id: str


class DeleteUserResponse(BaseModel):
    success: bool
    message: str


@router.delete("/delete")
async def delete_user(request: DeleteUserRequest) -> DeleteUserResponse:
    """
    Atomically delete a user and all their associated data.
    Uses database CASCADE deletes for atomic deletion.

    Deletion order (CASCADE handles automatically):
    1. auth.users deleted → triggers CASCADE on profiles
    2. profiles deleted → triggers CASCADE on:
       - ambassador_profiles → CASCADE on portfolios, campaign_ambassadors
       - client_profiles → CASCADE on campaigns
       - chat_participants → CASCADE deletes orphaned chat_rooms (via trigger)
       - messages

    All deletions are atomic within a database transaction.
    """
    try:
        user_id = request.user_id

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing user_id"
            )

        # Verify user exists
        profile = admin_client.table("profiles").select("id").eq("id", user_id).maybe_single().execute()

        if not profile.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Delete from auth.users - this triggers CASCADE delete on everything
        # The database handles all related deletions automatically:
        # - profiles (ON DELETE CASCADE from auth.users)
        # - ambassador_profiles/client_profiles (ON DELETE CASCADE from profiles)
        # - portfolios (ON DELETE CASCADE from ambassador_profiles)
        # - campaigns (ON DELETE CASCADE from client_profiles)
        # - campaign_ambassadors (ON DELETE CASCADE from campaigns/ambassador_profiles)
        # - chat_participants (ON DELETE CASCADE from profiles)
        # - messages (ON DELETE CASCADE from profiles)
        # - orphaned chat_rooms (via trigger after chat_participants delete)

        admin_client.auth.admin.delete_user(user_id)

        return DeleteUserResponse(
            success=True,
            message="User and all associated data deleted successfully"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting user: {str(e)}"
        )
