# Agent Phases

Subagente da Fase 2 do pipeline de pré-venda. Organiza os módulos do projeto em fases de entrega sequenciais com escopo, valor entregue em linguagem de negócio, preço e critério de aceite por fase.

## Uso

Acionado pelo orquestrador após o agent-pricing. Recebe o bloco `[DISCOVERY_SUMMARY]` e o `[PRICING_SUMMARY]` para estruturar um plano de entrega coerente. Garante que cada fase entrega valor operacional independente ao cliente — não apenas "parte do sistema". O número de fases é determinado com base nos módulos reais do projeto, nunca fixo.

## Variáveis de Entrada

- `discovery_summary` (obrigatório): Bloco `[DISCOVERY_SUMMARY]` gerado pelo agent-discovery-generator. Contém módulos com classificação, modelo comercial recomendado, premissas e itens fora do MVP.
- `pricing_summary` (obrigatório): Bloco `[PRICING_SUMMARY]` gerado pelo agent-pricing. Contém faixas de preço por módulo e total do MVP.

## Onde é Utilizado

- Fase 2 do pipeline de pré-venda (acionado pelo orquestrador)
- Output alimenta agent-proposal-generator

## Formato de Saída

Bloco `[PHASES_PLAN]` com:
- Modelo de entrega e número total de fases (1–4, conforme complexidade real do projeto)
- Por fase: nome, objetivo, módulos incluídos/excluídos com nota, valor entregue em linguagem de negócio, faixa de preço, critério de aceite, dependências e tipo de escopo (fechado/indicativo)
- Expansão futura: itens de Fase 2+ com descrição e quando fazem sentido
- Observações gerais de sequenciamento

## Changelog

### v1.1.0 (2026-05-07)
- Input simplificado: de 4 variáveis de seções markdown para `discovery_summary` + `pricing_summary`
- Agora consome os blocos estruturados diretamente em vez de extrair seções do documento completo
- Número de fases determinado dinamicamente pelos módulos reais — não mais hardcoded

### v1.0.0 (2026-05-07)
- Implementação inicial
- Princípios de sequenciamento: Core antes de Acessório, dependências respeitadas, máximo 4 fases
- Diferenciação de escopo por modelo comercial: fechado vs. indicativo
- Módulos com `requer_discovery_adicional` recebem nota explícita de risco