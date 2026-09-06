# Archi

Sistema autônomo de pré-venda de software. Clientes conversam com um agente de IA, aprovam o levantamento de requisitos e recebem uma proposta comercial por email. O admin revisa e aprova o envio.

## Estrutura

Monorepo — os três módulos vivem neste mesmo repositório.

| Módulo | Descrição |
|---|---|
| `archi-api` | Backend FastAPI (Python) |
| `archi-web` | Frontend Next.js (TypeScript) |
| `archi-prompts` | Prompts dos agentes (YAML), sincronizados com o LangFuse |

```
archi/
├── archi-api/        ← backend FastAPI (inclui db/schema.sql)
├── archi-web/        ← frontend Next.js
├── archi-prompts/    ← prompts dos agentes
├── docs/
│   ├── reference/    ← tech-spec, screens, orchestrator (documentação viva)
│   ├── adr/          ← 9 decisões arquiteturais
│   ├── setup/        ← pré-requisitos e chaves
│   └── archive/      ← material histórico (implementação já concluída)
├── scripts/          ← scripts operacionais
├── docker-compose.yml
└── Makefile
```

## Início rápido

```bash
# 1. Criar os arquivos de ambiente
make setup

# 2. Preencher com suas chaves (ver docs/setup/prerequisites.md)
#    archi-api/.env  e  archi-web/.env.local

# 3. Criar as tabelas no Supabase
#    Dashboard → SQL Editor → executar archi-api/db/schema.sql

# 4. Publicar os prompts no LangFuse
make sync-prompts

# 5. Conferir se está tudo de pé antes de subir
make doctor

# 6. Subir tudo
make dev-build
```

`make doctor` testa o ambiente de verdade — Supabase (tabelas e bucket), LangFuse
(chaves e prompts publicados), provider LLM, Resend e as ferramentas locais — e diz
o que falta. É o primeiro comando a rodar quando algo não sobe.

Serviços após o start:

| Serviço | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| LangFuse | https://us.cloud.langfuse.com (cloud) |

## Comandos

| Comando | Script | Descrição |
|---|---|---|
| `make dev` | `scripts/dev.sh` | Sobe os serviços via Docker Compose |
| `make dev-build` | `scripts/dev.sh --build` | Sobe com rebuild das imagens |
| `make setup` | `scripts/setup.sh` | Inicializa o projeto (deps, `.env`) |
| `make doctor` | `scripts/doctor.sh` | Verifica se o ambiente está pronto para rodar |
| `make sync-prompts` | `scripts/sync_prompts.sh` | Envia os prompts para o LangFuse cloud |
| `make reset-session` | `scripts/reset_session.sh` | Reseta o status de uma sessão (dev) |

## Documentação

| Documento | Conteúdo |
|---|---|
| [docs/reference/tech-spec.md](docs/reference/tech-spec.md) | Arquitetura, stack, schema, endpoints, env vars |
| [docs/reference/screens.md](docs/reference/screens.md) | Comportamento de cada tela |
| [docs/reference/orchestrator.md](docs/reference/orchestrator.md) | Spec do pipeline de subagentes |
| [docs/adr/](docs/adr/) | Decisões arquiteturais (ADR-001 a ADR-009) |
| [docs/setup/prerequisites.md](docs/setup/prerequisites.md) | Contas, chaves e pré-requisitos |
| [archi-prompts/README.md](archi-prompts/README.md) | Os 5 agentes e seus contratos de interface |

`docs/archive/` guarda o material da implementação inicial (já concluída) — referência histórica, não guia de uso.

## Stack

- **Backend:** FastAPI + Python 3.12 + uv
- **Frontend:** Next.js 14 + TypeScript + Tailwind
- **LLM:** LiteLLM + OpenRouter
- **Banco e storage:** Supabase (PostgreSQL)
- **Prompts e tracing:** LangFuse cloud
- **Docs gerados:** python-docx + WeasyPrint
- **Email:** Resend
- **Infra local:** Docker Compose
