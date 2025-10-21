"""Authentication routes for user signup, login, and password management."""

from fastapi import APIRouter, HTTPException, status, Response
from pydantic import BaseModel, EmailStr
from supabase_client import admin_client
from typing import Literal
from datetime import timedelta

router = APIRouter()

# Cookie configuration
COOKIE_MAX_AGE = 60 * 60 * 24 * 7  # 7 days in seconds
COOKIE_NAME = "auth_token"

UserRole = Literal["client", "ambassador"]


class SignUpRequest(BaseModel):
    """Request model for user signup with email, password, and role."""
    email: EmailStr
    password: str
    role: UserRole


class SignInRequest(BaseModel):
    """Request model for user login with optional role validation."""
    email: EmailStr
    password: str
    expected_role: UserRole | None = None


class AuthResponse(BaseModel):
    """Response model for authentication operations."""
    message: str
    user_id: str | None = None
    role: UserRole | None = None


class CheckUserRequest(BaseModel):
    """Request model for checking if a user exists."""
    email: EmailStr


@router.post("/check-user-exists")
async def check_user_exists(request: CheckUserRequest) -> dict:
    """Check if a user exists and return their role if they do"""
    try:
        # Query profiles table by joining with auth.users
        result = admin_client.table("profiles").select("id, role").execute()

        # Get user by email from auth
        try:
            # Use admin client to check if user exists
            user_response = admin_client.auth.admin.list_users()
            users = user_response if isinstance(user_response, list) else []

            user = next((u for u in users if u.email == request.email.lower()), None)

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
    Returns comprehensive error messages.
    """
    try:
        # Check if user exists first
        user_check = await check_user_exists(CheckUserRequest(email=request.email))

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


@router.post("/login")
async def login(request: SignInRequest, response: Response):
    """
    Sign in a user with Supabase and set secure httpOnly cookie.
    Also returns session data for compatibility.
    """
    try:
        # Use the admin client to sign the user in
        auth_response = admin_client.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        
        # Extract the access token
        access_token = auth_response.session.access_token
        
        # Set httpOnly cookie with the JWT token
        response.set_cookie(
            key=COOKIE_NAME,
            value=access_token,
            httponly=True,  # Prevents JavaScript access (XSS protection)
            secure=True,     # Only sent over HTTPS in production
            samesite="lax",  # CSRF protection
            max_age=COOKIE_MAX_AGE,
            path="/"
        )
        
        # Return session data (for compatibility, but token should be read from cookie)
        return {
            "message": "Login successful",
            "session": auth_response.session
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid login credentials"
        )


@router.post("/signup")
async def signup(request: SignUpRequest, response: Response):
    """
    Sign up a new user with Supabase and set secure httpOnly cookie.
    Creates user account and initial profile record.
    """
    try:
        # Create user with Supabase Auth
        auth_response = admin_client.auth.sign_up({
            "email": request.email,
            "password": request.password
        })
        
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user account"
            )
        
        user_id = auth_response.user.id
        
        # Create profile record
        profile_data = {
            "id": user_id,
            "role": request.role
        }
        
        admin_client.table("profiles").insert(profile_data).execute()
        
        # If we have a session, set the cookie
        if auth_response.session:
            access_token = auth_response.session.access_token
            
            response.set_cookie(
                key=COOKIE_NAME,
                value=access_token,
                httponly=True,
                secure=True,
                samesite="lax",
                max_age=COOKIE_MAX_AGE,
                path="/"
            )
        
        return {
            "message": "Signup successful",
            "user_id": user_id,
            "role": request.role
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Signup failed: {str(e)}"
        )


@router.post("/logout")
async def logout(response: Response):
    """
    Log out the current user by clearing the auth cookie.
    """
    response.delete_cookie(key=COOKIE_NAME, path="/")
    return {"message": "Logout successful"}


class PasswordResetRequest(BaseModel):
    """Request model for password reset with email and optional redirect URL."""
    email: EmailStr
    redirect_to: str | None = None


@router.post("/reset-password")
async def reset_password(request: PasswordResetRequest):
    """
    Send a password reset email to the user.
    """
    try:
        # Use admin client to send password reset email
        admin_client.auth.reset_password_for_email(
            request.email,
            {"redirect_to": request.redirect_to} if request.redirect_to else {}
        )
        
        return {"message": "Password reset email sent successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send password reset email: {str(e)}"
        )
