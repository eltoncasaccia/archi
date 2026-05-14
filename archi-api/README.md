# archi-api

Backend do sistema Archi. API REST em FastAPI responsável pelo pipeline de geração de propostas, orquestração dos agentes LLM e painel administrativo.

## Stack

- Python 3.12+
- FastAPI
- LiteLLM (abstração de provider LLM)
- Supabase (banco + storage)
- LangFuse (prompts + observabilidade)
- python-docx + WeasyPrint (geração de documentos)
- Resend (email)

## Pré-requisitos

- Python 3.12+
- Docker Desktop rodando
- Variáveis de ambiente configuradas (ver abaixo)

## Instalação

```bash
# Instalar dependências com uv
uv sync

# Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com suas chaves reais
```

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

| Variável | Descrição |
|---|---|
| `LITELLM_MODEL` | Model string do provider (ex: `groq/llama-3.3-70b-versatile`) |
| `LLM_API_KEY` | Chave do provider LLM escolhido |
| `LANGFUSE_PUBLIC_KEY` | Chave pública do LangFuse |
| `LANGFUSE_SECRET_KEY` | Chave secreta do LangFuse |
| `LANGFUSE_HOST` | URL do LangFuse (padrão: `http://localhost:3001`) |
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service role do Supabase |
| `RESEND_API_KEY` | Chave da API Resend |
| `EMAIL_FROM` | Endereço de envio dos emails |
| `EMAIL_ADMIN` | Email do admin para notificações |
| `MAX_MESSAGES_PER_SESSION` | Limite de mensagens por sessão (padrão: 40) |
| `MAX_INPUT_TOKENS_PER_SESSION` | Limite de tokens por sessão (padrão: 20000) |
| `PIPELINE_SECRET` | Segredo interno para proteger endpoints do pipeline |

## Rodando localmente

```bash
# Desenvolvimento (com hot reload)
uv run uvicorn app.main:app --reload

# Ou via Docker Compose (recomendado)
make dev
```

API disponível em `http://localhost:8000`
Documentação Swagger em `http://localhost:8000/docs`

## Scripts disponíveis

```bash
# Inicialização do projeto
bash scripts/setup.sh

# Criar tabelas no Supabase
# Execute scripts/db_setup.sql no Supabase Dashboard → SQL Editor

# Sincronizar prompts para o LangFuse
bash scripts/sync_prompts.sh

# Resetar sessão (uso em desenvolvimento)
bash scripts/reset_session.sh <session_id>
```

## Estrutura

```
app/
├── main.py              # FastAPI app + lifespan + CORS
├── config.py            # Variáveis de ambiente (Pydantic Settings)
├── routers/
│   ├── session.py       # Endpoints públicos (cliente)
│   ├── admin.py         # Endpoints protegidos (admin)
│   └── pipeline.py      # Endpoints internos do pipeline
├── pipeline/
│   └── orchestrator.py  # Execução sequencial dos 4 subagentes
├── services/
│   ├── prompt_loader.py # Pull do LangFuse + cache local
│   ├── supabase_client.py
│   ├── document_service.py
│   └── email_service.py
└── models/
    └── schemas.py       # Pydantic models
```

Dependências gerenciadas com **uv** (`pyproject.toml` + `uv.lock`).
