from supabase import AsyncClient, acreate_client

from app.config import settings

_client: AsyncClient | None = None


async def init_supabase() -> None:
    global _client
    _client = await acreate_client(settings.supabase_url, settings.supabase_service_role_key)


def get_supabase() -> AsyncClient:
    if _client is None:
        raise RuntimeError("Supabase client not initialized")
    return _client
