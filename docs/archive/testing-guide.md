> ⚠️ **Documento histórico — arquivado.**
> Escrito para um LangFuse self-hosted em `localhost:3001` que não existe mais — hoje o LangFuse é cloud. Mantido como referência dos fluxos de teste.
> Os caminhos de arquivo citados aqui referem-se ao layout anterior à reorganização
> (`docs/` plano, `scripts/db_setup.sql`). Estrutura atual: veja o [README](../../README.md).

# TESTING_GUIDE.md — Archi
## Como testar cada tarefa

**Versão:** 1.0.0
**Última atualização:** 2026

> Este documento explica exatamente como testar cada tarefa do TASKS.md.
> Siga a ordem — cada fase depende da anterior estar funcionando.

---

## Ferramentas de teste usadas

| Ferramenta | URL | Para que serve |
|---|---|---|
| Swagger UI | http://localhost:8000/docs | Testar endpoints do backend |
| Supabase Dashboard | https://supabase.com/dashboard | Verificar dados no banco |
| LangFuse | http://localhost:3001 | Verificar traces das chamadas LLM |
| Browser | http://localhost:3000 | Testar o frontend |
| Terminal | — | Logs e comandos |

---

## Como usar o Swagger (http://localhost:8000/docs)

O Swagger é a interface visual da API. Para testar um endpoint:

1. Acesse http://localhost:8000/docs
2. Clique no endpoint que quer testar (ex: `POST /session/validate-code`)
3. Clique em **"Try it out"** (botão no canto direito)
4. Preencha o body JSON no campo que aparece
5. Clique em **"Execute"**
6. Veja a resposta na seção **"Response body"** abaixo

---

## Como obter o JWT do admin (necessário para endpoints /admin/*)

Os endpoints admin exigem autenticação. Para obter o token:

1. Acesse o Supabase Dashboard → **Authentication → Users**
2. Confirme que seu usuário admin existe
3. No terminal, rode:

```bash
curl -X POST 'https://SEU_PROJETO.supabase.co/auth/v1/token?grant_type=password' \
  -H "apikey: SUA_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"seu@email.com","password":"suasenha"}'
```

4. Copie o valor de `access_token` da resposta
5. No Swagger, clique em **"Authorize"** (cadeado no topo)
6. No campo `HTTPBearer`, cole: `Bearer SEU_TOKEN`
7. Clique em **"Authorize"** → agora todos os endpoints admin estão autenticados

> O token expira em 1 hora. Se der 401 inesperado, gere um novo.

---

## Fase 1 — Setup

---

### TASK-001 — Backend inicializado

```bash
# Terminal
uv run uvicorn app.main:app --reload
```

**Teste:** abra http://localhost:8000/docs no browser.
Deve aparecer a documentação Swagger com as rotas listadas.

Confirme também:
```bash
curl http://localhost:8000/health
# Esperado: {"status": "ok"}
```

---

### TASK-002 — Frontend inicializado

```bash
# Terminal
npm run dev
```

**Teste:** abra http://localhost:3000 no browser.
Deve aparecer uma tela (mesmo que seja a padrão do Next.js por enquanto).
Console do browser não deve mostrar erros críticos.

---

### TASK-003 — Variáveis de ambiente

**Teste:** verifique que os arquivos existem e têm valores preenchidos:

```bash
cat archi-api/.env        # todas as variáveis devem ter valor, não estar vazias
cat archi-web/.env.local  # idem
```

Nenhuma linha deve estar assim: `SUPABASE_URL=` (sem valor).

---

### TASK-004 — Docker Compose

```bash
make dev-build
```

**Teste:** aguarde todos os serviços subirem e verifique:

| Serviço | Como verificar |
|---|---|
| Backend | http://localhost:8000/health retorna `{"status": "ok"}` |
| Frontend | http://localhost:3000 carrega sem erro |
| LangFuse | http://localhost:3001 carrega a tela de login |

No Docker Desktop ou OrbStack, todos os containers devem estar verdes (running).

---

### TASK-005 — Tabelas no Supabase

**Teste:** acesse o Supabase Dashboard → **Table Editor** (menu lateral esquerdo).

Devem aparecer as tabelas:
- `access_codes`
- `sessions`
- `messages`
- `proposals`
- `notifications`

Clique em cada uma e confirme que as colunas estão corretas comparando com `TECH_SPEC.md §5`.

---

## Fase 2 — Backend: Fundação

---

### TASK-006 — Supabase client

