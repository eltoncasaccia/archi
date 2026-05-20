# Scope Discovery Pipeline — Prompts

Conjunto de 5 agentes + 1 orchestrator para automação de entrevista e proposta comercial. **Documentação técnica dos prompts** — para orquestração e execução, veja o projeto [scope-discovery](https://github.com/seu-org/scope-discovery).

## Estrutura

| # | Agente | Tipo | Função | Status |
|---|---|---|---|---|
| 1 | `agent-discovery-interview` | agent | Conversa com cliente, coleta requisitos | ✅ v1.0.0 |
| 2 | `agent-discovery-generator` | subagent | Processa descoberta, gera summary | ✅ v1.0.0 |
| 3 | `agent-pricing` | subagent | Calcula pricing | ✅ v1.0.0 |
| 4 | `agent-phases` | subagent | Define fases do projeto | ✅ v1.0.0 |
| 5 | `agent-proposal-generator` | subagent | Gera proposta em DOCX/PDF | ✅ v1.0.0 |
| 6 | `orchestrator-scope-discovery` | orchestrator | Coordena pipeline | ⏳ Pendente |

## Contratos de Interface

Blocos de dados trocados entre agentes (interfaces que devem ser mantidas estáveis):

- **[DISCOVERY_APROVADO]** — Saída de `agent-discovery-interview`, entrada de `agent-discovery-generator` e `agent-proposal-generator`
- **[DISCOVERY_SUMMARY]** — Saída de `agent-discovery-generator`, entrada de `agent-pricing`, `agent-phases`, `agent-proposal-generator`
- **[PRICING_SUMMARY]** — Saída de `agent-pricing`, entrada de `agent-phases` e `agent-proposal-generator`
- **[PHASES_PLAN]** — Saída de `agent-phases`, entrada de `agent-proposal-generator`
- **[PROPOSAL_METADATA]** — Saída de `agent-proposal-generator`, rastreamento no orchestrator

**⚠️ Ao modificar um agente, verificar se seus blocos de saída respeitam os contratos esperados pelos consumidores.**

## Como usar

```bash
# Rodar testes de todos os prompts
pytest tests/ -v

# Rodar teste específico do pipeline scope-discovery
pytest tests/test_prompts.py -k "scope_discovery" -v
```

## Detalhes técnicos completos

Ver [Inventory.md](./Inventory.md) para:
- Estrutura do repositório
- Mapeamento de arquivos
- Definições de agent/subagent/orchestrator/skill/tool
- Pendências da próxima sessão

## Referências

- **Repositório de execução**: [scope-discovery](https://github.com/seu-org/scope-discovery) — backend, frontend, orquestração
- **CLAUDE.md**: Contexto geral do repositório de prompts
- **registry.yaml**: Registro versionado de todos os prompts
