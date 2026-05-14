# ADR-007 — Supabase Python client sem SQLAlchemy

**Status:** Aceito  
**Data:** 2026

---

## Contexto

O backend precisa de uma camada de acesso ao banco de dados Supabase. As opções principais são o SDK oficial do Supabase (`supabase-py`) ou um ORM Python como SQLAlchemy com conexão direta ao PostgreSQL.

## Decisão

Usar o **Supabase Python client (`supabase-py`)** para todas as operações de banco. Não usar SQLAlchemy.

## Justificativa

- As operações do sistema são majoritariamente CRUD simples — sem queries complexas com múltiplos JOINs ou agregações que justifiquem um ORM
- `supabase-py` integra nativamente com Auth (validação de JWT), Storage e Row Level Security
- SQLAlchemy adicionaria uma segunda camada de modelos além do Pydantic — duplicação sem benefício
- Sem necessidade de gerenciar migrations com Alembic — o schema é gerenciado diretamente no Supabase via SQL ou MCP
- `supabase-py` suporta operações async nativamente

## Consequências

**Positivas:**
- Menos dependências e menos código boilerplate
- Integração direta com Auth e Storage do Supabase
- Stack mais simples — um desenvolvedor solo mantém com facilidade

**Negativas:**
- Se no futuro o banco mudar de Supabase para PostgreSQL puro, será necessário reescrever a camada de dados (baixo risco — Supabase é PostgreSQL)

## Alternativas consideradas

- **SQLAlchemy + asyncpg:** descartado — models duplicados (Pydantic + SQLAlchemy), configuração adicional de conexão, perde integração nativa com Supabase Auth e Storage
- **asyncpg direto:** descartado — muito baixo nível, exige escrever SQL manual para tudo, perde as abstrações do Supabase