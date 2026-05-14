# TECH SPEC — Archi
## Sistema Autônomo de Pré-Venda

**Versão:** 1.0.0  
**Status:** Draft  
**Última atualização:** 2026

---

## 1. Visão geral

Archi é um sistema web que automatiza a geração de propostas comerciais de software. O cliente conversa com um agente de IA em tempo real, aprova o levantamento de requisitos e recebe uma proposta profissional por email. O admin revisa e aprova o envio antes que o cliente receba o documento.

### Fluxo macro

```
1. Admin gera código de acesso → envia para o cliente
2. Cliente acessa a URL → digita o código → conversa com o agente
3. Cliente aprova o discovery na conversa
4. Pipeline roda em background (4 subagentes em sequência)
5. Admin recebe notificação → revisa → edita se necessário → aprova envio
6. Proposta chega ao cliente por email
```

---

## 2. Repositórios

| Repositório | Conteúdo |
|---|---|
| `archi-api` | Backend FastAPI (Python) |
| `archi-web` | Frontend Next.js (TypeScript) |
| `archi-prompts` | Prompts dos agentes (YAML) — repositório separado |

Os três repositórios ficam em uma pasta raiz local durante o desenvolvimento:

```
~/projects/
├── archi-api/
├── archi-web/
└── archi-prompts/
```

---

## 3. Stack

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Frontend | Next.js 14+ (App Router, TypeScript) | Ecossistema React, streaming nativo, roteamento |
| Backend | FastAPI (Python 3.12+) | Async nativo, tipagem, compatível com LiteLLM |
| LLM | LiteLLM | Abstração de provider — troca Anthropic/OpenAI/Gemini sem mudar código |
| Prompt management | LangFuse (cloud — us.cloud.langfuse.com) | Edição de prompts sem deploy, evals, versionamento |
| Banco de dados | Supabase (PostgreSQL) | Auth, banco, storage e realtime num só serviço |
| Autenticação | Supabase Auth | Admin panel — email/senha |
| Geração de documentos | python-docx (DOCX) + WeasyPrint (PDF) | Geração server-side sem dependências pesadas |
| Email | Resend | SDK simples, confiável, logs de entrega |
| Observabilidade | LangFuse | Traces de todas as chamadas LLM (custo, latência, prompts) |
| Infra local | Docker Compose | Um comando sobe tudo |

---

## 4. Estrutura de pastas

### archi-api (backend)

```
archi-api/
├── app/
│   ├── main.py                    ← FastAPI app + lifespan + CORS + validação de env vars
│   ├── config.py                  ← Configurações via variáveis de ambiente (Pydantic Settings)
│   ├── routers/
│   │   ├── session.py             ← Endpoints públicos (cliente)
│   │   ├── admin.py               ← Endpoints protegidos (admin)
│   │   └── pipeline.py            ← Endpoint interno de trigger do pipeline
│   ├── pipeline/
│   │   └── orchestrator.py        ← Função async que executa os 4 subagentes
│   ├── services/
│   │   ├── prompt_loader.py       ← Pull do LangFuse no startup + cache local
│   │   ├── supabase_client.py     ← Cliente Supabase (singleton)
│   │   ├── document_service.py    ← Geração de DOCX e PDF
│   │   └── email_service.py       ← Envio de email via Resend
│   └── models/
│       └── schemas.py             ← Pydantic models (request/response)
├── prompts_cache.json             ← Cache local dos prompts (gerado automaticamente)
├── templates/
│   └── proposal_template.docx    ← Template base para geração do DOCX
├── .python-version                ← "3.12" — pin de versão Python para o uv
├── pyproject.toml                 ← Dependências gerenciadas pelo uv
├── uv.lock                        ← Lock file (não editar manualmente)
├── .env.example                   ← Todas as variáveis necessárias (sem valores reais)
├── .env                           ← Valores reais (não versionar)
├── Dockerfile
└── scripts/
    ├── setup.sh                   ← Inicialização do projeto
    ├── db_setup.sql               ← Criação das tabelas no Supabase
    ├── sync_prompts.sh            ← Push dos YAMLs do archi-prompts para o LangFuse
    └── reset_session.sh           ← Reseta status de uma sessão (uso em dev)
```

