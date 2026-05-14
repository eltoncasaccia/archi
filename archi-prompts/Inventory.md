# Inventory — Pre-Sales Pipeline

## Prompts criados

| # | ID | Tipo | Fase | Versão | Skills | Tools | Status |
|---|---|---|---|---|---|---|---|
| 1 | agent-discovery-interview | agent | 1 | 1.0.0 | — | file-reading | ✅ Pronto |
| 2 | agent-discovery-generator | subagent | 2 | 1.0.0 | file-reading | — | ✅ Pronto |
| 3 | agent-pricing | subagent | 2 | 1.0.0 | — | — | ✅ Pronto |
| 4 | agent-phases | subagent | 2 | 1.0.0 | — | — | ✅ Pronto |
| 5 | agent-proposal-generator | subagent | 2 | 1.0.0 | docx (ou pdf) | — | ✅ Pronto |
| 6 | orchestrator-pre-sales | orchestrator | 2 | — | — | — | ⏳ Pendente |

---

## agent vs subagent vs orchestrator vs skill vs tool

**agent** — interage diretamente com um humano em tempo real. Ponto de entrada do sistema. Neste projeto: o agente de entrevista que conversa com o cliente.

**subagent** — invocado pelo orchestrator, sem contato direto com humanos. Recebe entrada estruturada, processa e retorna saída estruturada.

**orchestrator** — coordena a execução sequencial dos subagents. Gerencia estado, repassa saídas de um para o outro e trata erros. Ainda não criado.

**skill** — capacidade especializada para produzir ou ler um tipo específico de arquivo. Exemplos: `file-reading` (ler PDF/DOCX), `docx` (gerar Word), `pdf` (gerar PDF). Skills ficam no repositório de skills do Claude Code, não aqui.

**tool** — função que o agent pode chamar durante a execução. Neste projeto, `agent-discovery-interview` usa `file-reading` como tool (lê documentos enviados pelo cliente durante a conversa). Diferença prática: skill é usada para geração de saída, tool é usada durante o raciocínio.

---

## Estrutura do repositório

```
prompts/
├── registry.yaml                          ← fazer merge de registry-pre-sales.yaml aqui
└── pre-sales/
    ├── PIPELINE-OVERVIEW.md               ← documentação completa do pipeline
    ├── agent-discovery-interview/
    │   ├── README.md
    │   └── v1.0.0/
    │       ├── prompt.yaml
    │       └── prompt.tests.yaml          ← criar
    ├── agent-discovery-generator/
    │   ├── README.md
    │   └── v1.0.0/
    │       ├── prompt.yaml
    │       └── prompt.tests.yaml          ← criar
    ├── agent-pricing/
    │   ├── README.md
    │   └── v1.0.0/
    │       ├── prompt.yaml
    │       └── prompt.tests.yaml          ← criar
    ├── agent-phases/
    │   ├── README.md
    │   └── v1.0.0/
    │       ├── prompt.yaml
    │       └── prompt.tests.yaml          ← criar
    └── agent-proposal-generator/
        ├── README.md
        └── v1.0.0/
            ├── prompt.yaml
            └── prompt.tests.yaml          ← criar
```

---

## Mapeamento de arquivos (gerado → destino no repositório)

| Arquivo gerado | Destino no repositório |
|---|---|
| agent-discovery-interview.yaml | pre-sales/agent-discovery-interview/v1.0.0/prompt.yaml |
| README-agent-entrevista-discovery.md | pre-sales/agent-discovery-interview/README.md |
| agent-discovery-generator.yaml | pre-sales/agent-discovery-generator/v1.0.0/prompt.yaml |
| README-agent-discovery-generator.md | pre-sales/agent-discovery-generator/README.md |
| agent-pricing.yaml | pre-sales/agent-pricing/v1.0.0/prompt.yaml |
| README-agent-pricing.md | pre-sales/agent-pricing/README.md |
| agent-phases.yaml | pre-sales/agent-phases/v1.0.0/prompt.yaml |
| README-agent-phases.md | pre-sales/agent-phases/README.md |
| agent-proposal-generator.yaml | pre-sales/agent-proposal-generator/v1.0.0/prompt.yaml |
| README-agent-proposal-generator.md | pre-sales/agent-proposal-generator/README.md |
| registry-pre-sales.yaml | fazer merge em registry.yaml |
| PIPELINE-OVERVIEW.md | pre-sales/PIPELINE-OVERVIEW.md |

---

## Blocos entre agentes (contratos de interface)

| Bloco | Gerado por | Consumido por |
|---|---|---|
| [DISCOVERY_APROVADO] | agent-discovery-interview | agent-discovery-generator, agent-proposal-generator |
| [DISCOVERY_SUMMARY] | agent-discovery-generator | agent-pricing, agent-phases, agent-proposal-generator |
| [PRICING_SUMMARY] | agent-pricing | agent-phases, agent-proposal-generator |
| [PHASES_PLAN] | agent-phases | agent-proposal-generator |
| [PROPOSAL_METADATA] | agent-proposal-generator | orchestrator (rastreamento) |

---

## Pendências (próxima sessão)

- [ ] orchestrator-pre-sales (prompt + README)
- [ ] prompt.tests.yaml para cada agent
- [ ] Arquitetura técnica (gerenciamento de estado, retry, painel administrativo, pipeline de e-mail)