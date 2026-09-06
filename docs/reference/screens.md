# SCREENS.md — Archi
## Fluxo de Telas e Comportamento

**Versão:** 1.0.0
**Última atualização:** 2026

> Este documento descreve o comportamento de cada tela do sistema.
> Não define design visual — apenas conteúdo, interações e regras de negócio.
> Usar como base para prototipação no Claude Design e implementação no Claude Code.

---

## Visão geral da navegação

```
Área do cliente (pública)
├── /                          → Tela de acesso (digitar código)
└── /interview/[sessionId]     → Chat com o agente

Área do admin (protegida)
├── /admin/login               → Login
├── /admin                     → Dashboard
├── /admin/proposals           → Lista de propostas
├── /admin/proposals/[id]      → Detalhe da proposta
├── /admin/access-codes        → Gerenciar códigos de acesso
└── /admin/notifications       → Notificações
```

---

## ÁREA DO CLIENTE

---

### Screen 1 — Acesso (`/`)

**Objetivo:** validar o código de acesso antes de iniciar a entrevista.

#### Conteúdo da tela
- Logo ou nome do sistema (Archi)
- Título: "Bem-vindo. Digite seu código de acesso para começar."
- Campo de texto: `access_code` (placeholder: "Ex: ORC-2024-001")
- Botão: "Acessar"
- Mensagem de erro (condicional): aparece abaixo do campo se o código for inválido

#### Comportamento

| Ação | Resultado |
|---|---|
| Usuário digita código e clica "Acessar" | Frontend chama `POST /session/validate-code` |
| Código válido, sem sessão | API cria sessão e retorna `session_id` → redireciona para `/interview/{session_id}` |
| Código válido, sessão ativa (re-entrada) | API retorna `session_id` existente → redireciona para `/interview/{session_id}` com histórico carregado |
| Código inválido | Exibe mensagem: "Código inválido. Verifique e tente novamente." |
| Código já utilizado (proposta aprovada) | Exibe mensagem: "Este código já foi utilizado. A proposta está em andamento." |
| Código expirado | Exibe mensagem: "Este código expirou. Solicite um novo ao responsável." |

#### Regras
- Campo aceita letras maiúsculas, minúsculas e hífens — normalizar para maiúsculas antes de enviar
- Botão fica desabilitado enquanto a requisição está em andamento
- Sem links para outras páginas — tela isolada e focada

---

### Screen 2 — Entrevista (`/interview/[sessionId]`)

**Objetivo:** o cliente conversa com o agente de discovery em tempo real.

#### Layout
- Área principal: janela de chat (ocupa a tela toda)
- Topo: nome do sistema + indicador de status da conexão (conectado/digitando...)
- Centro: histórico de mensagens
- Rodapé: campo de input + botão de envio

#### Conteúdo e comportamento das mensagens
- Mensagens do agente: alinhadas à esquerda, fundo diferenciado
- Mensagens do cliente: alinhadas à direita
- O agente inicia a conversa automaticamente ao carregar a tela (primeira mensagem de boas-vindas)
- Respostas do agente chegam em streaming — texto aparece progressivamente (não espera a resposta completa)
- Indicador "digitando..." aparece enquanto o agente está gerando a resposta

#### Aprovação do discovery
Quando o agente encerrar o levantamento, ele apresenta um resumo do discovery e solicita aprovação. Neste momento:

- Aparece um **botão de aprovação** abaixo da última mensagem do agente: "Confirmar e gerar proposta"
- O cliente pode responder em texto (o agente aceita confirmação por texto também)
- Ao clicar no botão ou confirmar por texto:
  - Frontend chama `POST /session/{session_id}/approve`
  - Botão some e é substituído por uma mensagem de confirmação

#### Mensagem pós-aprovação
Após aprovação, o agente exibe a mensagem final (gerada pelo próprio agente):

> "Perfeito! Seu levantamento foi registrado. A proposta será preparada e enviada para o seu email em breve."

A partir deste momento:
- Campo de input é desabilitado
- Não é possível enviar novas mensagens
- Tela permanece visível (cliente pode reler a conversa)

#### Regras
- Sessão é identificada pelo `sessionId` na URL — se o ID não existir, redireciona para `/`
- Se a sessão já estiver com status `aprovada` ou além, exibe apenas o histórico (sem input)
- Não há botão de voltar, menu ou navegação — tela totalmente focada na conversa
- O histórico de mensagens é carregado do banco ao abrir a tela (sessões anteriores são recuperáveis)

---

## ÁREA DO ADMIN

> Todas as telas do admin exigem autenticação via Supabase Auth.
> Se o usuário não estiver autenticado, redireciona automaticamente para `/admin/login`.

