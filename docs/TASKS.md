# TASKS.md — Archi
## Histórico de Implementação

**Versão:** 1.0.0  
**Última atualização:** 2026

> ⚠️ **Este projeto já foi implementado.** Este documento é referência histórica das tarefas executadas.
> Para trabalho atual (manutenção, bugs, features), consulte `TECH SPEC — Archi.md` e `SCREENS.md`.

---

## Fase 1 — Setup do Projeto

---

### TASK-001 — Inicializar `archi-api`

**Refs:** TECH_SPEC.md §4 (estrutura de pastas), ADR-001

Criar a estrutura de pastas do backend com os arquivos vazios nos lugares certos.

```
archi-api/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── session.py
│   │   ├── admin.py
│   │   └── pipeline.py
│   ├── pipeline/
│   │   ├── __init__.py
│   │   └── orchestrator.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── prompt_loader.py
│   │   ├── supabase_client.py
│   │   ├── document_service.py
│   │   └── email_service.py
│   └── models/
│       ├── __init__.py
│       └── schemas.py
├── templates/
│   └── .gitkeep
├── scripts/
│   ├── setup.sh               ← copiar de scripts/setup.sh (já criado)
│   ├── db_setup.sql           ← copiar de scripts/db_setup.sql (já criado)
│   ├── sync_prompts.sh        ← copiar de scripts/sync_prompts.sh (já criado)
│   └── reset_session.sh       ← copiar de scripts/reset_session.sh (já criado)
├── .env.example
├── .python-version            ← contém apenas "3.12" — pin da versão para o uv
├── .gitignore                ← incluir: .env, prompts_cache.json, __pycache__, .venv
├── pyproject.toml             ← gerenciado pelo uv (substitui requirements.txt)
└── Dockerfile
```

Inicializar o projeto com uv:
```bash
cd archi-api
uv init --python 3.12
uv add fastapi uvicorn[standard] pydantic-settings litellm langfuse supabase python-docx weasyprint resend
```

Criar `.python-version` na raiz de `archi-api/`:
```
3.12
```

**`config.py` — mapeamento genérico de LLM_API_KEY por provider:**
```python
# Detecta o provider pelo prefixo do model e injeta a chave no lugar certo
model = settings.litellm_model
key = settings.llm_api_key
if model.startswith("groq/"):
    os.environ["GROQ_API_KEY"] = key
elif model.startswith("anthropic/"):
    os.environ["ANTHROPIC_API_KEY"] = key
elif model.startswith("gemini/"):
    os.environ["GEMINI_API_KEY"] = key
elif model.startswith("openrouter/"):
    os.environ["OPENROUTER_API_KEY"] = key
```

Criar `README.md` em `archi-api/` conforme `docs/README-api.md`.

**Critério de aceite:** `uv run uvicorn app.main:app --reload` sobe sem erro com uma rota `/health` retornando `{"status": "ok"}`.

---

### TASK-002 — Inicializar `archi-web`

**Refs:** TECH_SPEC.md §4, ADR-008

```bash
npx create-next-app@latest archi-web \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --no-eslint
```

Após criação, ajustar estrutura:

```
src/
├── app/
│   ├── page.tsx                        ← tela de acesso (Screen 1)
│   ├── interview/
│   │   └── [sessionId]/
│   │       └── page.tsx                ← chat (Screen 2)
│   └── admin/
│       ├── layout.tsx                  ← layout protegido
│       ├── page.tsx                    ← dashboard (Screen 4)
│       ├── login/
│       │   └── page.tsx               ← login (Screen 3)
│       ├── proposals/
│       │   ├── page.tsx               ← lista (Screen 5)
│       │   └── [id]/
│       │       └── page.tsx           ← detalhe (Screen 6)
│       ├── access-codes/
│       │   └── page.tsx               ← códigos (Screen 7)
│       └── notifications/
│           └── page.tsx               ← notificações (Screen 8)
├── components/
│   ├── chat/
│   │   ├── ChatWindow.tsx
│   │   ├── MessageList.tsx
│   │   └── MessageInput.tsx
│   └── admin/
│       ├── Sidebar.tsx
│       ├── ProposalEditor.tsx
│       └── NotificationBadge.tsx
└── lib/
    ├── supabase.ts
    └── api.ts
```

