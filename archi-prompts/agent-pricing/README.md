# Agent Pricing

Subagente da Fase 2 do pipeline de pré-venda. Recebe o bloco compacto `[DISCOVERY_SUMMARY]` e os parâmetros comerciais internos para gerar breakdown de preço por módulo com faixas defensáveis e contingência de risco.

## Uso

Acionado pelo orquestrador após o agent-discovery-generator. Recebe o bloco `[DISCOVERY_SUMMARY]` já estruturado — não extrai seções do documento completo — mantendo o consumo de tokens baixo. Output alimenta agent-phases e agent-proposal-generator.

## Variáveis de Entrada

- `discovery_summary` (obrigatório): Bloco `[DISCOVERY_SUMMARY]` gerado pelo agent-discovery-generator. Contém módulos com complexidade e classificação, riscos com severidade, modelo comercial recomendado, complexidade geral, premissas, lacunas e itens fora do MVP.
- `parametros_comerciais` (obrigatório): Tabela interna com valor da hora técnica, faixas de esforço por nível de complexidade e margem de risco a aplicar.

## Onde é Utilizado

- Fase 2 do pipeline de pré-venda (acionado pelo orquestrador)
- Output alimenta agent-phases e agent-proposal-generator

## Formato de Saída

Bloco `[PRICING_SUMMARY]` com:
- Modelo comercial confirmado e moeda
- Lista de módulos Core do MVP com faixa mínima/máxima, riscos aplicados e flag `requer_discovery_adicional`
- Total do MVP com margem de risco global aplicada
- Faixas indicativas para itens de Fase 2
- Condições de validade e premissas de precificação

## Changelog

### v1.1.0 (2026-05-07)
- Input simplificado: de 5 variáveis de seções markdown para `discovery_summary` + `parametros_comerciais`
- Agora consome o bloco `[DISCOVERY_SUMMARY]` diretamente em vez de extrair seções do documento completo

### v1.0.0 (2026-05-07)
- Implementação inicial
- Protocolo de precificação em 4 passos: esforço por módulo → ajuste por risco → total MVP → Fase 2 indicativa
- Risco CRÍTICO gera flag `requer_discovery_adicional` em vez de preço falso