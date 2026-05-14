# Agent Discovery Generator

Subagente analítico da Fase 2 do pipeline de pré-venda. Recebe o bloco `[DISCOVERY_APROVADO]` gerado pelo agente de entrevista — mais documentos opcionais enviados pelo cliente — e produz uma análise estruturada de discovery em 13 seções. O output é a base confiável e defensável para o orçamento macro, alimentando os agentes de pricing, fases entregáveis e geração de proposta.

## Uso

Este agente é acionado automaticamente pelo orquestrador da Fase 2 após a aprovação do cliente na entrevista. Não é acessado diretamente pelo cliente. Recebe dados compactos e estruturados (não transcrição bruta), analisa cruzamentos, detecta complexidades ocultas, classifica riscos e recomenda modelo comercial.

Não entrega arquitetura detalhada, stack tecnológico, backlog completo ou estimativa de horas.

## Variáveis de Entrada

- `discovery_aprovado` (obrigatório): Bloco `[DISCOVERY_APROVADO]` gerado e aprovado pelo agente de entrevista. Contém todas as notas estruturadas da sessão com o cliente.
- `documentos_opcionais` (opcional): Arquivos enviados pelo cliente durante a entrevista (PDF, DOCX, planilhas). Use `"Nenhum"` se o cliente não enviou documentos.
- `preocupacoes_especificas` (opcional): Pontos de atenção identificados pelo time de pré-venda que merecem investigação aprofundada na análise. Use `"Nenhuma"` se não houver.

## Onde é Utilizado

- Fase 2 do pipeline de discovery e orçamento (acionado pelo orquestrador)
- Input para agent-pricing
- Input para agent-phases
- Input para agent-proposal-generator
- Revisão interna do time técnico antes de aprovação do orçamento

## Formato de Saída

Documento de análise estruturada em 13 seções:

1. **Resumo Executivo** — o que a empresa faz, problema operacional, sistema solicitado, objetivo, maturidade e complexidade percebida
2. **Escopo Macro** — 4 a 7 módulos com objetivo, complexidade e classificação Core / Acessório / Fase 2
3. **Confronto Operação Atual vs. Wishlist** — tabela cruzando o que existe hoje com o que foi pedido, identificando lacunas e severidade
4. **Funcionalidades Identificadas** — tabela por categoria com evidência rastreável, complexidade e observações
5. **Entidades de Negócio** — lista de entidades do domínio com objetivo operacional e dependências
6. **Perfis e Permissões** — perfis explícitos e implícitos, permissões sensíveis e necessidades de auditoria
7. **Riscos ao Orçamento** — tabela com riscos classificados em BAIXO / MÉDIO / ALTO / CRÍTICO
8. **Lacunas, Ambiguidades e Contradições** — itens que podem gerar retrabalho ou aumento de custo
9. **Premissas Assumidas** — cláusulas de proteção comercial para a proposta
10. **Perguntas Estratégicas** — até 12 perguntas categorizadas em Críticas / Importantes / Desejáveis
11. **Itens Sugeridos Fora do MVP** — candidatos à Fase 2 com justificativa
12. **Estimativa Macro de Complexidade e Risco** — classificação em 5 eixos (Muito Baixo a Muito Alto)
13. **Recomendação de Modelo Comercial** — orçamento fechado, por fases, discovery pago, MVP+expansão ou T&M

Convenções do output:
- Inferências marcadas como `[INFERÊNCIA]`
- Severidade de risco: BAIXO / MÉDIO / ALTO / CRÍTICO
- Sem menção a stack, linguagem, framework ou tecnologia específica

## Changelog

### v1.0.0 (2026-05-07)
- Implementação inicial derivada do agent-discovery-prevenda v1.0.0
- Entrada adaptada de `caminho_documentos` para `discovery_aprovado` + `documentos_opcionais`
- Protocolo de análise ajustado para trabalhar com notas de entrevista como fonte primária
- Fase 1 do protocolo reescrita para mapear a partir do bloco estruturado da entrevista
- Fase 2 (de-depuração cruzada) mantida — cruza processos atuais vs. funcionalidades pedidas
- Classificado como subagente da Fase 2 do pipeline