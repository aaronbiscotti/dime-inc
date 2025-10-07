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
    Delete a user and all their associated data.
    This replaces the Next.js API route.
    """
    try:
        user_id = request.user_id

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing user_id"
            )

        # Delete related data (cascading deletes should handle most of this)
        # But we'll be explicit for safety

        # Delete chat participants
        admin_client.table("chat_participants").delete().eq("user_id", user_id).execute()

        # Delete messages
        admin_client.table("messages").delete().eq("sender_id", user_id).execute()

        # Get profile to determine role
        profile = admin_client.table("profiles").select("id, role").eq("id", user_id).maybe_single().execute()

        if profile.data:
            role = profile.data["role"]

            # Delete role-specific profile
            if role == "ambassador":
                # Get ambassador_profile id first
                amb_profile = admin_client.table("ambassador_profiles").select("id").eq("user_id", user_id).maybe_single().execute()
                if amb_profile.data:
                    # Delete portfolios
                    admin_client.table("portfolios").delete().eq("ambassador_id", amb_profile.data["id"]).execute()
                    # Delete bids
                    admin_client.table("bids").delete().eq("ambassador_id", amb_profile.data["id"]).execute()
                    # Delete ambassador profile
                    admin_client.table("ambassador_profiles").delete().eq("user_id", user_id).execute()

            elif role == "client":
                # Get client_profile id first
                client_profile = admin_client.table("client_profiles").select("id").eq("user_id", user_id).maybe_single().execute()
                if client_profile.data:
                    # Delete bids
                    admin_client.table("bids").delete().eq("client_id", client_profile.data["id"]).execute()
                    # Delete client profile
                    admin_client.table("client_profiles").delete().eq("user_id", user_id).execute()

        # Delete main profile
        admin_client.table("profiles").delete().eq("id", user_id).execute()

        # Delete from auth
        result = admin_client.auth.admin.delete_user(user_id)

        return DeleteUserResponse(
            success=True,
            message="User deleted successfully"
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting user: {str(e)}"
        )
