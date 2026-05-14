# PREREQUISITES.md — Archi
## Pré-requisitos antes de começar a implementação

**Versão:** 1.0.0
**Última atualização:** 2026

> Complete todos os itens abaixo antes de iniciar qualquer tarefa com o Claude Code.
> Cada item indica em qual tarefa do TASKS.md será utilizado.

---

## 1. Contas e serviços externos

---

### 1.1 Supabase
**Usado em:** TASK-003, TASK-005

1. Crie conta em https://supabase.com
2. Clique em **New Project**
3. Preencha:
   - Nome: `archi`
   - Senha do banco: anote em lugar seguro
   - Região: `South America (São Paulo)`
4. Aguarde o projeto inicializar (~2 minutos)
5. Anote as três chaves abaixo:

| Variável | Onde encontrar | Aba |
|---|---|---|
| `SUPABASE_URL` | **Settings → General → Project URL** (`https://xxxx.supabase.co`) | General |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Publishable key** (`sb_publishable_...`) | Publishable and secret API keys |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret key** (`sb_secret_...`) | Publishable and secret API keys |

> ⚠️ Use sempre a aba **"Publishable and secret API keys"** — é o padrão atual do Supabase.
> A aba "Legacy anon, service_role" ainda funciona mas será descontinuada.
>
> ⚠️ A Secret key dá acesso total ao banco. Nunca use no frontend.

6. Crie o bucket de storage:
   - **Storage → New bucket**
   - Nome: `proposals`
   - Marcar como **Public**
   - Clicar em **Create bucket**

7. Crie o usuário admin:
   - **Authentication → Users → Add user**
   - Email: seu email
   - Password: senha segura

---

### 1.2 Provider LLM — OpenRouter
**Usado em:** toda chamada LLM do sistema

O sistema usa OpenRouter como provider LLM. Troque apenas `LITELLM_MODEL` para mudar de modelo sem alterar código.

---

#### OpenRouter (provider atual)

Uma conta, uma chave, acesso a 200+ modelos de todos os providers
(Anthropic, OpenAI, Google, DeepSeek, Llama...).
Troque de modelo mudando apenas `LITELLM_MODEL` — sem criar conta em cada provider separado.

1. Acesse https://openrouter.ai
2. Crie conta com email ou Google
3. Vá em **Credits → Add credits** (mínimo $5 — existem modelos gratuitos também)
4. Vá em **Keys → Create Key** → anote a chave → vai para `LLM_API_KEY`

Modelos recomendados por fase:

| Fase | `LITELLM_MODEL` | Modelo | Custo aprox. |
|---|---|---|---|
| Desenvolvimento | `openrouter/deepseek/deepseek-v3` | DeepSeek V3 | ~$0.28/M tokens |
| Desenvolvimento | `openrouter/meta-llama/llama-4-maverick` | Llama 4 Maverick | ~$0.20/M tokens |
| Validação de prompts | `openrouter/anthropic/claude-sonnet-4-5` | Claude Sonnet | ~$3/M tokens |
| Produção | `openrouter/anthropic/claude-sonnet-4-5` | Claude Sonnet | ~$3/M tokens |

> 💡 Comece com DeepSeek V3 para desenvolvimento — qualidade excelente e custo baixo.
> Troque para Claude Sonnet quando for validar os prompts finais e em produção.
> Tudo com a mesma `LLM_API_KEY`, só mudando `LITELLM_MODEL`.

---

#### Opção B — Groq (alternativa gratuita, sem cartão de crédito)

Ideal se quiser começar sem gastar nada. Só roda modelos open-source.

1. Acesse https://console.groq.com/keys
2. Crie conta com email — sem cartão de crédito
3. Clique em **Create API Key** → anote a chave → vai para `LLM_API_KEY`

Modelos disponíveis no free tier:

| `LITELLM_MODEL` | Modelo | Qualidade |
|---|---|---|
| `groq/llama-3.3-70b-versatile` | Llama 3.3 70B | ⭐⭐⭐⭐ |
| `groq/llama-4-maverick` | Llama 4 Maverick | ⭐⭐⭐⭐⭐ |

> ⚠️ Groq free tier: 30 requisições/minuto e 1.000 requisições/dia.
> Suficiente para desenvolvimento. Não suporta Claude ou GPT.

---

#### Opção C — Anthropic via OpenRouter (já coberto pela chave OpenRouter)

1. Acesse https://console.anthropic.com
2. Vá em **API Keys → Create Key** → anote a chave → vai para `LLM_API_KEY`
3. `LITELLM_MODEL=anthropic/claude-sonnet-4-5`

