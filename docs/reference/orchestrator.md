# orchestrator-scope-discovery

## Responsabilidade

Coordena a execução sequencial dos 4 subagentes da Fase 2 após o cliente aprovar o discovery na entrevista. Não é um agente LLM — é código Python determinístico que gerencia estado, repassa contratos entre subagentes e trata falhas.

---

## Gatilho

O orchestrator é acionado quando:

1. O `agent-discovery-interview` emite o bloco `[DISCOVERY_APROVADO]`
2. O frontend grava esse bloco no banco com status `pipeline_pending`
3. O endpoint FastAPI `/pipeline/start` é chamado com o `session_id`

A execução acontece em background (async), sem bloquear a resposta ao cliente.

---

## Input

```
session_id: string          — identificador único da sessão
DISCOVERY_APROVADO: string  — bloco gerado pelo agent-discovery-interview
```

Ambos são recuperados do banco pelo `session_id` no início da execução.

---

## Pipeline — etapas em ordem

### Etapa 1 — agent-discovery-generator

| | |
|---|---|
| **Recebe** | `[DISCOVERY_APROVADO]` |
| **Produz** | `[DISCOVERY_SUMMARY]` |
| **Consumido por** | Etapas 2, 3 e 4 |

Analisa o discovery em 13 seções estruturadas. Saída salva no banco antes de avançar.

---

### Etapa 2 — agent-pricing

| | |
|---|---|
| **Recebe** | `[DISCOVERY_SUMMARY]` |
| **Produz** | `[PRICING_SUMMARY]` |
| **Consumido por** | Etapas 3 e 4 |

Gera o breakdown de preço por módulo. Saída salva no banco antes de avançar.

---

### Etapa 3 — agent-phases

| | |
|---|---|
| **Recebe** | `[DISCOVERY_SUMMARY]` + `[PRICING_SUMMARY]` |
| **Produz** | `[PHASES_PLAN]` |
| **Consumido por** | Etapa 4 |

Gera o plano de fases e entregas. Saída salva no banco antes de avançar.

---

### Etapa 4 — agent-proposal-generator

| | |
|---|---|
| **Recebe** | `[DISCOVERY_APROVADO]` + `[DISCOVERY_SUMMARY]` + `[PRICING_SUMMARY]` + `[PHASES_PLAN]` |
| **Produz** | `[PROPOSAL_METADATA]` + arquivo DOCX/PDF |
| **Consumido por** | Orchestrator (rastreamento) |

Redige a proposta comercial completa e gera o arquivo. O arquivo é salvo no Supabase Storage. O `[PROPOSAL_METADATA]` é salvo no banco.

---

## Output

Ao final da execução bem-sucedida:

```
proposal_id: string         — ID do registro de proposta criado
file_url: string            — URL do DOCX/PDF no Supabase Storage
status: "pending_review"  — status atualizado no banco
notificacao: disparada      — admin recebe alerta para revisar
```

---

## Gerenciamento de estado

O orchestrator atualiza o status da sessão no banco a cada etapa:

| Momento | Status gravado |
|---|---|
| Início da execução | `pipeline_running` |
| Após etapa 1 | `discovery_generated` |
| Após etapa 2 | `pricing_generated` |
| Após etapa 3 | `phases_generated` |
| Após etapa 4 | `proposal_generated` |
| Pipeline completo | `pending_review` |
| Falha em qualquer etapa | `pipeline_error` |

Cada bloco intermediário (`[DISCOVERY_SUMMARY]`, `[PRICING_SUMMARY]`, `[PHASES_PLAN]`) é salvo no banco imediatamente após ser gerado — antes de avançar para a próxima etapa. Isso permite retomada e auditoria.

---

## Tratamento de erros

### Estratégia por etapa

Cada etapa tem **1 retry automático** em caso de falha (erro de API, timeout, resposta malformada).

Se a etapa falhar após o retry:

1. Status da sessão atualizado para `erro_pipeline`
2. Campo `erro_etapa` gravado no banco indicando qual subagente falhou
3. Campo `erro_mensagem` gravado com o detalhe do erro
4. Admin recebe notificação com a etapa que falhou
5. Pipeline interrompido — etapas seguintes não são executadas

### O que o admin pode fazer após um erro

- Ver no painel qual etapa falhou e a mensagem de erro
- Acionar manualmente o reprocessamento pelo endpoint `/pipeline/retry/{session_id}`
- O retry reprocessa o pipeline inteiro a partir do início (reprocessamento parcial por etapa é backlog — V1 não implementa)

---

## Notificações

O orchestrator dispara notificação ao admin em dois momentos:

| Evento | Tipo |
|---|---|
| Pipeline concluído com sucesso | "Proposta pronta para revisão" |
| Falha no pipeline | "Erro na geração — intervenção necessária" |

Canal de notificação a definir na implementação (email via Resend ou webhook interno).

---

## O que o orchestrator NÃO faz

- Não interpreta os blocos gerados pelos subagentes
- Não toma decisões baseadas no conteúdo das respostas
- Não altera nenhum dado produzido pelos subagentes
- Não interage com o cliente
- Não envia a proposta ao cliente — esse passo é manual (admin aprova e envia)

---

## Localização no repositório

| Artefato | Caminho |
|---|---|
| Implementação | [`archi-api/app/pipeline/orchestrator.py`](../../archi-api/app/pipeline/orchestrator.py) |
| Endpoint que dispara | [`archi-api/app/routers/pipeline.py`](../../archi-api/app/routers/pipeline.py) |
| Esta spec | `docs/reference/orchestrator.md` |

Não há `prompt.yaml`: o orchestrator não é um agente LLM, é código Python determinístico
(ver [ADR-006](../adr/adr-006-orchestrator-sem-framework.md)). Por isso ele não vive em
`archi-prompts/` nem é publicado no LangFuse.

---

## Dependências

| Dependência | Papel |
|---|---|
| LiteLLM | Chamadas LLM para cada subagente |
| Supabase | Leitura de input, gravação de estado e blocos intermediários |
| Supabase Storage | Armazenamento do arquivo DOCX/PDF gerado |
| python-docx / WeasyPrint | Geração do arquivo (responsabilidade do agent-proposal-generator) |
| LangFuse | Rastreamento de cada chamada LLM (custo, latência, prompt, resposta) |