### archi-web (frontend)

```
archi-web/
├── app/
│   ├── page.tsx                           ← Tela de entrada (digitar código de acesso)
│   ├── interview/
│   │   └── [sessionId]/
│   │       └── page.tsx                   ← Chat com o agente
│   └── admin/
│       ├── layout.tsx                     ← Layout protegido (verifica auth Supabase)
│       ├── page.tsx                       ← Dashboard (notificações + resumo)
│       ├── proposals/
│       │   ├── page.tsx                   ← Lista de propostas
│       │   └── [id]/
│       │       └── page.tsx               ← Detalhe da proposta (edição + aprovação)
│       ├── notifications/
│       │   └── page.tsx                   ← Lista de notificações
│       └── access-codes/
│           └── page.tsx                   ← Geração e listagem de códigos de acesso
├── components/
│   ├── chat/
│   │   ├── ChatWindow.tsx                 ← Container principal do chat
│   │   ├── MessageList.tsx
│   │   └── MessageInput.tsx
│   └── admin/
│       ├── ProposalEditor.tsx             ← Edição de preço, prazo e notas
│       └── NotificationBadge.tsx
├── lib/
│   ├── supabase.ts                        ← Cliente Supabase (browser)
│   └── api.ts                            ← Funções de chamada ao archi-api
├── .env.example
├── .env.local
└── Dockerfile
```

---

## 5. Banco de dados

### 5.1 Tabela `access_codes`

Códigos gerados pelo admin para liberar acesso ao sistema.

```sql
CREATE TABLE access_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT UNIQUE NOT NULL,          -- ex: "ORC-2024-001"
  session_id  UUID,                          -- preenchido na primeira entrada (1 código = 1 sessão)
  used_at     TIMESTAMPTZ,                   -- preenchido quando o cliente aprova o discovery (code bloqueado após isso)
  expires_at  TIMESTAMPTZ,                   -- NULL = sem expiração
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2 Tabela `sessions`

Uma linha por atendimento. Armazena todos os blocos do pipeline.

```sql
CREATE TYPE session_status AS ENUM (
  'awaiting_start',         -- code validated, interview not started
  'interview_in_progress',  -- client is talking with the agent
  'awaiting_approval',      -- agent presented discovery, waiting for client approval
  'pipeline_pending',       -- client approved, pipeline not started yet
  'pipeline_running',       -- pipeline running in background
  'discovery_generated',    -- step 1 complete
  'pricing_generated',      -- step 2 complete
  'phases_generated',       -- step 3 complete
  'proposal_generated',     -- step 4 complete
  'pending_review',         -- pipeline complete, waiting for admin
  'pipeline_error',         -- failure in some step
  'approved',               -- admin approved the send
  'sent'                    -- proposal sent to client
);

CREATE TABLE sessions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_code          TEXT REFERENCES access_codes(code),
  status               session_status NOT NULL DEFAULT 'awaiting_start',

  -- Client data (collected during interview)
  client_name          TEXT,
  client_email         TEXT,
  client_document      TEXT,                        -- CPF or CNPJ

  -- Pipeline blocks (filled progressively)
  discovery_approved   TEXT,
  discovery_summary    TEXT,
  pricing_summary      TEXT,
  phases_plan          TEXT,
  proposal_metadata    TEXT,

  -- Error tracking
  error_step           TEXT,
  error_message        TEXT,

  -- Rate limiting (ADR-009)
  message_count        INTEGER NOT NULL DEFAULT 0,
  input_tokens         INTEGER NOT NULL DEFAULT 0,

  -- Session lifecycle
  expires_at           TIMESTAMPTZ,          -- absolute 2h expiry, set on creation
  last_activity_at     TIMESTAMPTZ,          -- updated on every client interaction

  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.3 Tabela `proposals`

