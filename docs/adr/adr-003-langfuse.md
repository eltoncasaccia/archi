# ADR-003 — LangFuse para prompt management e observabilidade

**Status:** Revisado (migrado para cloud em 2026-05)
**Data:** 2026

---

## Contexto

O sistema possui 5 prompts de agentes que precisam ser versionados, editados e avaliados ao longo do tempo. Além disso, é necessário rastrear o comportamento das chamadas LLM em produção: tokens consumidos, custo por sessão, latência por etapa, e identificar prompts com desempenho ruim. Essas duas necessidades — gestão de prompts e observabilidade — precisam ser atendidas de forma confiável.

## Decisão (atual)

Usar **LangFuse cloud** (`https://us.cloud.langfuse.com`) tanto para gerenciamento de prompts quanto para rastreamento de chamadas LLM.

## Histórico

A decisão original era usar LangFuse self-hosted via Docker Compose. Migrado para cloud em maio/2026 porque o SDK `langfuse>=4.6.1` é incompatível com LangFuse self-hosted v2 — a versão cloud funciona corretamente com o SDK atual.

**Impacto da migração:**
- Containers `langfuse-web`, `langfuse-worker`, `langfuse-db` removidos do `docker-compose.yml`
- `LANGFUSE_HOST` alterado para `https://us.cloud.langfuse.com` no `.env`
- O workaround em `main.py` (deletar env vars após startup) deve ser mantido — evita auto-detecção quebrada do LiteLLM
- Singleton de tracing em `app/services/tracing.py` — iniciado em `main.py` ANTES de deletar as env vars

## Justificativa

- Compatibilidade com SDK langfuse atual
- Gerenciamento de prompts: edição, versionamento e rollback sem deploy
- Observabilidade: rastreamento automático via callback do LiteLLM
- Evals nativos para medir qualidade dos agentes

## Consequências

**Positivas:**
- Prompts podem ser editados sem deploy
- Visibilidade total de custo e latência por sessão e por etapa
- Sem containers adicionais para operar

**Negativas:**
- Dados de trace saem da infraestrutura local (plano gratuito tem limites)
- Se LangFuse cloud ficar fora no startup, o sistema precisa de fallback (ver ADR-004)

## Alternativas consideradas

- **LangSmith:** descartado — produto da LangChain (ecossistema que não adotamos)
- **Helicone:** descartado — focado em observabilidade, sem gerenciamento de prompts
- **Prompts no código (sem ferramenta):** descartado — impossível editar prompts sem deploy, sem evals