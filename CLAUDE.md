# Archi — Claude Code Context

## O que é este projeto

Sistema autônomo de pré-venda de software.
Clientes conversam com um agente de IA, aprovam o levantamento de requisitos
e recebem uma proposta comercial por email. O admin revisa e aprova antes do envio.

Visão geral, stack e comandos: veja o [README.md](README.md).
Este arquivo cobre só o que muda a forma de trabalhar no repositório.

## Estrutura

```
archi/
├── archi-api/          ← backend FastAPI
│   ├── app/            ← routers, services, pipeline, models
│   └── db/schema.sql   ← schema do Supabase (source of truth)
├── archi-web/          ← frontend Next.js (App Router)
├── archi-prompts/      ← prompts dos agentes (YAML)
├── docs/
│   ├── reference/      ← tech-spec.md, screens.md, orchestrator.md
│   ├── adr/            ← adr-001 … adr-009
│   ├── setup/          ← prerequisites.md
│   └── archive/        ← histórico, NÃO usar como guia
├── scripts/
├── docker-compose.yml
└── Makefile
```

## ⚠️ Execute comandos dentro do container

**Sempre rode comandos no container — nunca no host.
Omita a flag `-it` (Claude Code não suporta TTY).**

```bash
# Backend
docker compose exec api uv run python -c "import app"
docker compose exec api uv run python scripts/algum_script.py

# Frontend
docker compose exec web npm run build
docker compose exec web npx tsc --noEmit
```

> Python no container: `uv run` gerencia o venv automaticamente — não precisa ativar.
> Localmente (fora do Docker): `cd archi-api && uv run <comando>`.

Subir/parar: `make dev` (ou `make dev-build`); `Ctrl+C`, ou `docker compose down` em outro terminal.

## Logs

```bash
docker compose logs -f api    # backend em tempo real
docker compose logs -f web    # frontend em tempo real
docker compose logs api       # snapshot
```

## Banco de dados

`archi-api/db/schema.sql` é o **source of truth** do schema.

Não há ferramenta de migration: alterações de schema são aplicadas à mão no
**Supabase Dashboard → SQL Editor** (ou via MCP do Supabase). Ao alterar o schema,
**atualize `archi-api/db/schema.sql` no mesmo commit** — senão ele deixa de refletir o banco.

Tabelas: `sessions`, `messages`, `proposals`, `notifications`, `access_codes`.
Storage bucket: `proposals`.

## Prompts e LangFuse

Os prompts YAML em `archi-prompts/` **não são lidos em runtime**. O fluxo é:

1. `make sync-prompts` publica os YAMLs no LangFuse cloud, pelo nome
2. Na subida da API, `app/services/prompt_loader.py` busca por nome no LangFuse
3. Fallback: `archi-api/prompts_cache.json` (gerado no primeiro fetch bem-sucedido)

Os nomes dos 5 prompts estão fixos em `PROMPT_NAMES` (`prompt_loader.py`) e nas chamadas
de `scripts/sync_prompts.sh`. **Renomear uma pasta de agente exige atualizar os dois.**

## Regras

1. **Não tome decisões de arquitetura** — tudo está nos ADRs. Consulte o ADR relevante antes de questionar
2. **Pergunte antes de implementar** se algo não estiver claro nos docs
3. **Não instale bibliotecas sem confirmar** — `uv add <pacote>` no backend, `npm install <pacote>` no frontend
4. **Carregue apenas os arquivos da tarefa atual** — não leia toda a documentação de uma vez
5. **Documentação sempre atualizada** — antes de QUALQUER alteração no codebase:
   - Consulte a documentação relevante (`docs/reference/`, `docs/adr/`, `archi-prompts/README.md`)
   - Verifique se a mudança conflita com as regras, ADRs ou especificações
   - Identifique riscos: quebra de sistema, impacto em outros componentes, violação de contrato entre agentes
   - Se há risco significativo, **pergunte ao usuário** antes de continuar
   - Se continuar: **atualize todos os documentos afetados** no mesmo commit
   - Se interromper: a mudança não é feita, o documento permanece correto como source of truth

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