Proposta gerada. Campos editáveis pelo admin antes do envio.

```sql
CREATE TYPE proposal_status AS ENUM (
  'pending_review',   -- waiting for admin review
  'approved',         -- admin approved
  'sent',             -- email sent to client
  'rejected'          -- admin rejected (do not send)
);

CREATE TABLE proposals (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     UUID REFERENCES sessions(id) NOT NULL,

  -- Generated files (Supabase Storage URLs)
  docx_url       TEXT,
  pdf_url        TEXT,

  -- Admin-editable fields before generating documents
  total_price    NUMERIC(12, 2),    -- editable total price
  total_days     INTEGER,           -- editable total deadline in business days
  admin_notes    TEXT,              -- internal admin notes (not sent to client)

  -- Status and delivery
  status         proposal_status NOT NULL DEFAULT 'pending_review',
  sent_at        TIMESTAMPTZ,

  -- Client data (copied from session to avoid JOIN)
  client_name    TEXT,
  client_email   TEXT,

  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.4 Tabela `messages`

Histórico completo da conversa entre o cliente e o agente. Uma linha por mensagem.

```sql
CREATE TABLE messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID REFERENCES sessions(id) NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

O backend carrega todas as mensagens da sessão antes de cada chamada ao LiteLLM,
montando o histórico de conversa no formato `[{role, content}, ...]`.
Isso garante que o agente tenha contexto de toda a conversa anterior.

---

### 5.6 Tabela `notifications`

Fila de alertas para o admin.

```sql
CREATE TYPE notification_type AS ENUM (
  'pipeline_completed',   -- proposal ready for review
  'pipeline_error',       -- pipeline failure
  'proposal_sent'         -- confirmation of send to client
);

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID REFERENCES sessions(id),
  type        notification_type NOT NULL,
  message     TEXT NOT NULL,
  read        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.7 Trigger `updated_at`

Aplicar nas tabelas `sessions` e `proposals`:

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER proposals_updated_at
  BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 5.8 Índices

```sql
CREATE INDEX idx_sessions_status       ON sessions(status);
CREATE INDEX idx_sessions_access_code  ON sessions(access_code);
CREATE INDEX idx_proposals_session_id  ON proposals(session_id);
CREATE INDEX idx_proposals_status      ON proposals(status);
CREATE INDEX idx_notifications_read    ON notifications(read);
CREATE INDEX idx_notifications_session ON notifications(session_id);
CREATE INDEX idx_messages_session_id   ON messages(session_id);
CREATE INDEX idx_messages_created_at   ON messages(session_id, created_at);
```

---

## 6. API Endpoints

Base URL local: `http://localhost:8000`

### 6.1 Endpoints públicos — cliente

| Método | Path | Descrição |
|---|---|---|
| `POST` | `/session/validate-code` | Valida código de acesso. Retorna `session_id` se válido. |
| `POST` | `/session/{session_id}/message` | Envia mensagem ao agente. Resposta em streaming (SSE). |
| `POST` | `/session/{session_id}/approve` | Cliente aprova o discovery. Dispara o pipeline em background. |

**Exemplo de request — validate-code:**
```json
POST /session/validate-code
{ "code": "ORC-2024-001" }

// Resposta de sucesso
{ "session_id": "uuid", "valid": true }

// Resposta de erro
{ "valid": false, "error": "Código inválido ou expirado" }
```

**Exemplo de request — message (streaming):**
```json
POST /session/{session_id}/message
{ "content": "Quero desenvolver um app de delivery" }

// Resposta: text/event-stream (SSE)
// Cada chunk: data: {"delta": "texto parcial..."}
// Fim: data: [DONE]
```

---

