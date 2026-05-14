import os
from contextlib import asynccontextmanager

import litellm
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import admin, pipeline, session
from app.services.prompt_loader import load_prompts
from app.services.supabase_client import init_supabase
from app.services.tracing import init_langfuse


def _validate_env() -> None:
    required = [
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "LLM_API_KEY",
        "LANGFUSE_PUBLIC_KEY",
        "LANGFUSE_SECRET_KEY",
        "PIPELINE_SECRET",
    ]
    missing = [v for v in required if not os.getenv(v)]
    if missing:
        raise RuntimeError(f"Variáveis de ambiente ausentes: {', '.join(missing)}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    _validate_env()
    settings.configure_llm_key()

    await init_supabase()
    await load_prompts()

    # Initialize LangFuse tracing singleton before removing env vars.
    init_langfuse(
        public_key=settings.langfuse_public_key,
        secret_key=settings.langfuse_secret_key,
        host=settings.langfuse_host,
    )

    # LiteLLM auto-detects LangFuse via env vars and fails (version incompatibility).
    # Prompts are already in memory and tracing is initialized, so we can safely remove these.
    for _key in ("LANGFUSE_PUBLIC_KEY", "LANGFUSE_SECRET_KEY", "LANGFUSE_HOST"):
        os.environ.pop(_key, None)

    yield


app = FastAPI(title="Archi API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(session.router)
app.include_router(admin.router)
app.include_router(pipeline.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