**Teste via Swagger:**

1. Acesse http://localhost:8000/docs
2. Procure o endpoint `GET /health` ou qualquer endpoint que faça uma query simples ao banco
3. Execute e confirme que retorna sem erro de conexão

**Ou via terminal:**
```bash
# Dentro do diretório archi-api
uv run python -c "
from app.services.supabase_client import get_supabase
import asyncio

async def test():
    sb = get_supabase()
    result = await sb.table('sessions').select('id').limit(1).execute()
    print('Conexão OK:', result)

asyncio.run(test())
"
```

---

### TASK-007 — Prompt loader

**Teste:** reinicie o backend e observe os logs no terminal:

```bash
docker compose restart api
docker compose logs api --follow
```

Deve aparecer uma linha como:
```
✅ Prompts carregados do LangFuse (4 prompts)
```

Confirme que o arquivo foi criado:
```bash
ls archi-api/prompts_cache.json   # deve existir
cat archi-api/prompts_cache.json  # deve conter os 4 prompts
```

**Teste de fallback (opcional):**
1. Pare o LangFuse: `docker compose stop langfuse-web`
2. Reinicie o backend: `docker compose restart api`
3. Logs devem mostrar: `⚠️ LangFuse indisponível` + `✅ Prompts carregados do cache local`
4. Suba o LangFuse novamente: `docker compose start langfuse-web`

---

### TASK-008 — main.py com CORS e LangFuse

**Teste de CORS:**

Abra o console do browser (F12) em http://localhost:3000 e rode:
```javascript
fetch('http://localhost:8000/health')
  .then(r => r.json())
  .then(console.log)
```
Deve retornar `{status: "ok"}` sem erro de CORS.

**Teste de LangFuse:**

1. Faça qualquer chamada que use LiteLLM (pode ser via um endpoint de teste temporário)
2. Acesse http://localhost:3001
3. Vá em **Traces** → deve aparecer um registro da chamada com: modelo, tokens, latência

---

## Fase 3 — Backend: Fluxo do cliente

---

### TASK-009 — Endpoints do cliente

**Passo 1 — Criar um código de acesso para testar:**

No Swagger, execute:
```
POST /admin/access-codes
Body: {"expires_at": null}
```
Anote o `code` retornado (ex: `ORC-2026-001`).

**Passo 2 — Validar o código:**
```
POST /session/validate-code
Body: {"code": "ORC-2026-001"}
```
Esperado: `{"session_id": "uuid-aqui", "valid": true}`
Anote o `session_id`.

**Passo 3 — Enviar uma mensagem:**
```
POST /session/{session_id}/message
Body: {"content": "Olá, quero desenvolver um app de delivery"}
```
Esperado: resposta em streaming — o texto aparece progressivamente no campo de resposta do Swagger.

**Passo 4 — Verificar no Supabase:**
- Supabase Dashboard → Table Editor → `sessions`
- Encontre a linha com o seu `session_id`
- Confirme que `message_count` foi incrementado

- Table Editor → `messages`
- Confirme que existem linhas com `session_id` correto, uma com `role: user` e outra com `role: assistant`

---

### TASK-010 — Orchestrator do pipeline

**Pré-requisito:** ter uma sessão no status `interview_in_progress` (criada na TASK-009).

**Passo 1 — Aprovar o discovery:**
```
POST /session/{session_id}/approve
Body: {}
```
Esperado: `{"approved": true}`

**Passo 2 — Acompanhar o pipeline no Supabase:**

Abra o Supabase Dashboard → Table Editor → `sessions` e recarregue a cada 30 segundos.
O campo `status` deve evoluir nessa ordem:
```
pipeline_pending → pipeline_running → discovery_generated →
pricing_generated → phases_generated → proposal_generated → pending_review
```

**Passo 3 — Verificar os blocos gerados:**

Na linha da sessão, confirme que estes campos estão preenchidos (não nulos):
- `discovery_approved`
- `discovery_summary`
- `pricing_summary`
- `phases_plan`
- `proposal_metadata`

**Passo 4 — Verificar a proposta criada:**

Table Editor → `proposals` → deve existir uma linha com `session_id` correspondente e `status: pending_review`.

**Passo 5 — Verificar no LangFuse:**

http://localhost:3001 → Traces → deve aparecer 4 traces (um por subagente), cada um com modelo, tokens e latência.

---

### TASK-011 — Endpoints do pipeline