### 6.2 Endpoints admin — protegidos (Supabase Auth JWT)

Todos os endpoints `/admin/*` exigem header:
```
Authorization: Bearer <supabase_jwt_token>
```

| Método | Path | Descrição |
|---|---|---|
| `GET` | `/admin/proposals` | Lista propostas. Query params: `status`, `page`, `limit` |
| `GET` | `/admin/proposals/{id}` | Detalhe completo da proposta |
| `PATCH` | `/admin/proposals/{id}` | Edita `total_price`, `total_days`, `admin_notes` |
| `POST` | `/admin/proposals/{id}/generate-docs` | Gera DOCX e PDF. Salva no Storage. Retorna URLs. |
| `POST` | `/admin/proposals/{id}/send` | Envia email ao cliente via Resend. Atualiza status para `sent`. |
| `GET` | `/admin/notifications` | Lista notificações. Query param: `read=false` |
| `PATCH` | `/admin/notifications/{id}/read` | Marca notificação como lida |
| `POST` | `/admin/access-codes` | Gera novo código de acesso |
| `GET` | `/admin/access-codes` | Lista todos os códigos com status |
| `POST` | `/admin/pipeline/{session_id}/retry` | Reprocessa pipeline de uma sessão com erro |

**Exemplo de request — editar proposta:**
```json
PATCH /admin/proposals/{id}
{
  "total_price": 48000.00,
  "total_days": 90,
  "admin_notes": "Cliente pediu desconto. Aprovado pelo gestor."
}
```

**Exemplo de request — gerar documentos:**
```json
POST /admin/proposals/{id}/generate-docs
// Sem body — usa os dados já salvos na proposal

// Resposta
{
  "docx_url": "https://storage.supabase.../proposals/{session_id}/proposal.docx",
  "pdf_url": "https://storage.supabase.../proposals/{session_id}/proposal.pdf"
}
```

---

## 6.4 Schemas Pydantic — `models/schemas.py`

Todos os campos com valores fixos devem usar `Enum` — nunca `str` puro.
Isso garante validação automática (retorna `422` para valores inválidos) e
exibe dropdown no Swagger com os valores permitidos.

```python
from enum import Enum
from decimal import Decimal
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

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
    in_progress = "in_progress"  # session_id preenchido, used_at ainda null (entrevista em andamento)
    used        = "used"         # used_at preenchido (cliente aprovou → proposta gerada)
    expired     = "expired"      # expires_at < now e not used

# ---------------------------------------------------------------------------
# Session schemas
# ---------------------------------------------------------------------------

class ValidateCodeRequest(BaseModel):
    code: str

class ValidateCodeResponse(BaseModel):
    session_id: Optional[UUID] = None   # None when valid=False
    valid: bool
    error: Optional[str] = None

class SendMessageRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000)

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
    total_price: Optional[Decimal] = None   # Decimal — never float for money
    total_days: Optional[int] = None
    status: ProposalStatus
    created_at: datetime

class ProposalDetail(ProposalListItem):
    docx_url: Optional[str] = None
    pdf_url: Optional[str] = None
    admin_notes: Optional[str] = None
    sent_at: Optional[datetime] = None
    # Pipeline blocks (read-only, for audit accordion in admin panel)
    discovery_summary: Optional[str] = None
    pricing_summary: Optional[str] = None
    phases_plan: Optional[str] = None
    proposal_metadata: Optional[str] = None
    updated_at: datetime

class UpdateProposalRequest(BaseModel):
    total_price: Optional[Decimal] = Field(None, gt=0)   # must be positive
    total_days: Optional[int]      = Field(None, gt=0)   # must be positive
    admin_notes: Optional[str]     = None

class GenerateDocsResponse(BaseModel):
    docx_url: str
    pdf_url: str

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
    status: AccessCodeStatus   # computed by backend: available / used / expired
    used_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    session_id: Optional[UUID] = None
    client_name: Optional[str] = None   # from related session
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
    session_id: UUID   # echoed back for confirmation

class PipelineRetryResponse(BaseModel):
    retrying: bool
    session_id: UUID
```

