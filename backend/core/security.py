"""Security utilities for JWT authentication and user authorization."""

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase_client import admin_client
from typing import Optional

security = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> dict:
    """
    Validate JWT token and return current user data.
    Supports both cookie-based (secure) and Authorization header (legacy) authentication.
    This dependency can be used to protect routes.
    """
    try:
        # Try to get token from httpOnly cookie first (secure method)
        token = request.cookies.get("auth_token")
        
        # Fallback to Authorization header for backward compatibility
        if not token and credentials:
            token = credentials.credentials
        
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Verify the JWT token with Supabase
        user_response = admin_client.auth.get_user(token)
        
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user = user_response.user
        
        # Fetch the user's profile from the database
        profile = admin_client.table("profiles").select("*").eq("id", user.id).maybe_single().execute()
        
        if not profile.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        # Fetch role-specific profile
        role_profile = None
        if profile.data["role"] == "ambassador":
            ambassador = admin_client.table("ambassador_profiles").select("*").eq("user_id", user.id).maybe_single().execute()
            role_profile = ambassador.data if ambassador.data else None
        elif profile.data["role"] == "client":
            client = admin_client.table("client_profiles").select("*").eq("user_id", user.id).maybe_single().execute()
            role_profile = client.data if client.data else None
        
        # Return user data in a format that matches the frontend expectations
        return {
            "id": user.id,
            "email": user.email,
            "profile": profile.data,
            "ambassador_profile": role_profile if profile.data["role"] == "ambassador" else None,
            "client_profile": role_profile if profile.data["role"] == "client" else None,
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user_optional(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
) -> Optional[dict]:
    """
    Optional authentication dependency.
    Returns user data if token is valid, None otherwise.
    """
    # Check if we have a token in cookie or header
    token = request.cookies.get("auth_token") or (credentials.credentials if credentials else None)
    
    if not token:
        return None
    
    try:
        return await get_current_user(request, credentials)
    except HTTPException:
        return None

