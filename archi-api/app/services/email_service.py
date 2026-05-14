import logging

import resend

from app.config import settings
from app.services.supabase_client import get_supabase

logger = logging.getLogger(__name__)


def _init_resend() -> None:
    resend.api_key = settings.resend_api_key


async def send_proposal_to_client(proposal_id: str) -> bool:
    _init_resend()
    sb = get_supabase()

    proposal_res = await sb.table("proposals").select("*").eq("id", proposal_id).execute()
    if not proposal_res.data:
        logger.error(f"send_proposal_to_client: proposta {proposal_id} não encontrada.")
        return False

    proposal = proposal_res.data[0]
    client_name = proposal.get("client_name") or "Cliente"
    client_email = proposal.get("client_email")

    if not client_email:
        logger.error(f"send_proposal_to_client: email do cliente ausente na proposta {proposal_id}.")
        return False

    pdf_url = proposal.get("pdf_url") or ""

    if not pdf_url:
        logger.error(f"send_proposal_to_client: pdf_url ausente na proposta {proposal_id}.")
        return False

    html_body = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;">
      <h2 style="color:#1a1a2e;">Sua proposta está pronta!</h2>
      <p>Olá, <strong>{client_name}</strong>!</p>
      <p>
        Preparamos sua proposta comercial com base no levantamento que fizemos juntos.
        Clique no link abaixo para baixar o documento em PDF:
      </p>
      <p><a href="{pdf_url}" style="color:#0066cc;">📑 Baixar proposta (PDF)</a></p>
      <p>
        Caso tenha dúvidas ou queira ajustes, entre em contato respondendo este email.
      </p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
      <p style="font-size:0.85em;color:#666;">
        Esta proposta é válida por 30 dias a partir da data de envio.
      </p>
    </div>
    """

    try:
        params: resend.Emails.SendParams = {
            "from": settings.email_from,
            "to": [client_email],
            "subject": "Sua proposta comercial está pronta",
            "html": html_body,
        }
        resend.Emails.send(params)
        logger.info(f"Email enviado para {client_email} (proposta {proposal_id}).")
        return True
    except Exception as e:
        logger.error(f"Falha ao enviar email para {client_email}: {e}")
        return False


async def notify_admin(session_id: str, success: bool, error_step: str | None = None) -> bool:
    _init_resend()

    if success:
        subject = "Archi — Nova proposta aguardando revisão"
        html_body = f"""
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;">
          <h2 style="color:#1a1a2e;">Proposta pronta para revisão</h2>
          <p>O pipeline foi concluído com sucesso para a sessão <code>{session_id}</code>.</p>
          <p>Portal de Gestão admin para revisar, editar e enviar a proposta ao cliente.</p>
        </div>
        """
    else:
        subject = "Archi — Erro no pipeline de proposta"
        html_body = f"""
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;">
          <h2 style="color:#cc0000;">Erro no pipeline</h2>
          <p>Falha na etapa <strong>{error_step or "desconhecida"}</strong> para a sessão <code>{session_id}</code>.</p>
          <p>Portal de Gestão admin para ver os detalhes e acionar o reprocessamento.</p>
        </div>
        """

    try:
        params: resend.Emails.SendParams = {
            "from": settings.email_from,
            "to": [settings.email_admin],
            "subject": subject,
            "html": html_body,
        }
        resend.Emails.send(params)
        logger.info(f"Email admin enviado (sessão {session_id}, sucesso={success}).")
        return True
    except Exception as e:
        logger.error(f"Falha ao enviar email admin: {e}")
        return False
