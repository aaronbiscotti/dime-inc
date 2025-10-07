from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from supabase_client import admin_client
from typing import Literal

router = APIRouter()

UserRole = Literal["client", "ambassador"]


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    role: UserRole


class SignInRequest(BaseModel):
    email: EmailStr
    password: str
    expected_role: UserRole | None = None


class AuthResponse(BaseModel):
    message: str
    user_id: str | None = None
    role: UserRole | None = None


@router.post("/check-user-exists")
async def check_user_exists(email: EmailStr) -> dict:
    """Check if a user exists and return their role if they do"""
    try:
        # Query profiles table by joining with auth.users
        result = admin_client.table("profiles").select("id, role").execute()

        # Get user by email from auth
        try:
            # Use admin client to check if user exists
            user_response = admin_client.auth.admin.list_users()
            users = user_response if isinstance(user_response, list) else []

            user = next((u for u in users if u.email == email.lower()), None)

            if not user:
                return {"exists": False, "role": None}

            # Get the user's profile to check role
            profile = admin_client.table("profiles").select("role").eq("id", user.id).maybe_single().execute()

            if profile.data:
                return {"exists": True, "role": profile.data["role"]}
            else:
                return {"exists": True, "role": None}  # User exists but no profile yet

        except Exception as e:
            return {"exists": False, "role": None}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking user existence: {str(e)}"
        )


@router.post("/validate-login")
async def validate_login(request: SignInRequest) -> dict:
    """
    Validates login credentials and checks role match.
    Returns comprehensive error messages for enterprise-grade UX.
    """
    try:
        # Check if user exists first
        user_check = await check_user_exists(request.email)

        if not user_check["exists"]:
            return {
                "valid": False,
                "error_type": "user_not_found",
                "message": "No account found with this email address. Please sign up or check your email."
            }

        # If expected_role is provided, check if it matches
        if request.expected_role and user_check["role"]:
            if user_check["role"] != request.expected_role:
                role_name = "brand ambassador" if request.expected_role == "ambassador" else "client"
                user_role_name = "brand ambassador" if user_check["role"] == "ambassador" else "client"
                return {
                    "valid": False,
                    "error_type": "role_mismatch",
                    "message": f"This is the {role_name} login page. You have a {user_role_name} account. Please use the {user_role_name} login page.",
                    "user_role": user_check["role"]
                }

        return {
            "valid": True,
            "role": user_check["role"]
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error validating login: {str(e)}"
        )
