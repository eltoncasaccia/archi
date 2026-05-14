from fastapi import APIRouter, BackgroundTasks, Header, HTTPException

from app.config import settings
from app.models.schemas import PipelineRetryResponse, PipelineStartResponse
from app.pipeline.orchestrator import run_pipeline
from app.services.supabase_client import get_supabase

router = APIRouter(prefix="/pipeline", tags=["pipeline"])


def _verify_secret(x_pipeline_secret: str | None) -> None:
    if x_pipeline_secret != settings.pipeline_secret:
        raise HTTPException(status_code=401, detail="Unauthorized")


@router.post("/start", response_model=PipelineStartResponse)
async def start_pipeline(
    session_id: str,
    background_tasks: BackgroundTasks,
    x_pipeline_secret: str | None = Header(default=None),
):
    _verify_secret(x_pipeline_secret)
    sb = get_supabase()
    background_tasks.add_task(run_pipeline, session_id, sb)
    return PipelineStartResponse(started=True, session_id=session_id)


@router.post("/retry/{session_id}", response_model=PipelineRetryResponse)
async def retry_pipeline(
    session_id: str,
    background_tasks: BackgroundTasks,
    x_pipeline_secret: str | None = Header(default=None),
):
    _verify_secret(x_pipeline_secret)
    sb = get_supabase()

    result = await sb.table("sessions").select("status").eq("id", session_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Sessão não encontrada.")

    if result.data[0]["status"] != "pipeline_error":
        raise HTTPException(status_code=400, detail="Sessão não está em estado de erro.")

    background_tasks.add_task(run_pipeline, session_id, sb)
    return PipelineRetryResponse(retrying=True, session_id=session_id)
