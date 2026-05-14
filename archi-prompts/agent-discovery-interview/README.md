# Agent Discovery Interview

Agente conversacional que conduz a entrevista de discovery com o cliente em tempo real. Substitui formulários e questionários estáticos por uma conversa adaptativa — o agente faz as perguntas certas, no momento certo, na linguagem do cliente. Aceita documentos opcionais enviados durante a conversa e gera um bloco de notas estruturadas aprovadas pelo cliente ao final.

## Uso

Este agente é o ponto de entrada do pipeline de pré-venda. É utilizado diretamente pelo cliente, sem intermediação do time técnico. O agente conduz a entrevista de forma autônoma, apresenta um resumo do que foi entendido, incorpora ajustes solicitados pelo cliente e emite o bloco `[DISCOVERY_APROVADO]` que alimenta todos os agentes subsequentes da Fase 2.

O cliente pode responder inteiramente pela conversa ou enviar documentos (PDF, DOCX, planilhas) durante a sessão — ambos os caminhos geram o mesmo resultado.

## Variáveis de Entrada

- `contexto_inicial` (opcional): Qualquer informação pré-conhecida sobre o cliente ou projeto antes do início da conversa. Pode conter nome da empresa, setor, contato, ou contexto comercial já coletado. Use `"Nenhum"` para sessões frias sem contexto prévio.

## Onde é Utilizado

- Interface de chat do sistema autônomo de pré-venda (acesso público para clientes)
- Fase 1 do pipeline de discovery e orçamento
- Substitui o formulário de intake + questionário por email

## Formato de Saída

O agente produz dois outputs na mesma sessão:

**Para o cliente** — Resumo em linguagem natural com:
- O que foi entendido sobre o contexto e o problema
- Lista de funcionalidades desejadas
- Pontos que ainda precisam de definição
- Confirmação de aprovação antes de avançar

**Para o pipeline interno** — Bloco estruturado `[DISCOVERY_APROVADO]` contendo:
- `empresa` — nome e descrição da organização
- `setor` — segmento de atuação
- `problema_central` — problema que o sistema resolve
- `processos_atuais` — como funciona hoje, sem o sistema
- `funcionalidades_solicitadas` — o que o cliente quer que o sistema faça
- `perfis_de_usuarios` — quem vai usar e com que tipo de acesso
- `permissoes_mencionadas` — regras de acesso e restrições
- `integracoes` — integrações com sistemas externos mencionadas
- `ia_e_automacao` — requisitos de IA ou automação (com exemplos concretos)
- `relatorios_e_dados` — relatórios e informações que o sistema precisa gerar
- `dados_sensiveis` — tipos de dados sensíveis identificados
- `volume_operacional` — usuários, registros, acessos simultâneos
- `restricoes_comerciais` — prazo e faixa de orçamento aproximados
- `documentos_recebidos` — lista de arquivos enviados durante a conversa
- `lacunas_e_indefinicoes` — pontos não cobertos ou ambíguos
- `notas_do_entrevistador` — observações relevantes do agente

## Changelog

### v1.0.0 (2026-05-07)
- Implementação inicial do agente conversacional de entrevista
- Protocolo de entrevista adaptativo com cobertura de contexto, funcionalidades e complexidades
- Manejo de documentos enviados pelo cliente durante a sessão
- Ciclo de apresentação de resumo com suporte a ajustes iterativos
- Geração do bloco estruturado `[DISCOVERY_APROVADO]` para o pipeline
- Auto-verificação antes da apresentação do resumo ao cliente
- Instrução explícita: campos não mencionados pelo cliente devem receber `não mencionado`