Instalar dependências adicionais:
```bash
npm install @supabase/supabase-js @supabase/ssr
```

Criar `README.md` em `archi-web/` conforme `docs/README-web.md`.

**Critério de aceite:** `npm run dev` sobe sem erro em `localhost:3000`.

---

### TASK-003 — Configurar variáveis de ambiente

**Refs:** TECH_SPEC.md §7

Criar `.env.example` em `archi-api/`:
```env
# LLM — troque model string e chave para mudar de provider
# Exemplos: groq/llama-3.3-70b-versatile | openrouter/deepseek/deepseek-v3 | anthropic/claude-sonnet-4-5
LITELLM_MODEL=groq/llama-3.3-70b-versatile
LLM_API_KEY=

# LangFuse
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_HOST=http://localhost:3001

# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Resend
RESEND_API_KEY=
EMAIL_FROM=
EMAIL_ADMIN=

# Rate limiting
MAX_MESSAGES_PER_SESSION=40
MAX_INPUT_TOKENS_PER_SESSION=20000

# Security
PIPELINE_SECRET=
CORS_ORIGINS=http://localhost:3000
```

Criar `.env.example` em `archi-web/`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Implementar `app/config.py` usando Pydantic Settings — todas as variáveis tipadas, lidas automaticamente do `.env`.

**Critério de aceite:** `from app.config import settings` importa sem erro; `settings.supabase_url` retorna o valor do `.env`.

---

### TASK-004 — Configurar Docker Compose e scripts

**Refs:** TECH_SPEC.md §8

**Estrutura de arquivos a criar na raiz (`~/projects/`):**
```
~/projects/
├── docker-compose.yml         ← orquestra api + web + langfuse
├── dev.sh                     ← copiar de scripts/dev.sh (já criado)
├── archi-api/
│   └── scripts/
│       ├── setup.sh
│       ├── db_setup.sql
│       ├── sync_prompts.sh
│       └── reset_session.sh
└── archi-web/
```

Criar `docker-compose.yml` na raiz com os serviços: `api`, `web`, `langfuse-web`, `langfuse-worker`, `langfuse-db`. Ver estrutura em TECH_SPEC.md §8.