**Teste de start:**
```
POST /pipeline/start
Header: X-Pipeline-Secret: SEU_PIPELINE_SECRET
Body: {"session_id": "uuid-de-uma-sessao-em-pipeline_pending"}
```
Esperado: `{"started": true}` imediatamente (não espera o pipeline terminar).

**Teste de retry:**

1. Force um erro: coloque um model inválido temporariamente no `.env`
2. Execute `/pipeline/start` → pipeline vai falhar
3. Restaure o model correto
4. Execute:
```
POST /pipeline/retry/{session_id}
Header: X-Pipeline-Secret: SEU_PIPELINE_SECRET
```
Esperado: pipeline roda novamente e completa com sucesso.

---

## Fase 4 — Backend: Painel Admin

---

### TASK-012 — Autenticação JWT

**Teste sem token:**
```
GET /admin/proposals
(sem header de Authorization)
```
Esperado: `401 Unauthorized`

**Teste com token:**
1. Obtenha o JWT conforme instrução no topo deste documento
2. No Swagger, clique em **"Authorize"** e cole o token
3. Execute novamente:
```
GET /admin/proposals
```
Esperado: `200 OK` com lista (pode estar vazia)

---

### TASK-013 — Endpoints admin

Com o JWT configurado no Swagger, teste os principais:

**Listar propostas:**
```
GET /admin/proposals
```
Esperado: lista com as proposals criadas nos testes anteriores.

**Editar proposta:**
```
PATCH /admin/proposals/{id}
Body: {"total_price": 25000.00, "total_days": 60, "admin_notes": "Teste de edição"}
```
Verifique no Supabase que os valores foram atualizados.

**Gerar código de acesso:**
```
POST /admin/access-codes
Body: {"expires_at": null}
```
Esperado: código no formato `ORC-2026-XXX`.

---

### TASK-014 — Geração de documentos

**Pré-requisito:** ter uma proposal com status `pending_review`.

```
POST /admin/proposals/{id}/generate-docs
Body: {}
```

Aguarde a resposta (pode levar alguns segundos).
Esperado:
```json
{
  "docx_url": "https://...supabase.co/.../proposal.docx",
  "pdf_url": "https://...supabase.co/.../proposal.pdf"
}
```

**Verificar:** clique nas URLs retornadas — os arquivos devem abrir/baixar corretamente com o conteúdo da proposta.

**No Supabase:** Storage → `proposals` → deve existir a pasta `{session_id}/` com os dois arquivos.

---

### TASK-015 — Email

**Pré-requisito:** proposal com DOCX/PDF gerados e um `client_email` válido na sessão.

```
POST /admin/proposals/{id}/send
Body: {}
```

Esperado: `{"sent": true}` e email chega na caixa de entrada do endereço do cliente.

Verifique no Supabase: `proposals` → campo `status` deve ser `sent` e `sent_at` preenchido.

---

## Fase 5 — Frontend: Área do Cliente

---

### TASK-015b — Design system

Abra qualquer página do frontend no browser e inspecione (F12 → Elements).
No console rode:
```javascript
getComputedStyle(document.body).getPropertyValue('--color-primary')
```
Esperado: retorna um valor de cor (não string vazia).

---

### TASK-016 — Tela de acesso

1. Acesse http://localhost:3000
2. Crie um código via Swagger: `POST /admin/access-codes`
3. Digite o código no campo e clique em "Acessar"
4. Esperado: redireciona para `/interview/{session_id}`

**Teste de erro:**
- Digite um código inválido (ex: `INVALIDO`)
- Esperado: mensagem de erro específica abaixo do campo, sem redirecionar

---

### TASK-017 — Tela de chat

1. Acesse `/interview/{session_id}` (após validar um código)
2. Aguarde a primeira mensagem do agente aparecer automaticamente
3. Digite uma mensagem e pressione Enter ou clique em enviar
4. Esperado: texto do agente aparece progressivamente (streaming visível)
5. Continue a conversa até o agente apresentar o discovery e pedir confirmação
6. Clique em "Confirmar e gerar proposta"
7. Esperado: input desabilita, mensagem de confirmação aparece

**Verificar:** Supabase → `sessions` → status deve evoluir para `pipeline_pending` e depois para `pending_review`.

---

## Fase 6 — Frontend: Painel Admin

---

### TASK-018 — Auth admin

**Teste de proteção:**
1. Acesse http://localhost:3000/admin diretamente (sem estar logado)
2. Esperado: redireciona automaticamente para `/admin/login`

