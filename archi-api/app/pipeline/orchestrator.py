import asyncio
import logging
import re
import time
from typing import Optional

import litellm
from langfuse import get_client, observe

from app.config import settings
from app.services.prompt_loader import get_prompt

logger = logging.getLogger(__name__)


def _extract_total_price(pricing_summary: str) -> Optional[float]:
    """Extracts total_maximo from [PRICING_SUMMARY] block, falling back to total_minimo."""
    for field in ("total_maximo", "total_minimo"):
        m = re.search(rf"{field}:\s*([\d.,]+)", pricing_summary, re.IGNORECASE)
        if m:
            raw = m.group(1).replace(".", "").replace(",", ".")
            try:
                value = float(raw)
                if value > 0:
                    return value
            except ValueError:
                continue
    return None


def _extract_field(text: str, field: str) -> Optional[str]:
    """Extracts a named field value from a YAML-like block."""
    m = re.search(rf"^\s*{re.escape(field)}:\s*(.+)$", text, re.MULTILINE | re.IGNORECASE)
    return m.group(1).strip() if m else None


class PipelineStepError(Exception):
    def __init__(self, step: str, message: str):
        self.step = step
        self.message = message
        super().__init__(f"[{step}] {message}")


@observe(as_type="generation")
async def _run_step(step_name: str, prompt_name: str, user_input: str, session_id: str) -> str:
    """Calls LiteLLM for one pipeline step. Retries once on failure."""
    messages = [
        {"role": "system", "content": get_prompt(prompt_name)},
        {"role": "user", "content": user_input},
    ]

    lf = get_client()
    lf.update_current_generation(
        name=step_name,
        model=settings.litellm_model,
        input=messages,
    )

    for attempt in range(2):
        try:
            response = await litellm.acompletion(
                model=settings.litellm_model,
                messages=messages,
                metadata={"session_id": session_id, "pipeline_step": step_name},
            )
            content = response.choices[0].message.content
            usage = getattr(response, "usage", None)
            lf.update_current_generation(
                output=content,
                usage_details={
                    "input": getattr(usage, "prompt_tokens", 0),
                    "output": getattr(usage, "completion_tokens", 0),
                } if usage else None,
            )
            return content
        except Exception as e:
            if attempt == 0:
                logger.warning(f"[{step_name}] falha (tentativa 1): {e}. Retentando em 3s...")
                await asyncio.sleep(3)
            else:
                raise PipelineStepError(step_name, str(e))


