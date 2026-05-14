# Agent Proposal Generator

Subagente final da Fase 2 do pipeline de pré-venda. Redige o conteúdo completo da proposta comercial para o cliente em linguagem clara, profissional e sem jargão técnico. O conteúdo gerado é entregue ao skill docx/pdf para formatação e geração do documento final.

## Uso

Acionado pelo orquestrador após o agent-phases. Consolida todos os outputs anteriores do pipeline em um documento coeso voltado ao cliente. Filtra deliberadamente informações internas (riscos, lacunas, complexidade técnica) que não devem aparecer na proposta comercial. O responsável comercial revisa e aprova antes do envio.

## Variáveis de Entrada

- `discovery_aprovado` (obrigatório): Bloco `[DISCOVERY_APROVADO]` original gerado na entrevista — usado para resgatar o contexto e a voz do cliente na seção de entendimento do projeto.
- `discovery_summary` (obrigatório): Bloco `[DISCOVERY_SUMMARY]` gerado pelo agent-discovery-generator. Contém módulos, premissas, problema central e modelo comercial recomendado.
- `pricing_summary` (obrigatório): Bloco `[PRICING_SUMMARY]` gerado pelo agent-pricing.
- `phases_plan` (obrigatório): Bloco `[PHASES_PLAN]` gerado pelo agent-phases.
- `dados_empresa_vendedora` (obrigatório): Nome, email, telefone e site da empresa que está vendendo.

## Onde é Utilizado

- Fase 2 do pipeline de pré-venda (último subagente do orquestrador)
- Output vai para skill docx/pdf para geração do arquivo final
- Documento revisado pelo responsável comercial antes do envio ao cliente

## Formato de Saída

Conteúdo em markdown limpo para o skill docx/pdf, estruturado em 8 seções:
1. **Apresentação** — quem está enviando e como foi o processo
2. **Entendimento do Projeto** — problema e contexto em linguagem de negócio
3. **O que será desenvolvido** — módulos Core do MVP + lista do que não está incluído
4. **Como será entregue** — fases com objetivo, valor entregue e critério de aceite
5. **Investimento** — preços por fase e total, condições de pagamento (a preencher)
6. **Premissas e condições de validade** — reescrita em linguagem simples
7. **Próximos passos** — caminho do "sim" até o início (parcialmente a preencher)
8. **Contato** — dados da empresa vendedora

Mais bloco `[PROPOSAL_METADATA]` para rastreamento pelo orquestrador (cliente, valores, status).

## Changelog

### v1.1.0 (2026-05-07)
- Input simplificado: `resumo_executivo`, `escopo_macro` e `premissas_assumidas` consolidados em `discovery_summary`
- Agora consome blocos estruturados diretamente em vez de seções avulsas do documento de discovery

### v1.0.0 (2026-05-07)
- Implementação inicial
- Filtro explícito de informações internas: riscos, lacunas e complexidade técnica não aparecem na proposta
- Regras de escrita que proíbem jargão corporativo e técnico
- Campos de preenchimento humano marcados com `[a preencher]`
- Geração de `[PROPOSAL_METADATA]` para rastreamento pelo orquestrador