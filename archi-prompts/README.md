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

## Eval

```bash
make eval
```

Roda os `prompt.tests.yaml` **sem chamar LLM**: determinístico, instantâneo, de graça.
O `make sync-prompts` executa a eval antes de publicar e aborta se ela falhar.

Cada caso tem `inputs` (os valores das variáveis) e `expect_contains` (strings que
precisam aparecer no prompt montado). O runner checa três coisas:

| Checagem | Regressão que pega |
|---|---|
| Toda variável declarada tem input | Call site esqueceu de passar uma entrada |
| Todo input corresponde a uma variável | Prompt renomeou a variável, teste não acompanhou |
| Nenhum placeholder sobrou no texto | O conteúdo não chegou ao modelo |
| Todo `expect_contains` está presente | Prompt mudou e a asserção ficou obsoleta |

O runner usa `render_prompt()` de `archi-api/app/services/prompt_loader.py` — o mesmo
código da produção, não uma reimplementação que poderia divergir.

**Isto é a camada 1: montagem.** Não julga a qualidade da saída — não diz se o preço
faz sentido nem se a entrevista ficou boa. Isso é a camada 2, que exige chamar o modelo,
discoveries reais e faixas de preço aceitáveis para julgar contra.

## Como isto se atualiza sozinho

Os casos vivem em [`evals/casos-reais.yaml`](evals/casos-reais.yaml). Hoje são sintéticos,
calibrados pelo modelo de preço da produção. Substituir por reais é o objetivo — mas as
duas metades de um caso se atualizam de formas diferentes, e confundir isso quebra a eval.

**Os discoveries, sim.** Toda entrevista concluída grava o bloco em
`sessions.discovery_approved`. Colher, anonimizar nome/email/empresa e acrescentar ao
arquivo é trabalho mecânico. A carteira de casos cresce sozinha com o uso.

**As faixas de preço, não — e insistir nisso produz uma eval que mente.** Se o valor
esperado vier da estimativa que o próprio `agent-pricing` produziu, a eval passa a
comparar o agente com ele mesmo. Ela vai passar sempre, inclusive enquanto o agente
estiver consistentemente errado. Uma eval circular é pior que nenhuma: dá confiança sem
dar informação.

**O que dá verdade de preço é o desfecho comercial**, e o sistema não captura isso hoje.
O enum `proposal_status` vai até `sent` — rastreia o fluxo interno (revisar, aprovar,
enviar), não o que aconteceu depois: o cliente fechou? Por quanto? Quantas horas custou
de fato?

Para fechar esse laço faltam três campos em `proposals`:

| Campo | Para quê |
|---|---|
| `desfecho` | ganhou / perdeu / negociando |
| `valor_fechado` | quanto o cliente de fato pagou |
| `horas_reais` | quanto custou entregar |

Com eles, a faixa aceitável de cada caso deixa de ser opinião e passa a ser histórico:
"projetos com este perfil fecharam entre R$ X e R$ Y, e custaram Z horas". É o mesmo dado
que sustenta a ideia de RAG sobre projetos passados — a estimativa deixa de ser palpite do
modelo e passa a ser ancorada no que a empresa já entregou. E é um moat que cresce com o
uso: um concorrente novo não tem esse histórico.

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
