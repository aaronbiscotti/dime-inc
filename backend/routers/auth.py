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
        # Directly query the profiles table for the user's email.
        # Note: This assumes an 'email' column exists on your profiles table,
        # which is implied by the '/login' endpoint's logic.
        profile_res = (
            admin_client.table("profiles")
            .select("role")
            .eq("email", request.email.lower())
            .maybe_single()
            .execute()
        )

        if profile_res.data:
            return {"exists": True, "role": profile_res.data.get("role")}
        else:
            return {"exists": False, "role": None}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking user existence: {str(e)}",
        )




@router.post("/login")
async def login(request: SignInRequest, response: Response):
    """
    Sign in a user with Supabase and set secure httpOnly cookie.
    Also returns session data for compatibility.
    """
    try:
        # Get user's actual role first
        profile_res = admin_client.table("profiles").select("role").eq("email", request.email.lower()).maybe_single().execute()
        actual_role = profile_res.data.get("role") if profile_res.data else None

        # Check for role mismatch if an expected_role is provided
        if request.expected_role and actual_role and actual_role != request.expected_role:
            role_name = "brand ambassador" if request.expected_role == "ambassador" else "client"
            user_role_name = "brand ambassador" if actual_role == "ambassador" else "client"
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This is the {role_name} login page. You have a {user_role_name} account."
            )

        # Proceed with sign-in
        auth_response = admin_client.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })

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
            "message": "Login successful",
            "session": auth_response.session
        }
    except HTTPException:
        raise
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
