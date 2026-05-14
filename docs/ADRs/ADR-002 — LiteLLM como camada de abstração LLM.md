# ADR-002 — LiteLLM como camada de abstração LLM

**Status:** Aceito  
**Data:** 2026

---

## Contexto

O sistema faz chamadas a modelos LLM em múltiplos pontos (entrevista + 4 subagentes do pipeline). A escolha de um provider específico (Anthropic, OpenAI, Google) criaria lock-in: trocar de modelo exigiria reescrever todas as chamadas. O mercado de LLMs ainda está em evolução acelerada — preços, qualidade e disponibilidade mudam frequentemente.

## Decisão

Usar **LiteLLM** como única interface para todas as chamadas LLM do sistema.

## Justificativa

- Interface unificada: trocar de provider é alterar uma string (`"anthropic/claude-sonnet-4-5"` → `"openai/gpt-4o"`)
- Suporta 100+ modelos e providers sem mudança de código
- Integração nativa com LangFuse via callback — rastreamento automático de tokens, custo e latência
- Biblioteca Python open source, gratuita, sem servidor intermediário necessário
- Fallback entre providers configurável se necessário no futuro

## Consequências

**Positivas:**
- Zero lock-in de provider
- Troca de modelo em produção sem deploy de código (apenas variável de ambiente)
- Rastreamento automático de custos por provider via LangFuse

**Negativas:**
- Camada de abstração adicional — em caso de bug, depurar envolve o LiteLLM além do provider
- Features muito específicas de um provider podem não estar disponíveis via LiteLLM

## Alternativas consideradas

- **SDK Anthropic direto:** descartado — lock-in total, impossível comparar modelos ou migrar
- **SDK OpenAI direto:** mesmo problema
- **LangChain:** descartado — abstração excessiva para um pipeline sequencial já definido; dificulta debug