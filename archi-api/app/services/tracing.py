import logging
from typing import Optional

from langfuse import Langfuse

logger = logging.getLogger(__name__)

_lf: Optional[Langfuse] = None


def init_langfuse(public_key: str, secret_key: str, host: str) -> None:
    global _lf
    try:
        _lf = Langfuse(public_key=public_key, secret_key=secret_key, host=host)
        logger.info("LangFuse tracing inicializado.")
    except Exception as e:
        logger.warning(f"LangFuse tracing não inicializado: {e}")


def get_langfuse() -> Optional[Langfuse]:
    return _lf
