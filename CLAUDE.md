# Archi — Claude Code Context

## O que é este projeto

Sistema autônomo de pré-venda de software.
Clientes conversam com um agente de IA, aprovam o levantamento de requisitos
e recebem uma proposta comercial por email. O admin revisa e aprova antes do envio.

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | FastAPI + Python 3.12 + uv |
| Frontend | Next.js 14+ (App Router, TypeScript) |
| LLM | LiteLLM + OpenRouter |
| Banco | Supabase (PostgreSQL) |
| Prompts + tracing | LangFuse (cloud — us.cloud.langfuse.com) |
| Docs gerados | python-docx + WeasyPrint |
| Email | Resend |

## Estrutura de pastas

```
SCOPE-DISCOVERY/
├── docs/               ← documentação (TECH SPEC, SCREENS, ADRs...)
├── scripts/            ← scripts operacionais (dev.sh, setup.sh, sync_prompts.sh, db_setup.sql)
├── archi-prompts/     ← prompts dos agentes (YAML)
├── archi-api/         ← backend FastAPI
├── archi-web/         ← frontend Next.js
├── docker-compose.yml
├── Makefile
└── CLAUDE.md
```

## Ambiente — subir e parar

```bash
make dev          # sobe api + web (Docker Compose)
make dev-build    # sobe com rebuild de imagens
```

Para parar: `Ctrl+C` no terminal onde está rodando, ou `docker compose down` em outro terminal.

## ⚠️ IMPORTANTE — execute comandos dentro do container

**Sempre rode comandos no container — nunca no host.
Omita a flag `-it` (Claude Code não suporta TTY).**

```bash
# Backend — exemplos
docker compose exec api uv run python -c "import app"
docker compose exec api uv run python scripts/algum_script.py

# Frontend — exemplos
docker compose exec web npm run build
docker compose exec web npx tsc --noEmit
```

> Python no container: `uv run` gerencia o venv automaticamente — não é necessário ativar.
> Localmente (fora do Docker): `cd archi-api && uv run <comando>`, ou ative com
> `source archi-api/.venv/bin/activate` e rode `python` diretamente.

## Logs

```bash
docker compose logs -f api    # backend em tempo real
docker compose logs -f web    # frontend em tempo real
docker compose logs api       # snapshot
```

## Migrations / banco de dados

Alterações de schema: execute no **Supabase Dashboard → SQL Editor**, ou via **MCP do Supabase** no Claude Code.

O arquivo de referência com o schema completo é `scripts/db_setup.sql`.

## Inicialização (primeira vez)

```bash
make setup              # cria .env a partir dos .env.example
# → preencha archi-api/.env e archi-web/.env.local com suas chaves
make dev-build          # sobe os serviços
make sync-prompts       # sincroniza prompts com LangFuse cloud
```

Ver `docs/PREREQUISITES.md` para onde obter cada chave.

## Documentação em `docs/`

| Arquivo | Conteúdo |
|---|---|
| `TECH SPEC — Archi.md` | Arquitetura, stack, schemas, endpoints, env vars |
| `SCREENS.md` | Comportamento de cada tela |
| `ADRs/` | 9 decisões arquiteturais |
| `PREREQUISITES.md` | Pré-requisitos e chaves necessárias |
| `orchestrator-scope-discovery.md` | Spec do pipeline |

## Regras

1. **Não tome decisões de arquitetura** — tudo está nos ADRs. Consulte o ADR relevante antes de questionar
2. **Pergunte antes de implementar** se algo não estiver claro nos docs
3. **Não instale bibliotecas sem confirmar** — use `uv add <pacote>` no backend, `npm install <pacote>` no frontend
4. **Carregue apenas os arquivos da tarefa atual** — não leia toda a documentação de uma vez

## Skills instaladas

| Área | Skill |
|---|---|
| LangFuse (tracing, prompts) | `langfuse` |
| Supabase (banco, migrations, RLS) | `supabase`, `supabase-postgres-best-practices` |
| Geração de documentos Word | `docx` |
| Geração/manipulação de PDF | `pdf` |
| Interfaces e componentes frontend | `frontend-design` |
| Criar/melhorar skills | `skill-creator` |
| Descobrir novas skills | `find-skills` |
