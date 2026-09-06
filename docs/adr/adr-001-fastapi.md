# ADR-001 — FastAPI + Python como framework do backend

**Status:** Aceito  
**Data:** 2026

---

## Contexto

O backend precisa suportar respostas em streaming (SSE) para o chat em tempo real, execução assíncrona de pipelines em background, e integração com bibliotecas Python do ecossistema de IA (LiteLLM, LangFuse, python-docx, WeasyPrint). A escolha da linguagem e framework impacta diretamente a compatibilidade com essas ferramentas.

## Decisão

Usar **FastAPI** com **Python 3.12+** como framework do backend.

## Justificativa

- Suporte nativo a async/await — essencial para streaming e pipelines em background
- Ecossistema Python é o padrão de fato para ferramentas de IA/LLM
- Tipagem com Pydantic integrada ao FastAPI — validação automática de request/response
- Documentação automática via OpenAPI (`/docs`) sem configuração adicional
- LiteLLM, LangFuse, python-docx e WeasyPrint são todos bibliotecas Python

## Consequências

**Positivas:**
- Compatibilidade total com o ecossistema de IA escolhido
- Desenvolvimento rápido com validação automática
- Documentação da API gerada automaticamente

**Negativas:**
- Python tem overhead de memória maior que Go ou Rust — irrelevante para o volume esperado

## Alternativas consideradas

- **Node.js + Express:** descartado — ecossistema de IA menos maduro, geração de DOCX/PDF mais limitada
- **Django:** descartado — overhead desnecessário para uma API; não é async-first