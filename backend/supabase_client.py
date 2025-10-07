from supabase import create_client, Client
from config import get_settings

settings = get_settings()

# Admin client with service role key
admin_client: Client = create_client(
    settings.supabase_url,
    settings.supabase_service_role_key
)

# Public client with anon key
public_client: Client = create_client(
    settings.supabase_url,
    settings.supabase_anon_key
)
