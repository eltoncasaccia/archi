import logging

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.services.supabase_client import get_supabase

logger = logging.getLogger(__name__)

_bearer = HTTPBearer()


async def verify_admin_jwt(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
):
    token = credentials.credentials
    sb = get_supabase()
    try:
        result = await sb.auth.get_user(token)
        if not result or not result.user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido.")
        return result.user
    except HTTPException:
        raise
    except Exception as e:
        logger.error("verify_admin_jwt failed: %s", e)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido ou expirado.")
