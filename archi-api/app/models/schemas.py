from decimal import Decimal
from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class SessionStatus(str, Enum):
    awaiting_start        = "awaiting_start"
    interview_in_progress = "interview_in_progress"
    awaiting_approval     = "awaiting_approval"
    pipeline_pending      = "pipeline_pending"
    pipeline_running      = "pipeline_running"
    discovery_generated   = "discovery_generated"
    pricing_generated     = "pricing_generated"
    phases_generated      = "phases_generated"
    proposal_generated    = "proposal_generated"
    pending_review        = "pending_review"
    pipeline_error        = "pipeline_error"
    approved              = "approved"
    sent                  = "sent"

class ProposalStatus(str, Enum):
    pending_review = "pending_review"
    approved       = "approved"
    sent           = "sent"
    rejected       = "rejected"

class NotificationType(str, Enum):
    pipeline_completed = "pipeline_completed"
    pipeline_error     = "pipeline_error"
    proposal_sent      = "proposal_sent"

class MessageRole(str, Enum):
    user      = "user"
    assistant = "assistant"

class AccessCodeStatus(str, Enum):
    available   = "available"    # sem sessão, não expirado
    in_progress = "in_progress"  # sessão criada, cliente ainda não aprovou
    used        = "used"         # cliente aprovou → used_at preenchido
    expired     = "expired"      # expires_at < now e not used


# ---------------------------------------------------------------------------
# Session schemas
# ---------------------------------------------------------------------------

class ValidateCodeRequest(BaseModel):
    code: str

class ValidateCodeResponse(BaseModel):
    session_id: Optional[UUID] = None
    valid: bool
    error: Optional[str] = None

class SendMessageRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=50000)

class UploadDocumentResponse(BaseModel):
    filename: str
    extracted_text: str
    char_count: int

class MessageResponse(BaseModel):
    id: UUID
    session_id: UUID
    role: MessageRole
    content: str
    created_at: datetime

class ApproveDiscoveryResponse(BaseModel):
    approved: bool


# ---------------------------------------------------------------------------
# Proposal schemas
# ---------------------------------------------------------------------------

class ProposalListItem(BaseModel):
    id: UUID
    session_id: UUID
    client_name: Optional[str] = None
    client_email: Optional[str] = None
    total_price: Optional[Decimal] = None
    total_days: Optional[int] = None
    status: ProposalStatus
    created_at: datetime

class ProposalDetail(ProposalListItem):
    docx_url: Optional[str] = None
    pdf_url: Optional[str] = None
    admin_notes: Optional[str] = None
    sent_at: Optional[datetime] = None
    discovery_summary: Optional[str] = None
    pricing_summary: Optional[str] = None
    phases_plan: Optional[str] = None
    proposal_metadata: Optional[str] = None
    updated_at: datetime

class UpdateProposalRequest(BaseModel):
    total_price:   Optional[Decimal] = Field(None, gt=0)
    total_days:    Optional[int]     = Field(None, gt=0)
    validity_days: Optional[int]     = Field(None, gt=0)
    admin_notes:   Optional[str]     = None
    client_name:   Optional[str]     = None
    client_email:  Optional[str]     = None
    analyst_name:  Optional[str]     = None

class GenerateDocsRequest(BaseModel):
    client_name:  Optional[str]   = None
    client_email: Optional[str]   = None
    analyst_name: Optional[str]   = None
    total_price:  Optional[float] = Field(None, gt=0)
    total_days:   Optional[int]   = Field(None, gt=0)

class GenerateDocsResponse(BaseModel):
    docx_url: Optional[str] = None
    pdf_url: Optional[str] = None

class SendProposalResponse(BaseModel):
    sent: bool


# ---------------------------------------------------------------------------
# Access code schemas
# ---------------------------------------------------------------------------

class CreateAccessCodeRequest(BaseModel):
    expires_at: Optional[datetime] = None

class AccessCodeResponse(BaseModel):
    id: UUID
    code: str
    status: AccessCodeStatus
    used_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    session_id: Optional[UUID] = None
    client_name: Optional[str] = None
    created_at: datetime


# ---------------------------------------------------------------------------
# Notification schemas
# ---------------------------------------------------------------------------

class NotificationResponse(BaseModel):
    id: UUID
    session_id: Optional[UUID] = None
    type: NotificationType
    message: str
    read: bool
    created_at: datetime

class MarkReadResponse(BaseModel):
    updated: bool


# ---------------------------------------------------------------------------
# Pipeline schemas
# ---------------------------------------------------------------------------

class StartPipelineRequest(BaseModel):
    session_id: UUID

class PipelineStartResponse(BaseModel):
    started: bool
    session_id: UUID

class PipelineRetryResponse(BaseModel):
    retrying: bool
    session_id: UUID
