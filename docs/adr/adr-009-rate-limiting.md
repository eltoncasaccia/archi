# ADR-009 — Rate limiting por sessão para controle de custo LLM

**Status:** Aceito  
**Data:** 2026

---

## Contexto

O custo das chamadas LLM é variável na fase de entrevista: um cliente que interage por muito tempo pode gerar prejuízo significativo. A fase de pipeline (4 subagentes) tem custo fixo e previsível por proposta. O risco de custo está concentrado na entrevista (agent-discovery-interview), que não tem limite natural de duração.

## Decisão

Implementar **rate limiting por sessão** rastreando `message_count` e `input_tokens` na tabela `sessions`. Antes de processar cada mensagem do cliente, verificar se os limites foram atingidos. Limites configuráveis via variáveis de ambiente.

## Limites padrão (configuráveis)

| Variável | Valor padrão | Descrição |
|---|---|---|
| `MAX_MESSAGES_PER_SESSION` | `40` | Máximo de mensagens do cliente por sessão |
| `MAX_INPUT_TOKENS_PER_SESSION` | `20000` | Máximo de tokens de input por sessão |

## Fluxo de verificação

```
Cliente envia mensagem
    ↓
Backend verifica session.message_count e session.input_tokens
    ├── Dentro do limite → processa mensagem, incrementa contadores
    └── Limite atingido → retorna aviso, não chama a LLM API
```

## Mensagem ao cliente quando limite é atingido

> "Chegamos ao limite desta sessão. Para projetos de maior escopo, entre em contato diretamente."

## Campos adicionados à tabela `sessions`

```sql
message_count    INTEGER NOT NULL DEFAULT 0,
input_tokens     INTEGER NOT NULL DEFAULT 0,
```

## Rastreamento via LangFuse

O LangFuse registra automaticamente os tokens de cada chamada LLM. Os campos `input_tokens` no banco são atualizados pelo backend após cada chamada bem-sucedida. O LangFuse serve como fonte de verdade para auditoria de custos — o banco serve para enforcement dos limites em runtime.

## Consequências

**Positivas:**
- Custo máximo por sessão é previsível e controlável
- Limites ajustáveis sem deploy (via variáveis de ambiente)
- Base pronta para sistema de créditos na V2 — os contadores já existem

**Negativas:**
- Clientes legítimos com projetos complexos podem atingir o limite — mitigado pelo valor generoso do padrão e pela possibilidade de ajuste por env

## Roadmap — V2

Quando o sistema evoluir para SaaS com créditos:
- O limite por sessão deixa de ser por env e passa a ser calculado a partir dos créditos disponíveis do cliente
- Os campos `message_count` e `input_tokens` já estão no banco — só muda a lógica de verificação

## Alternativas consideradas

- **Sem limite:** descartado — risco de prejuízo em sessões longas ou uso abusivo
- **Limite por tempo (timeout):** descartado — não controla custo diretamente; uma sessão curta pode consumir muitos tokens
- **Rate limiting por IP (slowapi):** complementar, não substituto — controla frequência de requisições, não custo por sessão