@observe()
async def run_pipeline(session_id: str, supabase) -> None:
    sb = supabase

    lf = get_client()
    lf.update_current_trace(
        name="pipeline",
        session_id=session_id,
    )

    async def update_session(fields: dict) -> None:
        await sb.table("sessions").update(fields).eq("id", session_id).execute()

    async def notify(type_: str, message: str) -> None:
        await sb.table("notifications").insert({
            "session_id": session_id,
            "type": type_,
            "message": message,
        }).execute()

    # Load session
    result = await sb.table("sessions").select("*").eq("id", session_id).execute()
    if not result.data:
        logger.error(f"run_pipeline: sessão {session_id} não encontrada.")
        return

    session = result.data[0]
    discovery_approved = session.get("discovery_approved") or ""

    await update_session({"status": "pipeline_running"})
    pipeline_start = time.monotonic()

    def _elapsed(since: float) -> str:
        return f"{time.monotonic() - since:.1f}s"

    try:
        # --- Etapa 1: agent-discovery-generator ---
        t = time.monotonic()
        logger.info(f"[{session_id}] ▶ Etapa 1/4: discovery-generator")
        discovery_summary = await _run_step(
            "agent-discovery-generator",
            "agent-discovery-generator",
            discovery_approved,
            session_id,
        )
        logger.info(f"[{session_id}] ✓ Etapa 1/4 concluída em {_elapsed(t)}")
        await update_session({
            "status": "discovery_generated",
            "discovery_summary": discovery_summary,
        })

        # --- Etapa 2: agent-pricing ---
        t = time.monotonic()
        logger.info(f"[{session_id}] ▶ Etapa 2/4: pricing")
        from app.config import settings
        params_comerciais = settings.get_parametros_comerciais()
        pricing_input = f"**Discovery Summary:**\n{discovery_summary}\n\n**Parâmetros Comerciais:**\n{params_comerciais}"
        pricing_summary = await _run_step(
            "agent-pricing",
            "agent-pricing",
            pricing_input,
            session_id,
        )
        logger.info(f"[{session_id}] ✓ Etapa 2/4 concluída em {_elapsed(t)}")
        await update_session({
            "status": "pricing_generated",
            "pricing_summary": pricing_summary,
        })

        # --- Etapa 3: agent-phases ---
        t = time.monotonic()
        logger.info(f"[{session_id}] ▶ Etapa 3/4: phases")
        phases_input = f"{discovery_summary}\n\n{pricing_summary}"
        phases_plan = await _run_step(
            "agent-phases",
            "agent-phases",
            phases_input,
            session_id,
        )
        logger.info(f"[{session_id}] ✓ Etapa 3/4 concluída em {_elapsed(t)}")
        await update_session({
            "status": "phases_generated",
            "phases_plan": phases_plan,
        })

        # --- Etapa 4: agent-proposal-generator ---
        t = time.monotonic()
        logger.info(f"[{session_id}] ▶ Etapa 4/4: proposal-generator")
        dados_empresa = (
            f"Nome do analista/responsável comercial: {settings.email_admin or '—'}\n"
            f"Email: {settings.company_email or '—'}\n"
            f"Telefone: {settings.company_phone or '—'}\n"
            f"Site: {settings.company_website or '—'}"
        )
        proposal_input = (
            f"{discovery_approved}\n\n"
            f"{discovery_summary}\n\n"
            f"{pricing_summary}\n\n"
            f"{phases_plan}\n\n"
            f"[DADOS_EMPRESA_VENDEDORA]\n{dados_empresa}\n[/DADOS_EMPRESA_VENDEDORA]"
        )
        proposal_metadata = await _run_step(
            "agent-proposal-generator",
            "agent-proposal-generator",
            proposal_input,
            session_id,
        )
        logger.info(f"[{session_id}] ✓ Etapa 4/4 concluída em {_elapsed(t)}")
        await update_session({
            "status": "proposal_generated",
            "proposal_metadata": proposal_metadata,
        })

        # --- Criar proposta e notificar admin ---
        # Re-read session to ensure client_name/email are up-to-date (may have been
        # written by the approval handler after the initial session load above).
        fresh = await sb.table("sessions").select("client_name, client_email").eq("id", session_id).execute()
        fresh_session = fresh.data[0] if fresh.data else {}

        total_price = _extract_total_price(pricing_summary)
        client_name = fresh_session.get("client_name") or session.get("client_name")
        client_email = fresh_session.get("client_email") or session.get("client_email")

        proposal_result = await sb.table("proposals").insert({
            "session_id": session_id,
            "client_name": client_name,
            "client_email": client_email,
            "total_price": total_price,
        }).execute()
        proposal_id = proposal_result.data[0]["id"]

        await update_session({"status": "pending_review"})
        await notify(
            "pipeline_completed",
            f"Proposta pronta para revisão. ID: {proposal_id}",
        )
        lf.update_current_trace(output={"proposal_id": proposal_id})
        logger.info(f"[{session_id}] ✅ Pipeline concluído em {_elapsed(pipeline_start)}. Proposta: {proposal_id}")

    except PipelineStepError as e:
        logger.error(f"[{session_id}] Pipeline falhou em '{e.step}': {e.message}")
        lf.update_current_span(level="ERROR", status_message=f"[{e.step}] {e.message}")
        await update_session({
            "status": "pipeline_error",
            "error_step": e.step,
            "error_message": e.message,
        })
        await notify(
            "pipeline_error",
            f"Erro na etapa '{e.step}': {e.message[:200]}",
        )
    except Exception as e:
        logger.error(f"[{session_id}] Erro inesperado no pipeline: {e}")
        lf.update_current_span(level="ERROR", status_message=str(e))
        await update_session({
            "status": "pipeline_error",
            "error_step": "unknown",
            "error_message": str(e),
        })
        await notify(
            "pipeline_error",
            f"Erro inesperado no pipeline: {str(e)[:200]}",
        )
