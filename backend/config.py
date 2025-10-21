"""Configuration management for the Dime API using environment variables."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    supabase_url: str
    supabase_service_role_key: str
    supabase_anon_key: str
    frontend_url: str = "http://localhost:3000"
    ig_app_id: str
    ig_app_secret: str
    instagram_redirect_uri: str

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Returns cached application settings instance."""
    return Settings()
