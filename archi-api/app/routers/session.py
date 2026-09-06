import json
import logging
import re
from datetime import datetime, timedelta, timezone

import litellm
from fastapi import APIRouter, BackgroundTasks, File, HTTPException, UploadFile

logger = logging.getLogger(__name__)
from fastapi.responses import StreamingResponse

from app.config import settings
from app.models.schemas import ApproveDiscoveryResponse, SendMessageRequest, UploadDocumentResponse, ValidateCodeRequest, ValidateCodeResponse
from app.pipeline.orchestrator import run_pipeline
from app.services.prompt_loader import get_prompt
from app.services.supabase_client import get_supabase
from langfuse import get_client, observe

router = APIRouter(prefix="/session", tags=["session"])

_ACTIVE_STATUSES = {"awaiting_start", "interview_in_progress", "awaiting_approval"}
_SESSION_TTL_HOURS = 2
_IDLE_MINUTES = 30

_CPF_RE = re.compile(r"\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b")
_CNPJ_RE = re.compile(r"\b\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}\b")


def _extract_document(text: str) -> str | None:
    if m := _CNPJ_RE.search(text):
        return m.group()
    if m := _CPF_RE.search(text):
        return m.group()
    return None


def _extract_discovery_block(text: str) -> str | None:
    match = re.search(r"\[DISCOVERY_APROVADO\](.*?)\[/DISCOVERY_APROVADO\]", text, re.DOTALL)
    return match.group(0) if match else None


def _extract_field_from_block(block: str, field_name: str) -> str | None:
    """Extrai um campo do bloco estruturado [DISCOVERY_APROVADO]."""
    if not block:
        return None
    # [^\n]+ captures only the current line — avoids over-capturing into subsequent fields
    pattern = rf"{field_name}:\s*([^\n]+)"
    match = re.search(pattern, block)
    if match:
        value = match.group(1).strip()
        return value if value and value != "não mencionado" else None
    return None


def _check_session_expiry(session: dict) -> None:
    now = datetime.now(timezone.utc)

    if session.get("expires_at"):
        expires = datetime.fromisoformat(session["expires_at"].replace("Z", "+00:00"))
        if now >= expires:
            raise HTTPException(status_code=401, detail="session_expired")

    if session.get("last_activity_at"):
        last = datetime.fromisoformat(session["last_activity_at"].replace("Z", "+00:00"))
        if now - last >= timedelta(minutes=_IDLE_MINUTES):
            raise HTTPException(status_code=401, detail="session_expired")


@router.post("/validate-code", response_model=ValidateCodeResponse)
async def validate_code(body: ValidateCodeRequest):
    code = body.code.upper().strip()
    sb = get_supabase()

    result = await sb.table("access_codes").select("*").eq("code", code).execute()
    if not result.data:
        return ValidateCodeResponse(valid=False, error="Código inválido. Verifique e tente novamente.")

    record = result.data[0]

    if record["expires_at"]:
        expires = datetime.fromisoformat(record["expires_at"].replace("Z", "+00:00"))
        if expires < datetime.now(timezone.utc):
            return ValidateCodeResponse(valid=False, error="Este código expirou. Solicite um novo ao responsável.")

    # Session already exists: re-entry or blocked
    if record["session_id"]:
        if record["used_at"]:
            return ValidateCodeResponse(valid=False, error="Este código já foi utilizado. A proposta está em andamento.")
        # Refresh TTL so client can continue where they left off
        now = datetime.now(timezone.utc)
        await sb.table("sessions").update({
            "last_activity_at": now.isoformat(),
            "expires_at": (now + timedelta(hours=_SESSION_TTL_HOURS)).isoformat(),
        }).eq("id", record["session_id"]).execute()
        return ValidateCodeResponse(valid=True, session_id=record["session_id"])

    # First access: create session (used_at stays null until client approves)
    now = datetime.now(timezone.utc)
    session_result = await sb.table("sessions").insert({
        "access_code": code,
        "expires_at": (now + timedelta(hours=_SESSION_TTL_HOURS)).isoformat(),
        "last_activity_at": now.isoformat(),
    }).execute()
    session_id = session_result.data[0]["id"]

    await sb.table("access_codes").update({
        "session_id": session_id,
    }).eq("code", code).execute()

    return ValidateCodeResponse(valid=True, session_id=session_id)