---

### Screen 3 — Login do Admin (`/admin/login`)

#### Conteúdo
- Logo ou nome do sistema
- Campo: email
- Campo: senha
- Botão: "Entrar"
- Mensagem de erro (condicional): "Email ou senha incorretos."

#### Comportamento
- Autenticação via Supabase Auth (`signInWithPassword`)
- Após login bem-sucedido: redireciona para `/admin`
- Sem opção de cadastro — usuário admin é criado diretamente no Supabase Dashboard

---

### Screen 4 — Dashboard (`/admin`)

**Objetivo:** visão geral rápida do estado do sistema.

#### Layout
- Sidebar esquerda: navegação persistente (ver abaixo)
- Área principal: cards de resumo + atividade recente

#### Sidebar (presente em todas as telas admin)
- Logo / nome do sistema
- Links de navegação:
  - Dashboard
  - Propostas (com badge de contagem: quantas estão `pendente_revisao`)
  - Códigos de Acesso
  - Notificações (com badge de contagem de não lidas)
- Botão de logout no rodapé

#### Cards de resumo
| Card | Valor exibido |
|---|---|
| Aguardando revisão | Contagem de proposals com status `pending_review` |
| Enviadas hoje | Contagem de proposals enviadas nas últimas 24h |
| Total de sessões | Contagem total de sessões criadas |
| Erros no pipeline | Contagem de sessions com status `pipeline_error` |

#### Atividade recente
- Lista das últimas 5 proposals criadas
- Cada item: nome do cliente, data, status (com cor), link para detalhe
- Link "Ver todas" → `/admin/proposals`

#### Notificações recentes
- Lista das últimas 3 notificações não lidas
- Cada item: ícone (sucesso/erro), mensagem, tempo relativo (ex: "há 10 minutos")
- Link "Ver todas" → `/admin/notifications`

---

### Screen 5 — Lista de Propostas (`/admin/proposals`)

#### Conteúdo
- Título: "Propostas"
- Filtro de status (tabs ou dropdown): Todas / Aguardando revisão / Aprovadas / Enviadas / Erro
- Tabela de propostas

#### Colunas da tabela
| Coluna | Conteúdo |
|---|---|
| Cliente | Nome do cliente |
| Email | Email do cliente |
| Data | Data de criação da sessão |
| Preço total | `total_price` formatado em R$ (ou "—" se não gerado) |
| Status | Badge colorido com o status atual |
| Ação | Botão "Revisar" → abre `/admin/proposals/{id}` |

#### Status e cores dos badges
| Status | Cor |
|---|---|
| `pending_review` | Amarelo — "Aguardando revisão" |
| `approved` | Azul — "Aprovada" |
| `sent` | Verde — "Enviada" |
| `rejected` | Vermelho — "Rejeitada" |

#### Comportamento
- Tabela ordenada por data de criação (mais recente primeiro)
- Filtro de status atualiza a lista sem recarregar a página
- Paginação: 20 itens por página

---

### Screen 6 — Detalhe da Proposta (`/admin/proposals/[id]`)

**Objetivo:** revisar, editar, gerar documentos e aprovar o envio da proposta.

Esta é a tela mais importante do painel admin. Dividida em seções.

#### Seção 1 — Cabeçalho
- Nome do cliente (read-only)
- Email do cliente (read-only)
- Data de criação (read-only)
- Status atual (badge)
- Botão "Voltar para lista"

#### Seção 2 — Status do pipeline
Indicador visual de progresso com as etapas do pipeline:

```
[✓] Discovery gerado
[✓] Pricing gerado
[✓] Phases gerado
[✓] Proposta gerada
[•] Aguardando revisão   ← etapa atual (exemplo)
```

Se houver erro:
```
[✓] Discovery gerado
[✗] Pricing gerado       ← etapa que falhou (em vermelho)
[ ] Phases gerado
[ ] Proposta gerada
```
- Exibe a mensagem de erro abaixo da etapa que falhou
- Botão "Reprocessar pipeline" → chama `POST /admin/pipeline/{session_id}/retry`

#### Seção 3 — Dados editáveis
Campos que o admin pode editar antes de gerar os documentos:

| Campo | Tipo | Descrição |
|---|---|---|
| Preço total | Número (R$) | Valor total da proposta — editável |
| Prazo total | Número (dias úteis) | Prazo total do projeto — editável |
| Notas internas | Texto livre | Observações do admin — não aparecem no documento |

- Botão "Salvar alterações" → chama `PATCH /admin/proposals/{id}`
- Confirmação visual após salvar ("Alterações salvas")

