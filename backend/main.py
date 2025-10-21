"""Main FastAPI application entry point for the Dime brand ambassador platform API."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import get_settings
from routers import auth, users, profiles, instagram, campaigns, portfolios, explore, chats, contracts

settings = get_settings()

app = FastAPI(
    title="Dime API",
    description="Backend API for Dime brand ambassador platform",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(profiles.router, prefix="/api/profiles", tags=["profiles"])
app.include_router(instagram.router, prefix="/api/instagram", tags=["instagram"])
app.include_router(campaigns.router, prefix="/api/campaigns", tags=["campaigns"])
app.include_router(portfolios.router, prefix="/api/portfolios", tags=["portfolios"])
app.include_router(explore.router, prefix="/api/explore", tags=["explore"])
app.include_router(chats.router, prefix="/api/chats", tags=["chats"])
app.include_router(contracts.router, prefix="/api/contracts", tags=["contracts"])


@app.get("/")
async def root():
    """Returns basic API information and version."""
    return {"message": "Dime API v1.0.0"}


@app.get("/health")
async def health():
    """Health check endpoint to verify API availability."""
    return {"status": "healthy"}