**Teste de login:**
1. Preencha email e senha do usuário admin criado no Supabase
2. Clique em "Entrar"
3. Esperado: redireciona para `/admin` com a sidebar visível

**Teste de logout:**
1. Clique em "Sair" na sidebar
2. Esperado: redireciona para `/admin/login`
3. Tentar acessar `/admin` novamente deve redirecionar para login

---

### TASK-019 — Dashboard

1. Acesse http://localhost:3000/admin
2. Verifique os 4 cards de resumo — devem mostrar números reais
3. Lista de últimas proposals deve mostrar as criadas nos testes
4. Lista de notificações deve mostrar as notificações geradas pelo pipeline

---

### TASK-020 — Lista de propostas

1. Acesse `/admin/proposals`
2. Verifique que a tabela exibe as proposals com colunas corretas
3. Teste os filtros de status: clique em "Aguardando revisão" — lista deve filtrar
4. Clique em "Revisar" em uma proposal — deve navegar para o detalhe

---

### TASK-021 — Detalhe da proposta

1. Acesse `/admin/proposals/{id}`
2. Verifique o indicador de progresso do pipeline (etapas ✓)
3. Edite o preço e clique em "Salvar" — verifique no Supabase que foi salvo
4. Clique em "Gerar DOCX" — aguarde spinner e verifique link de download
5. Clique em "Gerar PDF" — mesmo comportamento
6. Clique em "Enviar proposta" → confirme no modal
7. Verifique que status muda para `sent` e botão fica desabilitado

---

### TASK-022 — Códigos de acesso

1. Acesse `/admin/access-codes`
2. Clique em "Gerar novo código"
3. Preencha data de expiração (opcional) e confirme
4. Esperado: código aparece em destaque com botão "Copiar"
5. Verifique na tabela que o novo código aparece com status "Disponível"
6. Use o código para criar uma sessão → volte aqui e verifique que status mudou para "Utilizado"

---

### TASK-023 — Notificações

1. Acesse `/admin/notifications`
2. Notificações geradas pelos testes anteriores devem aparecer
3. Clique em uma notificação não lida → deve marcar como lida e navegar para a proposal
4. Clique em "Marcar todas como lidas"
5. Verifique que o badge na sidebar some (zerou as não lidas)

---

## Fase 7 — Testes finais

---

### TASK-024 — End-to-end completo

Execute do zero, sem usar dados dos testes anteriores:

```
1.  /admin/access-codes → gerar código novo
2.  localhost:3000 → digitar o código → acessar
3.  /interview/{id} → conversar com o agente (mínimo 5 mensagens)
4.  Aprovar o discovery no chat
5.  Supabase → sessions → acompanhar status evoluindo
6.  /admin/notifications → aguardar notificação de pipeline concluído
7.  /admin/proposals → abrir a proposal gerada
8.  Editar total_price e salvar
9.  Gerar DOCX → baixar e abrir o arquivo
10. Gerar PDF → baixar e abrir o arquivo
11. Enviar proposta → verificar email na caixa de entrada
```

Todos os 11 passos sem erro = TASK-024 concluída.

---

### TASK-025 — Rate limiting

1. No `archi-api/.env`, altere temporariamente: `MAX_MESSAGES_PER_SESSION=3`
2. Reinicie o backend: `docker compose restart api`
3. Crie uma nova sessão com um código novo
4. Envie 3 mensagens normalmente
5. Na 4ª mensagem: esperado mensagem de limite no chat, **sem chamar a API LLM**
6. Verifique no Supabase: `sessions.message_count = 3`
7. Verifique no LangFuse: apenas 3 traces, não 4
8. Restaure: `MAX_MESSAGES_PER_SESSION=40` e reinicie o backend

---

### TASK-026 — Retry do pipeline

1. No `.env`, altere temporariamente: `LITELLM_MODEL=modelo-invalido-teste`
2. Reinicie o backend e crie uma sessão nova
3. Aprove o discovery → pipeline vai falhar
4. Supabase → `sessions` → status deve ser `pipeline_error`
5. Confirme que `error_step` e `error_message` estão preenchidos
6. `/admin/notifications` → deve aparecer notificação de erro
7. Restaure: `LITELLM_MODEL=openrouter/deepseek/deepseek-v3` e reinicie
8. `/admin` → abra a proposal com erro → clique "Reprocessar pipeline"
9. Acompanhe o status evoluindo até `pending_review`