> **Regra:** nunca usar `float` para campos monetários — sempre `Decimal`.
> O `float` causa erros de arredondamento (ex: `48000.10` vira `48000.099999999`).
> O Pydantic serializa `Decimal` corretamente para JSON.

| Método | Path | Descrição |
|---|---|---|
| `POST` | `/pipeline/start` | Inicia o pipeline em background para uma sessão |
| `POST` | `/pipeline/retry/{session_id}` | Reinicia o pipeline de uma sessão com erro |

Estes endpoints são chamados internamente pelo próprio backend após a aprovação do cliente. Não são expostos ao público — proteger com um segredo interno (`PIPELINE_SECRET` no header).

---

## 7. Variáveis de ambiente

### archi-api (.env)

```env
# LLM via OpenRouter — provider atual
# Troque apenas LITELLM_MODEL para mudar de modelo sem alterar código
# Exemplos de model string:
#   openrouter/openai/gpt-4o-mini      (padrão atual)
#   openrouter/deepseek/deepseek-v3
#   openrouter/anthropic/claude-sonnet-4-5
#   openrouter/meta-llama/llama-4-maverick
LITELLM_MODEL=openrouter/openai/gpt-4o-mini
LLM_API_KEY=sk-or-v1-...   # chave do OpenRouter (openrouter.ai → Keys)

# LangFuse cloud (prompt management + observabilidade)
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_HOST=https://us.cloud.langfuse.com

# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...   # secret key — nunca expor no frontend

# Resend (email)
RESEND_API_KEY=re_...
EMAIL_FROM=proposta@suaempresa.com.br
EMAIL_ADMIN=voce@suaempresa.com.br

# Parâmetros comerciais para precificação (usados pelo agent-pricing)
TAXA_HORA_DESENVOLVEDOR=R$ 150
MARGEM_RISCO_PERCENTUAL=20
FAIXA_ESFORÇO_BAIXA=20-30
FAIXA_ESFORÇO_MEDIA=40-60
FAIXA_ESFORÇO_ALTA=80-120
FAIXA_ESFORÇO_MUITO_ALTA=150-200

# Rate limiting
MAX_MESSAGES_PER_SESSION=40
MAX_INPUT_TOKENS_PER_SESSION=20000

# Security
PIPELINE_SECRET=segredo-interno-pipeline   # protege endpoints /pipeline/*
CORS_ORIGINS=http://localhost:3000         # origens permitidas (separar por vírgula em produção)

# macOS: WeasyPrint precisa das libs do Homebrew (brew install pango)
DYLD_LIBRARY_PATH=/opt/homebrew/lib
```

### archi-web (.env.local)

```env
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:8000

# Supabase (apenas chave pública)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...   # publishable key — seguro para expor no frontend
```

---

## 8. Docker Compose

Arquivo: `docker-compose.yml` na raiz do projeto.

O `Makefile` consolida todos os comandos:

```bash
make dev          # sobe todos os serviços
make dev-build    # sobe com rebuild
make setup        # inicializa o projeto
make sync-prompts # envia prompts para o LangFuse cloud
make reset-session# reseta uma sessão (pede o ID)
```

Sobe: backend + frontend.
Supabase e LangFuse ficam na nuvem — não entram no Compose.

```yaml
# Referência de estrutura — valores reais ficam nos .env de cada serviço

services:

  api:
    build: ./archi-api
    ports:
      - "8000:8000"
    env_file:
      - ./archi-api/.env
    volumes:
      - ./archi-api:/app   # hot reload em dev
    command: uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  web:
    build: ./archi-web
    ports:
      - "3000:3000"
    env_file:
      - ./archi-web/.env.local
    volumes:
      - ./archi-web:/app
      - /app/node_modules
      - /app/.next
```

