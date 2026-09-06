# ADR-006 — Orchestrator como código Python sem framework de agentes

**Status:** Aceito  
**Data:** 2026

---

## Contexto

O pipeline da Fase 2 executa 4 subagentes em sequência fixa, com contratos de entrada e saída já definidos. É necessário decidir se o orchestrator será implementado como um agente LLM (usando LangGraph ou similar) ou como código Python determinístico.

## Decisão

Implementar o `orchestrator-scope-discovery` como uma **função Python async** que executa os 4 subagentes em sequência, sem nenhum framework de orquestração de agentes.

## Justificativa

- O pipeline é linear e fixo — não há decisões dinâmicas a tomar, ramificações ou loops
- Um orquestrador LLM adicionaria tokens e latência para "decidir" algo que já está decidido em design
- Código Python determinístico é mais previsível, mais fácil de debugar e mais barato
- LangGraph é adequado para fluxos com ramificações e estado complexo — não é o caso aqui
- O orchestrator não precisa de um prompt: ele é lógica de controle, não raciocínio

## Fluxo implementado

```python
async def run_pipeline(session_id):
    discovery_summary  = await run_subagent("agent-discovery-generator", discovery_aprovado)
    pricing_summary    = await run_subagent("agent-pricing", discovery_summary)
    phases_plan        = await run_subagent("agent-phases", discovery_summary + pricing_summary)
    proposal_metadata  = await run_subagent("agent-proposal-generator", todos_os_blocos)
```

## Consequências

**Positivas:**
- Execução determinística — mesmo input sempre produz mesmo fluxo
- Debug direto: stack trace Python mostra exatamente onde falhou
- Zero custo de tokens para orquestração
- Retry, estado e notificações controlados explicitamente no código

**Negativas:**
- Qualquer mudança na sequência do pipeline exige alteração de código (aceitável — a sequência é estável por design)

## Alternativas consideradas

- **LangGraph:** descartado — projetado para fluxos com estado complexo e ramificações; overhead injustificado para pipeline linear
- **LangChain chains:** descartado — abstração desnecessária, dificulta debug, não oferece benefício real aqui
- **Prefect / Airflow:** descartado — ferramentas de orquestração de dados, excesso de infraestrutura para 4 etapas sequenciais