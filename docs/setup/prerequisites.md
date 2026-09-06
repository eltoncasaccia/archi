# Preparar o ambiente — Archi

Tudo que o sistema precisa para rodar: contas externas, chaves e ferramentas locais.
Serve tanto para montar o ambiente do zero quanto para reconstruí-lo depois.

> **Antes de seguir o passo a passo, rode `make doctor`.** Ele testa de verdade cada
> item deste documento — conexão com o Supabase, tabelas, bucket, chaves do LangFuse,
> prompts publicados, provider LLM e Resend — e diz exatamente o que falta.
> Este documento explica *como resolver* o que o doctor apontar.

---

## 1. Contas e serviços externos

---

### 1.1 Supabase
Banco, storage e autenticação do admin.

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

6. **Crie as tabelas:**
   - **SQL Editor → New query**
   - Cole o conteúdo de `archi-api/db/schema.sql` e clique em **Run**
   - Cria as 5 tabelas (`access_codes`, `sessions`, `messages`, `proposals`,
     `notifications`), 9 índices, e liga RLS com 4 policies para o papel `authenticated`

   > `archi-api/db/schema.sql` é o source of truth do schema. Ao alterar o banco,
   > atualize esse arquivo no mesmo commit.

7. Crie o bucket de storage:
   - **Storage → New bucket**
   - Nome: exatamente `proposals`
   - Marcar como **Public**
   - Clicar em **Create bucket**

   > O `schema.sql` **não** cria o bucket — a linha está comentada no fim do arquivo.
   > O nome está fixo em `archi-api/app/services/document_service.py:14`; se divergir,
   > a proposta é gerada mas o upload falha.

8. Crie o usuário admin:
   - **Authentication → Users → Add user → Create new user**
   - Email e senha, e marque **Auto Confirm User**

   > Sem esse usuário não há como entrar no painel. O login chama `signInWithPassword`
   > direto — não existe tela de cadastro nem fluxo de convite, então o usuário só nasce aqui.

---

### 1.2 Provider LLM — OpenRouter
Usado em toda chamada LLM do sistema.

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

Modelos recomendados por fase — slugs e preços conferidos no catálogo do OpenRouter
em 6 de setembro de 2026 (`GET /api/v1/models`):

| Fase | `LITELLM_MODEL` | Custo (entrada / saída por M tokens) |
|---|---|---|
| Desenvolvimento | `openrouter/openai/gpt-4o-mini` | $0.15 / $0.60 |
| Desenvolvimento | `openrouter/meta-llama/llama-4-maverick` | $0.20 / — |
| Desenvolvimento | `openrouter/deepseek/deepseek-chat-v3.1` | $0.55 / — |
| Validação de prompts | `openrouter/anthropic/claude-sonnet-5` | $2.00 / $10.00 |
| Produção | `openrouter/anthropic/claude-sonnet-5` | $2.00 / $10.00 |
| Produção (raciocínio pesado) | `openrouter/anthropic/claude-opus-5` | $5.00 / $25.00 |

> 💡 Comece barato no desenvolvimento e troque para Claude Sonnet 5 ao validar os prompts
> finais. Tudo com a mesma `LLM_API_KEY` — só muda `LITELLM_MODEL`, sem tocar em código
> (é o motivo do LiteLLM: ver `docs/adr/adr-002-litellm.md`).
>
> ⚠️ Os slugs do OpenRouter mudam quando modelos são lançados ou aposentados. Se uma
> chamada falhar com "model not found", confira a lista atual em
> https://openrouter.ai/models.

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
3. `LITELLM_MODEL=anthropic/claude-sonnet-5`

> ⚠️ A chave só aparece uma vez — anote imediatamente.
> ⚠️ Cobrado separadamente do plano Claude.ai Pro.

---

### 1.3 Resend
Envio da proposta pronta por email.

1. Crie conta em https://resend.com
2. Vá em **API Keys → Create API Key**
3. Nome: `archi`
4. Anote a chave → vai para `RESEND_API_KEY`
5. Sem domínio próprio: use `EMAIL_FROM=onboarding@resend.dev` para desenvolvimento

> ⚠️ `onboarding@resend.dev` é o sandbox do Resend: ele **só entrega para o email dono
> da conta**. Serve para testar o fluxo inteiro, mas não manda nada para um cliente real.
> Para isso, verifique um domínio em **Domains** e troque `EMAIL_FROM`.

---

### 1.4 LangFuse (cloud)
Gerenciamento dos prompts e tracing de toda chamada LLM.

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

6. **Publique os prompts** — depois de preencher `archi-api/.env`:

```bash
make sync-prompts
```

> ⚠️ Passo obrigatório num projeto LangFuse novo. Os YAMLs em `archi-prompts/` **não são
> lidos em runtime**: na subida, a API busca os 5 prompts no LangFuse **pelo nome**. Se
> não estiverem publicados e não houver `archi-api/prompts_cache.json`, a API não sobe —
> `prompt_loader.py` levanta `RuntimeError`.
>
> Detalhes do fluxo: `archi-prompts/README.md`.

---

## 2. Ferramentas locais

---

### 2.1 Docker Desktop ou OrbStack
Necessário para `make dev`.

Escolha um — são totalmente compatíveis com Docker Compose, comandos idênticos:

- **Docker Desktop:** https://docker.com/products/docker-desktop
- **OrbStack** (recomendado para Mac — mais rápido e leve): https://orbstack.dev

Verifique que está rodando antes de executar `make dev`.

---

### 2.2 Python 3.12+ com uv
Gerenciador de pacotes do backend.

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
Necessário para o frontend.

```bash
node --version   # deve ser 18 ou superior
```

Se precisar instalar: https://nodejs.org (versão LTS)

---

### 2.4 Claude Code
Para trabalhar no código com assistência.

```bash
claude --version
```

Se não estiver instalado:
```bash
npm install -g @anthropic-ai/claude-code
```

---

## 3. Verificar se está tudo pronto

```bash
make doctor
```

Não existe checklist manual aqui de propósito: uma lista de caixinhas registra o que você
*lembra* de ter feito, e foi assim que este projeto passou meses com um Supabase deletado
sem ninguém notar. O `doctor` **testa**, e sai com código 1 se algo estiver faltando.

O que ele verifica:

| Área | Checagem |
|---|---|
| Ferramentas | `docker` (com daemon rodando), `uv`, `node` 18+, `python3` |
| Ambiente | as 11 variáveis de `archi-api/.env` e as 3 de `archi-web/.env.local` |
| Ambiente | se as duas URLs do Supabase apontam para o mesmo projeto |
| Ambiente | se a chave secreta vazou para uma variável `NEXT_PUBLIC_` |
| Supabase | DNS resolve, as 5 tabelas respondem, o bucket `proposals` existe |
| LangFuse | chaves aceitas e os 5 prompts publicados |
| LLM | chave do OpenRouter (ou Groq) aceita |
| Resend | chave aceita, e aviso se `EMAIL_FROM` ainda é o sandbox |

Ele é somente-leitura: não escreve nada, não envia email e nunca imprime o valor de
uma chave — só se ela foi aceita.

---

## 4. Onde guardar as chaves

Não anote as chaves em documentos versionados no Git.
Use um gerenciador de senhas (1Password, Bitwarden) ou arquivo local fora do repositório.

As chaves vão para `archi-api/.env` e `archi-web/.env.local`, criados por `make setup` a
partir dos `.env.example`. Os dois estão no `.gitignore` e nunca vão para o GitHub.