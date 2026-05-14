# Archi

Sistema autônomo de pré-venda de software. Clientes conversam com um agente de IA, aprovam o levantamento de requisitos e recebem uma proposta comercial por email. O admin revisa e aprova o envio.

## Repositórios

| Repositório | Descrição |
|---|---|
| `archi-api` | Backend FastAPI (Python) |
| `archi-web` | Frontend Next.js (TypeScript) |
| `archi-prompts` | Prompts dos agentes (YAML) |

## Scripts

Os scripts operacionais ficam em `scripts/`:

| Script | Descrição |
|---|---|
| `scripts/dev.sh` | Sobe os serviços via Docker Compose |
| `scripts/setup.sh` | Inicializa o projeto (deps, .env) |
| `scripts/sync_prompts.sh` | Envia prompts para o LangFuse cloud |
| `scripts/reset_session.sh` | Reseta status de uma sessão (dev) |
| `scripts/db_setup.sql` | SQL para criar as tabelas no Supabase |

Use via `make` na raiz:
```bash
make dev          # sobe os serviços
make dev-build    # sobe com rebuild
make setup        # inicializa o projeto
make sync-prompts # sincroniza prompts com LangFuse
make reset-session# reseta uma sessão
```

## Documentação

Toda a documentação está em `docs/`:

| Arquivo | Conteúdo |
|---|---|
| `TECH SPEC — Archi.md` | Arquitetura técnica completa (stack, banco, endpoints, env vars) |
| `SCREENS.md` | Comportamento de cada tela |
| `ADRs/` | Decisões arquiteturais |
| `PREREQUISITES.md` | Pré-requisitos e contas necessárias |

## Início rápido

```bash
# 1. Configure as variáveis de ambiente
cp archi-api/.env.example archi-api/.env
cp archi-web/.env.example archi-web/.env.local
# Edite os dois arquivos com suas chaves (ver docs/PREREQUISITES.md)

# 2. Suba tudo
make dev-build
```

Serviços disponíveis após o start:

| Serviço | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| LangFuse (cloud) | https://us.cloud.langfuse.com |

## Stack

- **Backend:** FastAPI + Python 3.12 + uv
- **Frontend:** Next.js 14 + TypeScript + Tailwind
- **LLM:** LiteLLM + OpenRouter
- **Banco:** Supabase (PostgreSQL)
- **Prompts e tracing:** LangFuse cloud
- **Docs gerados:** python-docx + WeasyPrint
- **Email:** Resend
- **Infra local:** Docker Compose