> ⚠️ A chave só aparece uma vez — anote imediatamente.
> ⚠️ Cobrado separadamente do plano Claude.ai Pro.

---

### 1.3 Resend
**Usado em:** TASK-015

1. Crie conta em https://resend.com
2. Vá em **API Keys → Create API Key**
3. Nome: `archi`
4. Anote a chave → vai para `RESEND_API_KEY`
5. Sem domínio próprio: use `EMAIL_FROM=onboarding@resend.dev` para desenvolvimento

---

### 1.4 LangFuse (cloud)
**Usado em:** todo tracing LLM e gerenciamento de prompts

O LangFuse roda na nuvem. Não há container local.

1. Acesse https://us.cloud.langfuse.com
2. Crie conta (email ou Google)
3. Crie uma organização e um projeto chamado `archi`
4. Vá em **Settings → API Keys → Create new key**
5. Anote as duas chaves:

| Variável | Onde encontrar |
|---|---|
| `LANGFUSE_PUBLIC_KEY` | Public Key (`pk-lf-...`) |
| `LANGFUSE_SECRET_KEY` | Secret Key (`sk-lf-...`) |

`LANGFUSE_HOST` deve ser `https://us.cloud.langfuse.com` no `.env`.

---

## 2. Ferramentas locais

---

### 2.1 Docker Desktop ou OrbStack
**Usado em:** TASK-004

Escolha um — são totalmente compatíveis com Docker Compose, comandos idênticos:

- **Docker Desktop:** https://docker.com/products/docker-desktop
- **OrbStack** (recomendado para Mac — mais rápido e leve): https://orbstack.dev

Verifique que está rodando antes de executar `make dev`.

---

### 2.2 Python 3.12+ com uv
**Usado em:** TASK-001

O projeto usa **uv** como gerenciador de pacotes e ambientes Python — sem pip, sem requirements.txt.
**Documentação:** https://docs.astral.sh/uv/

**Instalação do uv:**
```bash
# macOS / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Verificar
uv --version
```

**Principais comandos:**

| Ação | Comando |
|---|---|
| Criar ambiente virtual | `uv venv` |
| Instalar dependências | `uv sync` |
| Adicionar dependência | `uv add fastapi` |
| Remover dependência | `uv remove pacote` |
| Rodar o servidor | `uv run uvicorn app.main:app --reload` |
| Rodar um script | `uv run python script.py` |
| Ver árvore de dependências | `uv tree` |
| Instalar Python 3.12 | `uv python install 3.12` |

> O uv usa `pyproject.toml` + `uv.lock` — não usa `pip` nem `requirements.txt`.
> O `uv.lock` garante as mesmas versões em qualquer máquina.
> **Não edite o `uv.lock` manualmente** — gerado automaticamente.

Verifique Python disponível:
```bash
uv python list
uv python install 3.12   # se 3.12 não estiver listado
```

---

### 2.3 Node.js 18+
**Usado em:** TASK-002

```bash
node --version   # deve ser 18 ou superior
```

Se precisar instalar: https://nodejs.org (versão LTS)

---

### 2.4 Claude Code
**Usado em:** todas as tarefas

```bash
claude --version
```

Se não estiver instalado:
```bash
npm install -g @anthropic-ai/claude-code
```

---

## 3. Checklist final antes de começar

- [ ] Projeto criado no Supabase com região São Paulo
- [ ] `SUPABASE_URL` anotada (Settings → General)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` anotada (Publishable key)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` anotada (Secret key)
- [ ] Bucket `proposals` criado no Supabase Storage
- [ ] Usuário admin criado no Supabase Authentication
- [ ] Conta criada no OpenRouter, créditos adicionados e `LLM_API_KEY` anotada
- [ ] Conta criada no Resend e `RESEND_API_KEY` anotada
- [ ] Docker Desktop ou OrbStack instalado e rodando
- [ ] uv instalado (`uv --version` funciona)
- [ ] Python 3.12 disponível via uv (`uv python list`)
- [ ] Node.js 18+ instalado
- [ ] Claude Code instalado (`claude --version` funciona)

> As chaves do LangFuse são obtidas ao criar o projeto no LangFuse cloud (https://us.cloud.langfuse.com).

---

## 4. Onde guardar as chaves

Não anote as chaves em documentos versionados no Git.
Use um gerenciador de senhas (1Password, Bitwarden) ou arquivo local fora do repositório.

As chaves serão colocadas nos arquivos `.env` criados na TASK-003.
Esses arquivos estão no `.gitignore` e nunca serão enviados ao GitHub.