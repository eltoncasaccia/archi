# archi-prompts

Prompts dos agentes do Archi. Este diretório é a **fonte versionada** dos prompts;
o runtime não lê estes arquivos — veja [Como os prompts chegam ao runtime](#como-os-prompts-chegam-ao-runtime).

## Os agentes

| # | ID | Tipo | Fase | Função |
|---|---|---|---|---|
| 1 | `agent-discovery-interview` | agent | 1 | Conversa com o cliente, coleta requisitos |
| 2 | `agent-discovery-generator` | subagent | 2 | Análise estruturada em 13 seções |
| 3 | `agent-pricing` | subagent | 2 | Breakdown de preço por módulo |
| 4 | `agent-phases` | subagent | 2 | Plano de fases entregáveis |
| 5 | `agent-proposal-generator` | subagent | 2 | Redação da proposta (DOCX/PDF) |

A coordenação da Fase 2 é feita pelo **orchestrator**, que não é um prompt: é código Python
determinístico em [`archi-api/app/pipeline/orchestrator.py`](../archi-api/app/pipeline/orchestrator.py).
Spec: [`docs/reference/orchestrator.md`](../docs/reference/orchestrator.md). Decisão: [ADR-006](../docs/adr/adr-006-orchestrator-sem-framework.md).

### Vocabulário

- **agent** — interage com um humano em tempo real. Ponto de entrada do sistema.
- **subagent** — invocado pelo orchestrator, sem contato com humanos. Entrada estruturada → saída estruturada.
- **orchestrator** — coordena os subagents em sequência: gerencia estado, repassa saídas e trata erros.
- **skill** — capacidade de produzir ou ler um tipo de arquivo (`docx`, `pdf`, `file-reading`). Vive no repositório de skills do Claude Code, não aqui.
- **tool** — função chamável durante a execução. `agent-discovery-interview` usa `file-reading` para ler documentos enviados pelo cliente.

## Estrutura

```
archi-prompts/
├── README.md
└── <agent-id>/
    ├── README.md              ← documentação do agente
    └── v1.0.0/
        ├── prompt.yaml        ← o prompt (campo `template`)
        └── prompt.tests.yaml  ← casos de teste
```

Cada `prompt.yaml` tem as chaves `_type`, `id`, `version`, `description`, `tags`,
`input_variables` e `template`. O `sync_prompts.sh` publica o conteúdo de `template`.

> Os `prompt.tests.yaml` existem e têm casos escritos, mas **não há runner automatizado**.
> Hoje servem como especificação do comportamento esperado.

## Como os prompts chegam ao runtime

```
archi-prompts/<agent>/v1.0.0/prompt.yaml
        │
        │  make sync-prompts   (scripts/sync_prompts.sh)
        ▼
   LangFuse cloud            ← indexado por NOME, label "production"
        │
        │  startup da API     (app/services/prompt_loader.py)
        ▼
   archi-api em memória
        │
        └─ fallback: archi-api/prompts_cache.json
```

Consequências práticas:

- Editar um `prompt.yaml` **não muda nada** até rodar `make sync-prompts`.
- Os nomes dos prompts são fixos em dois lugares: `PROMPT_NAMES` em
  [`prompt_loader.py`](../archi-api/app/services/prompt_loader.py) e as chamadas
  `sync_prompt` em [`scripts/sync_prompts.sh`](../scripts/sync_prompts.sh).
  **Renomear uma pasta de agente exige atualizar os dois.**
- Se o LangFuse estiver indisponível na subida, a API cai no `prompts_cache.json`.
  Sem cache e sem LangFuse, a API não sobe.

## Contratos de interface

Blocos trocados entre agentes. São a superfície de acoplamento do pipeline — mudar um
quebra os consumidores.

| Bloco | Gerado por | Consumido por |
|---|---|---|
| `[DISCOVERY_APROVADO]` | agent-discovery-interview | agent-discovery-generator, agent-proposal-generator |
| `[DISCOVERY_SUMMARY]` | agent-discovery-generator | agent-pricing, agent-phases, agent-proposal-generator |
| `[PRICING_SUMMARY]` | agent-pricing | agent-phases, agent-proposal-generator |
| `[PHASES_PLAN]` | agent-phases | agent-proposal-generator |
| `[PROPOSAL_METADATA]` | agent-proposal-generator | orchestrator (rastreamento) |

**Ao alterar um agente, confira se os blocos de saída ainda respeitam o que os consumidores esperam.**

## Versionamento

Cada agente tem uma pasta por versão (`v1.0.0/`). Para uma nova versão, crie `v1.1.0/`
ao lado, aponte `sync_prompts.sh` para ela e publique. O LangFuse mantém o histórico
e a label `production` determina qual versão o runtime usa.