#### Seção 4 — Documentos
- Botão "Gerar DOCX" → chama `POST /admin/proposals/{id}/generate-docs`
  - Enquanto gera: botão mostra spinner + "Gerando..."
  - Após gerar: aparece link de download do DOCX
- Botão "Gerar PDF" → mesmo comportamento, para o PDF
- Se já gerados: exibe links de download diretamente (sem precisar gerar de novo)

> **Regra:** os documentos são gerados com os dados salvos no momento da geração.
> Se o admin editar preço ou prazo depois de gerar, precisa gerar novamente.

#### Seção 5 — Envio
- Botão "Enviar proposta por email" → chama `POST /admin/proposals/{id}/send`
  - Habilitado apenas se DOCX ou PDF estiver gerado
  - Abre modal de confirmação: "Enviar proposta para [email do cliente]?"
  - Botões no modal: "Cancelar" e "Confirmar envio"
  - Após envio: status atualiza para `sent`, campo `sent_at` preenchido, botão desabilitado

#### Seção 6 — Conteúdo gerado (expansível)
- Accordion colapsado por padrão
- Ao expandir: exibe o conteúdo bruto dos blocos do pipeline em abas:
  - Aba "Discovery Summary"
  - Aba "Pricing Summary"
  - Aba "Phases Plan"
  - Aba "Proposal Metadata"
- Conteúdo read-only — apenas para consulta e auditoria

---

### Screen 7 — Códigos de Acesso (`/admin/access-codes`)

**Objetivo:** gerar e gerenciar os códigos que liberam acesso ao sistema para clientes.

#### Conteúdo
- Título: "Códigos de Acesso"
- Botão "Gerar novo código" → abre modal de criação
- Tabela de códigos existentes

#### Modal — Gerar novo código
- Campo opcional: data de expiração (date picker) — sem preenchimento = sem expiração
- Botão "Gerar"
- Após geração: exibe o código criado em destaque (ex: `ORC-2026-042`) com botão "Copiar"

#### Colunas da tabela
| Coluna | Conteúdo |
|---|---|
| Código | O código gerado (ex: ORC-2026-042) |
| Status | Badge: Disponível / Utilizado / Expirado |
| Criado em | Data de criação |
| Utilizado em | Data de uso (ou "—") |
| Expira em | Data de expiração (ou "Sem expiração") |
| Cliente | Nome do cliente que usou (ou "—") |

#### Comportamento
- Códigos ordenados por data de criação (mais recente primeiro)
- Código utilizado não pode ser reutilizado
- Sem opção de deletar código — apenas visualização (para auditoria)

---

### Screen 8 — Notificações (`/admin/notifications`)

**Objetivo:** listar e gerenciar os alertas gerados pelo sistema.

#### Conteúdo
- Título: "Notificações"
- Botão "Marcar todas como lidas"
- Lista de notificações

#### Cada item da lista
- Ícone: ✓ verde (pipeline concluído) ou ✗ vermelho (erro no pipeline)
- Mensagem: texto da notificação
- Tempo relativo: "há 5 minutos", "há 2 horas", "ontem"
- Status: bolinha azul se não lida
- Link "Ver proposta" → abre `/admin/proposals/{id}` correspondente

#### Comportamento
- Clicar em qualquer parte do item marca como lida e navega para a proposta
- "Marcar todas como lidas" chama endpoint em batch
- Notificações ordenadas por data (mais recente primeiro)
- Sem paginação na V1 — exibe todas (volume baixo esperado)

---

## Resumo de todos os status

### `sessions.status`
| Status | Quando ocorre |
|---|---|
| `awaiting_start` | Código validado, entrevista não iniciada |
| `interview_in_progress` | Cliente está conversando com o agente |
| `awaiting_approval` | Agente apresentou discovery, aguarda aprovação |
| `pipeline_pending` | Cliente aprovou, pipeline não iniciou |
| `pipeline_running` | Pipeline executando em background |
| `discovery_generated` | Etapa 1 concluída |
| `pricing_generated` | Etapa 2 concluída |
| `phases_generated` | Etapa 3 concluída |
| `proposal_generated` | Etapa 4 concluída |
| `pending_review` | Pipeline completo, aguarda admin |
| `pipeline_error` | Falha em alguma etapa |
| `approved` | Admin aprovou o envio |
| `sent` | Proposta enviada ao cliente |

### `proposals.status`
| Status | Quando ocorre |
|---|---|
| `pending_review` | Proposta gerada, aguarda revisão |
| `approved` | Admin aprovou (documentos gerados) |
| `sent` | Email enviado ao cliente |
| `rejected` | Admin rejeitou |