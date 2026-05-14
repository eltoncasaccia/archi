from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, BackgroundTasks, Body, Depends, HTTPException, Query

from app.auth import verify_admin_jwt
from app.config import settings
from app.models.schemas import (
    CreateAccessCodeRequest,
    GenerateDocsRequest,
    GenerateDocsResponse,
    MarkReadResponse,
    SendProposalResponse,
    UpdateProposalRequest,
)
from app.pipeline.orchestrator import run_pipeline
from app.services.document_service import generate_docs
from app.services.email_service import send_proposal_to_client
from app.services.supabase_client import get_supabase

router = APIRouter(prefix="/admin", tags=["admin"])


# ---------------------------------------------------------------------------
# Proposals
# ---------------------------------------------------------------------------

@router.get("/proposals")
async def list_proposals(
    status: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    admin=Depends(verify_admin_jwt),
):
    sb = get_supabase()
    offset = (page - 1) * limit

    query = sb.table("proposals").select("*").order("created_at", desc=True).range(offset, offset + limit - 1)
    if status:
        query = query.eq("status", status)

    result = await query.execute()
    return {"proposals": result.data, "page": page, "limit": limit}


@router.get("/proposals/{proposal_id}")
async def get_proposal(proposal_id: str, admin=Depends(verify_admin_jwt)):
    sb = get_supabase()

    result = await sb.table("proposals").select("*").eq("id", proposal_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Proposta não encontrada.")

    proposal = result.data[0]

    # Fetch related session for pipeline block details
    session_result = await sb.table("sessions").select("*").eq("id", proposal["session_id"]).execute()
    session = session_result.data[0] if session_result.data else {}

    return {"proposal": proposal, "session": session}


@router.patch("/proposals/{proposal_id}")
async def patch_proposal(
    proposal_id: str,
    body: UpdateProposalRequest,
    admin=Depends(verify_admin_jwt),
):
    sb = get_supabase()

    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar.")
    # Supabase/httpx cannot serialize Decimal — convert to float
    if "total_price" in updates:
        updates["total_price"] = float(updates["total_price"])

    result = await sb.table("proposals").update(updates).eq("id", proposal_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Proposta não encontrada.")

    return {"proposal": result.data[0]}


@router.post("/proposals/{proposal_id}/generate-docs", response_model=GenerateDocsResponse)
async def generate_proposal_docs(
    proposal_id: str,
    format: str | None = Query(default=None, pattern="^(docx|pdf)$"),
    body: GenerateDocsRequest = Body(default_factory=GenerateDocsRequest),
    admin=Depends(verify_admin_jwt),
):
    sb = get_supabase()

    result = await sb.table("proposals").select("*").eq("id", proposal_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Proposta não encontrada.")

    overrides = body.model_dump(exclude_none=True)
    urls = await generate_docs(proposal_id, fmt=format, overrides=overrides)

    update_data = {k: v for k, v in urls.items() if v is not None}
    if update_data:
        await sb.table("proposals").update(update_data).eq("id", proposal_id).execute()

    return urls


@router.post("/proposals/{proposal_id}/send", response_model=SendProposalResponse)
async def send_proposal(proposal_id: str, admin=Depends(verify_admin_jwt)):
    sb = get_supabase()

    result = await sb.table("proposals").select("*").eq("id", proposal_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Proposta não encontrada.")

    proposal = result.data[0]

    if not proposal.get("pdf_url"):
        urls = await generate_docs(proposal_id, fmt="pdf")
        if "pdf_url" in urls:
            await sb.table("proposals").update({"pdf_url": urls["pdf_url"]}).eq("id", proposal_id).execute()

    success = await send_proposal_to_client(proposal_id)
    if not success:
        raise HTTPException(status_code=500, detail="Falha ao enviar email.")

    await sb.table("proposals").update({
        "status": "sent",
        "sent_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", proposal_id).execute()

    await sb.table("notifications").insert({
        "session_id": proposal["session_id"],
        "type": "proposal_sent",
        "message": f"Proposta enviada para {proposal.get('client_email', '')}",
    }).execute()

    return {"sent": True}


# ---------------------------------------------------------------------------
# Notifications
# ---------------------------------------------------------------------------

@router.get("/notifications")
async def list_notifications(
    read: bool | None = Query(default=None),
    admin=Depends(verify_admin_jwt),
):
    sb = get_supabase()

    query = sb.table("notifications").select("*").order("created_at", desc=True)
    if read is not None:
        query = query.eq("read", read)

    result = await query.execute()
    return {"notifications": result.data}


@router.patch("/notifications/{notification_id}/read", response_model=MarkReadResponse)
async def mark_notification_read(notification_id: str, admin=Depends(verify_admin_jwt)):
    sb = get_supabase()

    result = await sb.table("notifications").update({"read": True}).eq("id", notification_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Notificação não encontrada.")

    return MarkReadResponse(updated=True)


# ---------------------------------------------------------------------------
# Access codes
# ---------------------------------------------------------------------------

@router.post("/access-codes")
async def create_access_code(
    body: CreateAccessCodeRequest,
    admin=Depends(verify_admin_jwt),
):
    sb = get_supabase()
    year = datetime.now(timezone.utc).year

    # Find next sequential number for this year
    prefix = f"ORC-{year}-"
    existing = await sb.table("access_codes").select("code").like("code", f"{prefix}%").execute()
    sequences = []
    for row in existing.data:
        try:
            seq = int(row["code"].replace(prefix, ""))
            sequences.append(seq)
        except ValueError:
            pass
    next_seq = max(sequences, default=0) + 1
    code = f"{prefix}{next_seq:03d}"

    insert_data: dict = {"code": code}
    if body.expires_at:
        insert_data["expires_at"] = body.expires_at

    result = await sb.table("access_codes").insert(insert_data).execute()
    return {"code": code, "access_code": result.data[0]}


@router.get("/access-codes")
async def list_access_codes(admin=Depends(verify_admin_jwt)):
    sb = get_supabase()
    result = await sb.table("access_codes").select("*").order("created_at", desc=True).execute()
    return {"access_codes": result.data}


# ---------------------------------------------------------------------------
# Pipeline retry
# ---------------------------------------------------------------------------

@router.post("/pipeline/{session_id}/retry")
async def retry_pipeline(
    session_id: str,
    background_tasks: BackgroundTasks,
    admin=Depends(verify_admin_jwt),
):
    sb = get_supabase()

    result = await sb.table("sessions").select("status").eq("id", session_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Sessão não encontrada.")

    if result.data[0]["status"] != "pipeline_error":
        raise HTTPException(status_code=400, detail="Sessão não está em estado de erro.")

    background_tasks.add_task(run_pipeline, session_id, sb)
    return {"retrying": True}


# ---------------------------------------------------------------------------
# Dashboard helpers
# ---------------------------------------------------------------------------

@router.get("/me")
async def me(admin=Depends(verify_admin_jwt)):
    return {"email": admin.email, "id": admin.id}