---

## 9. Inicialização do projeto (passo a passo)

### Passo 1 — Configurar variáveis de ambiente
```bash
cp archi-api/.env.example archi-api/.env
cp archi-web/.env.example archi-web/.env.local
# Editar ambos os arquivos com os valores reais
```

### Passo 2 — Criar tabelas no Supabase
```bash
# Executar o script SQL no Supabase Dashboard → SQL Editor
# Arquivo: db_setup.sql (raiz do projeto)
```

### Passo 3 — Sincronizar prompts para o LangFuse cloud
```bash
# Criar os prompts no LangFuse (https://us.cloud.langfuse.com) com os nomes:
#   - agent-discovery-interview
#   - agent-discovery-generator
#   - agent-pricing
#   - agent-phases
#   - agent-proposal-generator
# Ou executar: make sync-prompts (após chaves no .env)
```

### Passo 4 — Subir com Docker Compose
```bash
cd ~/projects/PRE-SALES
make dev-build
```

### Passo 5 — Verificar
- Frontend: http://localhost:3000
- Backend (docs): http://localhost:8000/docs
- LangFuse: https://us.cloud.langfuse.com

---

## 10. Autenticação

### Cliente (público)
Sem login. O cliente acessa com um código de acesso gerado pelo admin.
Fluxo:
1. Cliente acessa `http://localhost:3000`
2. Digita o código (ex: `ORC-2024-001`)
3. Backend valida → retorna `session_id`
4. Frontend redireciona para `/interview/{session_id}`

### Admin (protegido)
Supabase Auth com email/senha.
- Criar usuário admin diretamente no Supabase Dashboard (Authentication → Users)
- Frontend usa `@supabase/ssr` para gerenciar sessão
- Rota `/admin/*` verifica sessão ativa no `layout.tsx` e redireciona para login se ausente
- Backend valida o JWT do Supabase em todos os endpoints `/admin/*`

---

## 11. Geração de documentos

### DOCX
- Biblioteca: `python-docx`
- Usa um template base (`templates/proposal_template.docx`) com marcadores
- O `document_service.py` substitui os marcadores pelos dados da proposta
- Salva o arquivo no Supabase Storage (bucket `proposals`)
- Retorna a URL pública

### PDF
- Biblioteca: `WeasyPrint`
- Converte o DOCX (via HTML intermediário) ou renderiza diretamente de um template HTML
- Salva no mesmo bucket `proposals`

### Supabase Storage
- Bucket: `proposals`
- Estrutura: `proposals/{session_id}/proposal.docx` e `proposals/{session_id}/proposal.pdf`
- Acesso: URL pública (o admin faz download direto pelo link)

---

## 12. Observabilidade (LangFuse)

Todas as chamadas LLM feitas pelo LiteLLM são rastreadas automaticamente via callback do LangFuse.

Configuração no backend (uma linha em `main.py`):
```python
import litellm
litellm.success_callback = ["langfuse"]
litellm.failure_callback = ["langfuse"]
```

Cada trace registra automaticamente: modelo usado, prompt completo, resposta, tokens, custo estimado, latência.

Os prompts dos agentes são gerenciados no LangFuse cloud:
- Criação e edição: via interface do LangFuse em https://us.cloud.langfuse.com
- Pull pelo backend: no startup via `prompt_loader.py`
- Evals: configurados diretamente no LangFuse por prompt

---

## 13. Roadmap (fora do escopo V1)

Funcionalidades planejadas para versões futuras — **não implementar agora**:

- **Sistema de créditos:** cliente compra créditos antes de usar o sistema
- **Cadastro público:** cliente cria conta sem código de acesso
- **Multi-tenant / SaaS:** outros prestadores de serviço usam o sistema
- **Reprocessamento parcial:** retomar pipeline a partir da etapa que falhou (hoje reprocessa tudo)
- **Webhook de notificação:** alternativa ao email para alertar o admin