@router.get("/{session_id}/resume")
async def resume_session(session_id: str):
    sb = get_supabase()

    sess_result = await sb.table("sessions").select("status").eq("id", session_id).execute()
    if not sess_result.data:
        raise HTTPException(status_code=404, detail="Sessão não encontrada.")

    status = sess_result.data[0]["status"]

    msgs_result = await sb.table("messages").select("id,role,content").eq("session_id", session_id).order("created_at").execute()

    return {
        "messages": msgs_result.data,
        "status": status,
        "has_pending_approval": status == "awaiting_approval",
    }


@router.post("/{session_id}/message")
async def send_message(session_id: str, body: SendMessageRequest):
    sb = get_supabase()

    sess_result = await sb.table("sessions").select("*").eq("id", session_id).execute()
    if not sess_result.data:
        raise HTTPException(status_code=404, detail="Sessão não encontrada.")

    session = sess_result.data[0]
    _check_session_expiry(session)

    if session["status"] not in _ACTIVE_STATUSES:
        raise HTTPException(status_code=400, detail="Sessão não está ativa para envio de mensagens.")

    if session["message_count"] >= settings.max_messages_per_session:
        return StreamingResponse(_limit_reached_stream("message_count"), media_type="text/event-stream")
    if session["input_tokens"] >= settings.max_input_tokens_per_session:
        return StreamingResponse(_limit_reached_stream("input_tokens"), media_type="text/event-stream")

    doc = _extract_document(body.content)
    if doc and not session.get("client_document"):
        await sb.table("sessions").update({"client_document": doc}).eq("id", session_id).execute()

    if session["status"] == "awaiting_start":
        await sb.table("sessions").update({"status": "interview_in_progress"}).eq("id", session_id).execute()

    await sb.table("sessions").update({
        "last_activity_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", session_id).execute()

    msgs_result = await sb.table("messages").select("role,content").eq("session_id", session_id).order("created_at").execute()
    history = [{"role": m["role"], "content": m["content"]} for m in msgs_result.data]

    await sb.table("messages").insert({
        "session_id": session_id,
        "role": "user",
        "content": body.content,
    }).execute()

    # O prompt declara {contexto_inicial} para receber o que já se sabe do cliente
    # antes da conversa. Não há origem para isso hoje — access_codes não guarda
    # contexto — mas a variável precisa ser preenchida: sem isso o modelo lê o
    # próprio placeholder sob o título "Contexto disponível antes da conversa".
    system_prompt = get_prompt(
        "agent-discovery-interview",
        contexto_inicial="Nenhum contexto prévio sobre este cliente. Conduza a entrevista do zero.",
    )
    llm_messages = [{"role": "system", "content": system_prompt}] + history + [{"role": "user", "content": body.content}]

    return StreamingResponse(
        _stream_response(session_id, llm_messages, session),
        media_type="text/event-stream",
    )


@router.post("/{session_id}/logout")
async def logout_session(session_id: str):
    sb = get_supabase()

    sess_result = await sb.table("sessions").select("id").eq("id", session_id).execute()
    if not sess_result.data:
        raise HTTPException(status_code=404, detail="Sessão não encontrada.")

    # Force-expire the session so any lingering requests are rejected
    await sb.table("sessions").update({
        "expires_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", session_id).execute()

    return {"logged_out": True}


@observe(as_type="generation", name="archi-interview")
def _log_interview_generation(
    session_id: str,
    llm_messages: list,
    full_response: str,
    input_tokens: int,
    output_tokens: int,
) -> str:
    lf = get_client()
    lf.update_current_generation(
        model=settings.litellm_model,
        input=llm_messages,
        output=full_response,
        usage_details={"input": input_tokens, "output": output_tokens},
    )
    lf.update_current_trace(name="archi-interview", session_id=session_id)
    return full_response


async def _limit_reached_stream(reason: str):
    msg = "Chegamos ao limite desta sessão. Para projetos de maior escopo, entre em contato diretamente."
    yield f"data: {json.dumps({'delta': msg})}\n\n"
    yield f"data: {json.dumps({'limit_reached': True})}\n\n"
    yield "data: [DONE]\n\n"


async def _stream_response(session_id: str, llm_messages: list, session: dict):
    sb = get_supabase()
    full_response = ""
    input_tokens_used = 0
    output_tokens_used = 0

    try:
        response = await litellm.acompletion(
            model=settings.litellm_model,
            messages=llm_messages,
            stream=True,
            # Sem isto nenhum chunk carrega usage: input_tokens ficava sempre em 0,
            # o teto de max_input_tokens_per_session nunca disparava e o LangFuse
            # registrava custo zero na entrevista.
            stream_options={"include_usage": True},
        )

        async for chunk in response:
            # O chunk final de usage vem sem choices em vários providers.
            if chunk.choices:
                delta = chunk.choices[0].delta.content or ""
                if delta:
                    full_response += delta
                    yield f"data: {json.dumps({'delta': delta})}\n\n"

            usage = getattr(chunk, "usage", None)
            if usage:
                input_tokens_used = usage.prompt_tokens or 0
                output_tokens_used = usage.completion_tokens or 0

    except Exception as e:
        logger.error("LLM call failed: %s: %s", type(e).__name__, e)
        yield f"data: {json.dumps({'error': str(e)})}\n\n"
        yield "data: [DONE]\n\n"
        return

    await sb.table("messages").insert({
        "session_id": session_id,
        "role": "assistant",
        "content": full_response,
    }).execute()

    await sb.table("sessions").update({
        "message_count": session["message_count"] + 1,
        "input_tokens": session["input_tokens"] + input_tokens_used,
    }).eq("id", session_id).execute()

    _log_interview_generation(session_id, llm_messages, full_response, input_tokens_used, output_tokens_used)

    yield "data: [DONE]\n\n"


_ALLOWED_UPLOAD_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


@router.post("/{session_id}/upload-document", response_model=UploadDocumentResponse)
async def upload_document(session_id: str, file: UploadFile = File(...)):
    sb = get_supabase()

    sess_result = await sb.table("sessions").select("*").eq("id", session_id).execute()
    if not sess_result.data:
        raise HTTPException(status_code=404, detail="Sessão não encontrada.")
    session = sess_result.data[0]
    _check_session_expiry(session)

    if session["status"] not in _ACTIVE_STATUSES:
        raise HTTPException(status_code=400, detail="Sessão não está ativa.")

    file_bytes = await file.read()
    max_bytes = settings.max_file_size_mb * 1024 * 1024
    if len(file_bytes) > max_bytes:
        raise HTTPException(status_code=413, detail=f"Arquivo excede {settings.max_file_size_mb} MB.")

    content_type = file.content_type or ""
    filename = file.filename or "documento"
    if content_type not in _ALLOWED_UPLOAD_TYPES and not filename.lower().endswith((".pdf", ".docx")):
        raise HTTPException(status_code=415, detail="Formato não suportado. Envie PDF ou DOCX.")

    from app.services.document_parser import extract_text
    try:
        extracted = extract_text(file_bytes, content_type, filename)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Não foi possível extrair o texto: {e}")

    if not extracted.strip():
        raise HTTPException(status_code=422, detail="O documento não contém texto legível.")

    return UploadDocumentResponse(
        filename=filename,
        extracted_text=extracted,
        char_count=len(extracted),
    )


@router.post("/{session_id}/approve", response_model=ApproveDiscoveryResponse)
async def approve_session(session_id: str, background_tasks: BackgroundTasks):
    sb = get_supabase()

    sess_result = await sb.table("sessions").select("*").eq("id", session_id).execute()
    if not sess_result.data:
        raise HTTPException(status_code=404, detail="Sessão não encontrada.")

    session = sess_result.data[0]
    _check_session_expiry(session)

    msgs_result = await sb.table("messages").select("role,content").eq("session_id", session_id).order("created_at", desc=True).limit(10).execute()
    discovery_block = None
    for msg in msgs_result.data:
        if msg["role"] == "assistant":
            discovery_block = _extract_discovery_block(msg["content"])
            if discovery_block:
                break

    update_fields = {
        "status": "pipeline_pending",
        "discovery_approved": discovery_block or "",
        "last_activity_at": datetime.now(timezone.utc).isoformat(),
    }

    if discovery_block:
        client_name = _extract_field_from_block(discovery_block, "nome_cliente")
        client_email = _extract_field_from_block(discovery_block, "email_cliente")
        if client_name:
            update_fields["client_name"] = client_name
        if client_email:
            update_fields["client_email"] = client_email

    await sb.table("sessions").update(update_fields).eq("id", session_id).execute()

    # Mark code as used: from this point the client can no longer re-enter
    await sb.table("access_codes").update({
        "used_at": datetime.now(timezone.utc).isoformat(),
    }).eq("session_id", session_id).execute()

    background_tasks.add_task(run_pipeline, session_id, sb)

    return ApproveDiscoveryResponse(approved=True)