Criar `Dockerfile` em `archi-api/` usando uv:
```dockerfile
FROM python:3.12-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev
COPY . .
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Criar `Dockerfile` em `archi-web/` baseado na imagem oficial Next.js.

Copiar os scripts já criados para os destinos corretos:
- `dev.sh` → raiz do projeto (`~/projects/dev.sh`)
- `Makefile` → raiz do projeto (`~/projects/Makefile`)
- `setup.sh` → `archi-api/scripts/setup.sh`
- `db_setup.sql` → `archi-api/scripts/db_setup.sql`
- `sync_prompts.sh` → `archi-api/scripts/sync_prompts.sh`
- `reset_session.sh` → `archi-api/scripts/reset_session.sh`

Dar permissão de execução nos scripts:
```bash
chmod +x dev.sh archi-api/scripts/*.sh
```

**Critério de aceite:** `make dev-build` na raiz sobe todos os serviços sem erro. LangFuse acessível em `localhost:3001`.

---

### TASK-005 — Criar tabelas no Supabase

**Refs:** TECH_SPEC.md §5, ADR-005, ADR-009

Usando o MCP do Supabase no Claude Code, criar as seguintes tabelas na ordem abaixo (respeitar dependências de FK):

1. `access_codes`
2. `sessions` (com campos `message_count`, `input_tokens` e `client_document`)
3. `messages` (histórico da conversa — Opção B)
4. `proposals`
5. `notifications`

Criar os enums, triggers de `updated_at` e índices conforme especificado em TECH_SPEC.md §5.

**Critério de aceite:** todas as tabelas criadas e visíveis no Supabase Dashboard. Inserir e deletar um registro de teste em cada tabela sem erro.

---

## Fase 2 — Backend: Fundação

---

### TASK-006 — Implementar `supabase_client.py`

**Refs:** ADR-005, ADR-007

Singleton do cliente Supabase async. Deve ser importado por qualquer módulo que precise acessar o banco ou storage.

```python
# Exemplo de uso esperado
from app.services.supabase_client import get_supabase

supabase = get_supabase()
result = await supabase.table("sessions").select("*").eq("id", session_id).execute()
```

**Critério de aceite:** importar e usar `get_supabase()` em um script de teste retorna dados do banco sem erro.

---

### TASK-006b — Implementar `models/schemas.py`

**Refs:** TECH_SPEC.md §6.4

Implementar todos os schemas Pydantic conforme TECH_SPEC.md §6.4 — especialmente os Enums.

Regras obrigatórias:
- Todo campo de status usa `Enum` — nunca `str` puro
- Swagger deve exibir dropdown para campos com valores fixos
- Valor inválido deve retornar `422 Unprocessable Entity`, nunca `500`

**Critério de aceite:** acessar http://localhost:8000/docs e verificar que campos de status mostram dropdown com os valores válidos.

---

### TASK-007 — Implementar `prompt_loader.py`

**Refs:** ADR-003, ADR-004

Implementar conforme especificado:
- `load_prompts()` — chamado no startup, tenta LangFuse, fallback para `prompts_cache.json`
- `get_prompt(name: str) -> str` — retorna prompt da memória, nunca faz chamada de rede

Nomes dos prompts a buscar no LangFuse:
- `agent-discovery-generator`
- `agent-pricing`
- `agent-phases`
- `agent-proposal-generator`

**Critério de aceite:** com LangFuse rodando e prompts cadastrados, `load_prompts()` cria `prompts_cache.json`. Com LangFuse parado, `load_prompts()` carrega do arquivo local sem erro.

---

### TASK-008 — Configurar `main.py` com lifespan, CORS e LangFuse

**Refs:** ADR-002, ADR-003, TECH_SPEC.md §12

O `main.py` deve implementar obrigatoriamente os 4 itens abaixo:

**1. Validação de variáveis de ambiente no startup**

Antes de aceitar qualquer requisição, verificar que todas as variáveis obrigatórias estão preenchidas:
```python
required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "LLM_API_KEY",
            "LANGFUSE_PUBLIC_KEY", "LANGFUSE_SECRET_KEY", "PIPELINE_SECRET"]
missing = [v for v in required if not os.getenv(v)]
if missing:
    raise RuntimeError(f"Variáveis de ambiente ausentes: {', '.join(missing)}")
```

**2. CORS — obrigatório para o frontend conseguir chamar a API**

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,  # lido do .env: CORS_ORIGINS=http://localhost:3000
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**3. LangFuse callbacks**
```python
import litellm
litellm.success_callback = ["langfuse"]
litellm.failure_callback = ["langfuse"]
```

**4. Lifespan**
- Valida variáveis de ambiente
- Chama `load_prompts()`
- Registra os routers: `session`, `admin`, `pipeline`
- Rota `/health` retorna `{"status": "ok"}`

**Critério de aceite:** backend sobe, `/health` responde, requisição do frontend em `localhost:3000` para `localhost:8000` não retorna erro de CORS, LangFuse recebe traces ao fazer uma chamada LiteLLM de teste.

---

## Fase 3 — Backend: Fluxo do Cliente

---

### TASK-009 — Implementar `routers/session.py`

**Refs:** TECH_SPEC.md §6.1, §6.4, SCREENS.md §Screen 1 e 2, ADR-009

Implementar os 3 endpoints públicos:

**`POST /session/validate-code`**
- Busca `access_codes` pelo código informado
- Valida: existe, não foi usado, não expirou
- Se válido: cria registro em `sessions`, marca código como usado (`used_at = now()`)
- Retorna `{"session_id": "uuid", "valid": true}`
- Se inválido: retorna erro com mensagem apropriada

**`POST /session/{session_id}/message`**
- Busca histórico de mensagens da sessão na tabela `messages` (todas as mensagens ordenadas por `created_at`)
- Monta o array de conversa: `[{role: "user"/"assistant", content: "..."}]`
- Verifica se sessão existe e está em status permitido
- Verifica limites de rate limiting (`message_count` e `input_tokens`) — ADR-009
- Se limite atingido: retorna `{"limit_reached": true, "message": "..."}`
- Chama LiteLLM com streaming usando o prompt do `agent-discovery-interview` + histórico completo
- Salva a mensagem do usuário e a resposta do agente na tabela `messages`
- Incrementa `message_count` e `input_tokens` na sessão
- Retorna resposta em streaming (SSE): `text/event-stream`

> **CPF/CNPJ:** o prompt do `agent-discovery-interview` deve perguntar o CPF ou CNPJ
> do cliente durante a entrevista. Quando o agente receber essa informação, o backend
> deve salvar em `sessions.client_document`. Detectar pelo conteúdo da resposta ou
> via marcador no prompt do agente.

**`POST /session/{session_id}/approve`**
- Atualiza status da sessão para `pipeline_pending`
- Salva o bloco `discovery_approved` na sessão
- Chama internamente `POST /pipeline/start` com o `session_id`
- Retorna `{"approved": true}`

**Critério de aceite:** testar os 3 endpoints via `/docs` do FastAPI. Streaming retorna chunks de texto progressivamente.

---

### TASK-010 — Implementar `pipeline/orchestrator.py`

**Refs:** ADR-006, README-orchestrator-pre-sales.md, TECH_SPEC.md §6.3

Implementar a função `run_pipeline(session_id, supabase)` conforme especificado no README do orchestrator:

- Etapa 1: `agent-discovery-generator` recebe `discovery_approved`
- Etapa 2: `agent-pricing` recebe `discovery_summary`
- Etapa 3: `agent-phases` recebe `discovery_summary` + `pricing_summary`
- Etapa 4: `agent-proposal-generator` recebe todos os blocos

Cada etapa:
1. Lê o prompt via `get_prompt(name)`
2. Chama LiteLLM via `litellm.acompletion()`
3. Salva o bloco de saída no banco antes de avançar
4. Atualiza o status da sessão
5. Em caso de falha: 1 retry com `await asyncio.sleep(3)`, depois lança `PipelineStepError`

Ao final: cria registro em `proposals`, atualiza status para `pending_review`, insere notificação em `notifications`.

**Critério de aceite:** executar `run_pipeline` com uma sessão de teste completa. Verificar no Supabase que todos os blocos foram salvos e o status evoluiu corretamente.

---

### TASK-011 — Implementar `routers/pipeline.py`

**Refs:** TECH_SPEC.md §6.3

**`POST /pipeline/start`**
- Valida `PIPELINE_SECRET` no header `X-Pipeline-Secret`
- Dispara `run_pipeline` como `BackgroundTask`
- Retorna `{"started": true}`

**`POST /pipeline/retry/{session_id}`**
- Valida `PIPELINE_SECRET` no header
- Verifica que a sessão está com status `pipeline_error`
- Dispara `run_pipeline` como `BackgroundTask`
- Retorna `{"retrying": true}`

**Critério de aceite:** chamar `/pipeline/start` com o header correto dispara o pipeline em background sem bloquear a resposta.

---

## Fase 4 — Backend: Painel Admin

---

### TASK-012 — Implementar autenticação JWT no backend

**Refs:** TECH_SPEC.md §10, ADR-005

Criar dependency do FastAPI que valida o JWT do Supabase Auth em todos os endpoints `/admin/*`.

```python
# Uso esperado nos routers admin
@router.get("/proposals")
async def list_proposals(admin=Depends(verify_admin_jwt)):
    ...
```

**Critério de aceite:** endpoint admin sem token retorna 401. Com token válido do Supabase, retorna 200.

---

### TASK-013 — Implementar `routers/admin.py`

**Refs:** TECH_SPEC.md §6.2, SCREENS.md

**Requisito obrigatório — Enums e validações no schemas.py:**

Implementar `models/schemas.py` exatamente conforme `TECH_SPEC.md §6.4`.
Pontos críticos que o Claude Code deve respeitar:

- `ValidateCodeResponse.session_id` → `Optional[UUID]` (é None quando válido=False)
- `SendMessageRequest.content` → `Field(..., min_length=1, max_length=10000)`
- `UpdateProposalRequest.total_price` → `Field(None, gt=0)` — rejeita valores negativos
- `UpdateProposalRequest.total_days` → `Field(None, gt=0)` — rejeita zero e negativos
- `total_price` em todos os schemas → `Decimal`, nunca `float` (evita erro de arredondamento monetário)
- `AccessCodeStatus` enum → `available / used / expired` (computado pelo backend, não salvo no banco)
- `AccessCodeResponse.status` → campo obrigatório usando `AccessCodeStatus`
- `PipelineStartResponse` e `PipelineRetryResponse` → incluir `session_id: UUID` na resposta
- Todos os campos `Optional` → ter valor default explícito `= None`

Implementar todos os endpoints admin conforme TECH_SPEC.md §6.2 e schemas em §6.4:

- `GET /admin/proposals` — lista com filtro por status e paginação
- `GET /admin/proposals/{id}` — detalhe completo
- `PATCH /admin/proposals/{id}` — edita `total_price`, `total_days`, `admin_notes`
- `POST /admin/proposals/{id}/generate-docs` — chama `document_service`
- `POST /admin/proposals/{id}/send` — chama `email_service`, atualiza status
- `GET /admin/notifications` — lista, filtro por `read`
- `PATCH /admin/notifications/{id}/read` — marca como lida
- `POST /admin/access-codes` — gera novo código (formato: `ORC-{ANO}-{SEQ}`)
- `GET /admin/access-codes` — lista com status
- `POST /admin/pipeline/{session_id}/retry` — redireciona para `/pipeline/retry`

**Critério de aceite:** todos os endpoints respondem corretamente via `/docs`. Testar ao menos: criar código, listar propostas, editar proposta.

---

### TASK-014 — Implementar `document_service.py`

**Refs:** TECH_SPEC.md §11

**DOCX:** usar `python-docx`. Ler `templates/proposal_template.docx`, substituir marcadores pelos dados da proposal. Salvar em Supabase Storage no bucket `proposals` com path `{session_id}/proposal.docx`. Retornar URL pública.

**PDF:** usar `WeasyPrint`. Gerar a partir de um template HTML com os mesmos dados. Salvar em `{session_id}/proposal.pdf`. Retornar URL pública.

Criar o template base `proposal_template.docx` com marcadores como `{{client_name}}`, `{{total_price}}`, `{{total_days}}`, `{{scope_description}}`.

**Critério de aceite:** chamar o endpoint `generate-docs` de uma proposta existente gera os dois arquivos e retorna as URLs. Baixar os arquivos e verificar que estão preenchidos corretamente.

---

### TASK-015 — Implementar `email_service.py`

**Refs:** TECH_SPEC.md §9

Usar o SDK do Resend. Dois tipos de email:

**Email para o cliente:** proposta enviada, com links para download do DOCX e PDF.

**Email para o admin:** notificação de pipeline concluído ou erro.

```python
# Interface esperada
async def send_proposal_to_client(proposal_id: str) -> bool: ...
async def notify_admin(session_id: str, success: bool, error_step: str = None) -> bool: ...
```

**Critério de aceite:** chamar `send_proposal_to_client` envia email real para o endereço do cliente com os links corretos.

---

## Fase 5 — Frontend: Área do Cliente

> **Design de referência:** antes de implementar qualquer tela desta fase, leia os arquivos abaixo na ordem:
>
> | Arquivo | Para que serve |
> |---|---|
> | `docs/archi-design/project/tokens.css` | Variáveis de design: cores, tipografia, espaçamentos — importar globalmente no projeto |
> | `docs/archi-design/project/design-canvas.jsx` | Componentes React prontos — base para implementação |
> | `docs/archi-design/project/Archi.html` | Protótipo completo para referência visual |
> | `docs/archi-design/project/screens/` | Telas individuais separadas |
>
> **Regra:** use o `design-canvas.jsx` como base para o código React. Use o `tokens.css` para todas as
> variáveis de estilo — não invente valores de cor, espaçamento ou tipografia. Use o `SCREENS.md`
> para comportamento (regras, validações, estados, navegação).

---

### TASK-015b — Configurar design system

**Refs:** `docs/archi-design/project/tokens.css`

Antes de implementar qualquer tela, configurar o design system do Claude Design no projeto Next.js:

1. Copiar `docs/archi-design/project/tokens.css` para `archi-web/src/app/tokens.css`
2. Importar em `archi-web/src/app/layout.tsx`:
```typescript
import './tokens.css'
```
3. Copiar a pasta `docs/archi-design/project/uploads/` para `archi-web/public/uploads/` (assets e imagens do design)

A partir daqui todas as telas usam as variáveis CSS do `tokens.css` — nunca valores hardcoded de cor, fonte ou espaçamento.

**Critério de aceite:** variáveis do `tokens.css` acessíveis via CSS em qualquer componente. Ex: `var(--color-primary)` funciona sem erro.

---

### TASK-016 — Implementar Screen 1: Acesso (`/`)

**Refs:** SCREENS.md §Screen 1, `docs/archi-design/project/design-canvas.jsx`, `docs/archi-design/project/tokens.css`, `docs/archi-design/project/screens/`

- Campo de texto para o código de acesso
- Normalizar para maiúsculas antes de enviar
- Botão desabilitado durante a requisição
- Chamar `POST /session/validate-code` via `lib/api.ts`
- Redirecionar para `/interview/{session_id}` se válido
- Exibir mensagem de erro específica conforme retorno da API

**Critério de aceite:** digitar código válido redireciona para o chat. Código inválido exibe mensagem de erro correta.

---

### TASK-017 — Implementar Screen 2: Entrevista (`/interview/[sessionId]`)

**Refs:** SCREENS.md §Screen 2, `docs/archi-design/project/design-canvas.jsx`, `docs/archi-design/project/tokens.css`, `docs/archi-design/project/screens/`

- Carregar histórico de mensagens da sessão ao abrir
- Primeira mensagem do agente carregada automaticamente
- Enviar mensagem via `POST /session/{session_id}/message`
- Renderizar resposta em streaming (consumir SSE chunk a chunk)
- Indicador "digitando..." durante streaming
- Mensagens do agente à esquerda, do cliente à direita
- Botão "Confirmar e gerar proposta" aparece quando agente solicitar aprovação
- Ao confirmar: chamar `POST /session/{session_id}/approve`, desabilitar input, exibir mensagem final

**Critério de aceite:** conversa funciona em tempo real com streaming visível. Aprovação desabilita o input e exibe mensagem de confirmação.

---

## Fase 6 — Frontend: Painel Admin

> **Design de referência:** mesmos arquivos da Fase 5.
> `design-canvas.jsx` para o código base, `tokens.css` para estilos, `SCREENS.md` para comportamento.

---

### TASK-018 — Implementar autenticação e layout admin

**Refs:** SCREENS.md §Screen 3 e 4, TECH_SPEC.md §10, ADR-008, `docs/archi-design/project/design-canvas.jsx`, `docs/archi-design/project/tokens.css`, `docs/archi-design/project/screens/`

- `app/admin/layout.tsx`: verificar sessão Supabase Auth via `@supabase/ssr`. Se não autenticado, redirecionar para `/admin/login`.
- `app/admin/login/page.tsx`: formulário email/senha, chamar `signInWithPassword` do Supabase, redirecionar para `/admin` após sucesso.
- `components/admin/Sidebar.tsx`: navegação persistente com links e badges de contagem (proposals pendentes + notificações não lidas).

**Critério de aceite:** acessar `/admin` sem login redireciona para `/admin/login`. Após login, sidebar é exibida em todas as rotas admin.

---

### TASK-019 — Implementar Screen 4: Dashboard (`/admin`)

**Refs:** SCREENS.md §Screen 4, `docs/archi-design/project/design-canvas.jsx`, `docs/archi-design/project/tokens.css`, `docs/archi-design/project/screens/`

- 4 cards de resumo: aguardando revisão, enviadas hoje, total de sessões, erros no pipeline
- Lista de últimas 5 proposals com link para detalhe
- Lista de últimas 3 notificações não lidas

**Critério de aceite:** dashboard exibe dados reais do banco. Cards atualizam ao recarregar.

---

### TASK-020 — Implementar Screen 5: Lista de Propostas (`/admin/proposals`)

**Refs:** SCREENS.md §Screen 5, `docs/archi-design/project/design-canvas.jsx`, `docs/archi-design/project/tokens.css`, `docs/archi-design/project/screens/`

- Tabela com colunas: cliente, email, data, preço, status (badge colorido), ação
- Filtro por status (tabs)
- Paginação de 20 itens
- Clicar em "Revisar" navega para `/admin/proposals/{id}`

**Critério de aceite:** lista exibe propostas reais. Filtro por status funciona. Paginação navega corretamente.

---

### TASK-021 — Implementar Screen 6: Detalhe da Proposta (`/admin/proposals/[id]`)

**Refs:** SCREENS.md §Screen 6, `docs/archi-design/project/design-canvas.jsx`, `docs/archi-design/project/tokens.css`, `docs/archi-design/project/screens/`

Esta é a tela mais complexa. Implementar em ordem:

1. Cabeçalho com dados do cliente (read-only) e status
2. Indicador de progresso do pipeline (etapas com ✓ / ✗ / vazio)
3. Campos editáveis: `total_price`, `total_days`, `admin_notes` + botão "Salvar"
4. Botões "Gerar DOCX" e "Gerar PDF" com spinner durante geração e link após
5. Botão "Enviar proposta" com modal de confirmação — habilitado apenas se arquivo gerado
6. Accordion com conteúdo dos blocos do pipeline (read-only)

**Critério de aceite:** editar preço e salvar persiste no banco. Gerar DOCX retorna link de download funcional. Enviar proposta atualiza status para `sent`.

---

### TASK-022 — Implementar Screen 7: Códigos de Acesso (`/admin/access-codes`)

**Refs:** SCREENS.md §Screen 7, `docs/archi-design/project/design-canvas.jsx`, `docs/archi-design/project/tokens.css`, `docs/archi-design/project/screens/`

- Tabela com colunas: código, status (badge), criado em, utilizado em, expira em, cliente
- Botão "Gerar novo código" abre modal com campo de expiração opcional
- Após geração: exibir código em destaque com botão "Copiar"

**Critério de aceite:** gerar código cria registro no banco e exibe o código gerado. Tabela reflete status correto (disponível/utilizado/expirado).

---

### TASK-023 — Implementar Screen 8: Notificações (`/admin/notifications`)

**Refs:** SCREENS.md §Screen 8, `docs/archi-design/project/design-canvas.jsx`, `docs/archi-design/project/tokens.css`, `docs/archi-design/project/screens/`

- Lista ordenada por data (mais recente primeiro)
- Ícone de tipo (sucesso/erro), mensagem, tempo relativo, indicador de lida/não lida
- Clicar no item: marca como lida + navega para proposta relacionada
- Botão "Marcar todas como lidas"
- Badge na sidebar atualiza após ações

**Critério de aceite:** notificações aparecem após pipeline concluir. Marcar como lida remove o badge da sidebar.

---

## Fase 7 — Integração e Testes

---

### TASK-024 — Teste end-to-end do fluxo completo

Executar o fluxo completo manualmente e verificar cada etapa:

```
1. Admin gera código de acesso em /admin/access-codes
2. Acessa / e digita o código → redireciona para /interview/{id}
3. Conversa com o agente por ao menos 5 mensagens
4. Clica em "Confirmar e gerar proposta"
5. Verifica que pipeline roda em background (acompanhar status no Supabase)
6. Admin recebe notificação em /admin/notifications
7. Abre proposta em /admin/proposals/{id}
8. Edita preço e salva
9. Gera DOCX e PDF — verifica que arquivos são gerados corretamente
10. Envia proposta — verifica que email chega no endereço do cliente
```

**Critério de aceite:** todos os 10 passos concluídos sem erro.

---

### TASK-025 — Verificar rate limiting

**Refs:** ADR-009

- Configurar `MAX_MESSAGES_PER_SESSION=5` no `.env` temporariamente
- Iniciar uma sessão e enviar 5 mensagens
- Na 6ª mensagem: verificar que retorna a mensagem de limite atingido
- Verificar que `message_count` está correto no banco
- Restaurar `MAX_MESSAGES_PER_SESSION=40`

**Critério de aceite:** limite é respeitado. Mensagem de aviso é exibida no chat. API LLM não é chamada após o limite.

---

### TASK-026 — Verificar retry do pipeline

- Forçar falha em uma etapa do pipeline (temporariamente apontar para model inválido)
- Executar pipeline e verificar que status vai para `pipeline_error`
- Verificar que `error_step` e `error_message` estão gravados no banco
- Verificar que admin recebe notificação de erro
- Corrigir o model e acionar retry pelo admin
- Verificar que pipeline completa com sucesso

**Critério de aceite:** falha é registrada corretamente. Retry funciona a partir do admin.

---

## Checklist final

- [ ] TASK-001 — Backend inicializado
- [ ] TASK-002 — Frontend inicializado
- [ ] TASK-003 — Variáveis de ambiente configuradas
- [ ] TASK-004 — Docker Compose funcionando
- [ ] TASK-005 — Tabelas criadas no Supabase
- [ ] TASK-006 — Supabase client implementado
- [ ] TASK-006b — Schemas Pydantic com Enums
- [ ] TASK-007 — Prompt loader implementado
- [ ] TASK-008 — main.py configurado com LangFuse
- [ ] TASK-009 — Router de sessão (cliente)
- [ ] TASK-010 — Orchestrator do pipeline
- [ ] TASK-011 — Router do pipeline
- [ ] TASK-012 — Autenticação JWT admin
- [ ] TASK-013 — Router admin
- [ ] TASK-014 — Document service (DOCX + PDF)
- [ ] TASK-015 — Email service
- [ ] TASK-015b — Design system (tokens.css + assets)
- [ ] TASK-016 — Screen 1: Acesso
- [ ] TASK-017 — Screen 2: Entrevista (chat + streaming)
- [ ] TASK-018 — Auth admin + layout sidebar
- [ ] TASK-019 — Screen 4: Dashboard
- [ ] TASK-020 — Screen 5: Lista de propostas
- [ ] TASK-021 — Screen 6: Detalhe da proposta
- [ ] TASK-022 — Screen 7: Códigos de acesso
- [ ] TASK-023 — Screen 8: Notificações
- [ ] TASK-024 — Teste end-to-end
- [ ] TASK-025 — Teste rate limiting
- [ ] TASK-026 — Teste retry do pipeline

---

## Backlog — não implementar agora

Itens identificados durante o planejamento que ficam para versões futuras:

- **Supabase RLS (Row Level Security)** — configurar políticas de acesso por linha no banco. Não é crítico para V1 interno, mas obrigatório antes de abrir para múltiplos clientes. Quando implementar: criar políticas para `sessions`, `proposals` e `notifications` garantindo que cada usuário veja apenas seus próprios dados.
- **Reprocessamento parcial do pipeline** — hoje o retry reprocessa o pipeline inteiro. Evoluir para retomar a partir da etapa que falhou, reaproveitando os blocos já gerados.
- **Sistema de créditos** — clientes compram créditos antes de usar o sistema. Os campos `message_count` e `input_tokens` já existem no banco e servem de base para essa implementação.
- **Multi-tenant / SaaS** — isolamento de dados por organização, billing, onboarding público.
- **Makefile: target de deploy** — `make deploy` para subir em VPS (AWS/Hostinger) via Docker Compose remoto.
- **Limpeza de sessões abandonadas** — cron job (Supabase `pg_cron`) para marcar como `abandoned` sessões em `interview_in_progress` ou `awaiting_start` sem atividade por X dias (configurável por env, ex: 7 dias) e deletar os registros correspondentes na tabela `messages`. O registro em `sessions` deve ser mantido com o novo status para auditoria. Não há lógica de retomada de sessão — cada sessão é tratada como descartável após abandono.