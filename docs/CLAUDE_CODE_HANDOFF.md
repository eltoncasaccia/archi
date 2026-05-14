# CLAUDE_CODE_HANDOFF.md — Archi
## Passo a Passo para Implementação com Claude Code

**Versão:** 1.0.0
**Última atualização:** 2026

> Leia o PREREQUISITES.md e complete todos os itens antes de começar.
> Execute cada passo na ordem apresentada.

---

## Antes de abrir o Claude Code

Confirme que a estrutura de pastas está assim:

```
PRE-SALES/                     ← pasta raiz do projeto
├── docs/
│   ├── ADRs/                  ← 9 arquivos ADR-001 a ADR-009
│   ├── archi-design/         ← bundle do Claude Design
│   ├── orchestrator-pre-sales.md
│   ├── SCREENS.md
│   ├── TASKS.md
│   ├── TECH SPEC — Archi.md
│   ├── PREREQUISITES.md
│   ├── CLAUDE_CODE_HANDOFF.md ← este arquivo
│   ├── README-api.md
│   └── README-web.md
├── archi-prompts/            ← repositório de prompts
├── CLAUDE.md                  ← lido automaticamente pelo Claude Code
├── Makefile                   ← make dev, make setup, make sync-prompts
├── docker-compose.yml
├── dev.sh
├── setup.sh
├── db_setup.sql
├── sync_prompts.sh
└── reset_session.sh
```

---

## Passo 1 — Abrir o Claude Code

Abra o terminal na pasta raiz do projeto e inicie o Claude Code:

```bash
cd ~/projects/PRE-SALES
claude
```

---

## Passo 2 — Mensagem inicial para o Claude Code

Cole exatamente este texto no Claude Code ao iniciar:

```
Vamos implementar o projeto Archi — um sistema autônomo de pré-venda de software.

Antes de começar, leia os seguintes documentos na pasta docs/:
- TECH SPEC — Archi.md         (arquitetura, stack, banco, endpoints)
- TASKS.md                       (lista de tarefas a executar)
- SCREENS.md                     (comportamento de cada tela)
- Todos os arquivos em ADRs/     (decisões arquiteturais)

Regras para esta sessão:
1. Execute as tarefas na ordem exata definida no TASKS.md
2. Ao concluir cada tarefa, me informe e aguarde minha confirmação antes de avançar
3. Se tiver dúvida sobre alguma decisão técnica, consulte os ADRs antes de perguntar
4. Não tome decisões de arquitetura por conta própria — tudo já está documentado
5. Se algo não estiver claro nos documentos, me pergunte antes de implementar

Comece lendo os documentos e me diga quando estiver pronto para iniciar a TASK-001.
```

---

## Passo 3 — Executar as tarefas

Execute uma tarefa por vez. Após cada tarefa, use o critério de aceite do TASKS.md para verificar se está funcionando antes de liberar a próxima.

### Fase 1 — Setup (TASK-001 a TASK-005)

| Tarefa | O que acontece | Sua ação |
|---|---|---|
| TASK-001 | Claude Code cria a estrutura do backend | Verificar que pastas foram criadas, backend sobe com `/health` |
| TASK-002 | Claude Code inicializa o frontend Next.js | Verificar que `localhost:3000` abre sem erro |
| TASK-003 | Claude Code cria os `.env.example` | **Você preenche as chaves nos arquivos `.env`** — ver PREREQUISITES.md |
| TASK-004 | Claude Code cria Docker Compose | Executar `make dev-build` e verificar que api + web sobem |
| TASK-005 | Claude Code cria as tabelas no Supabase | Verificar tabelas no Supabase Dashboard |

> ⚠️ **Pausa obrigatória na TASK-003:** antes de liberar a TASK-004, preencha os arquivos `.env` com suas chaves reais. O Claude Code não tem acesso às suas chaves — você precisa inserir manualmente.

> ⚠️ **Antes da TASK-005:** garanta que as chaves do LangFuse cloud estão no `.env` (`LANGFUSE_HOST=https://us.cloud.langfuse.com`).

---

### Fase 2 — Backend: Fundação (TASK-006 a TASK-008)

| Tarefa | O que acontece | Sua ação |
|---|---|---|
| TASK-006 | Implementa cliente Supabase | Verificar que conecta ao banco sem erro |
| TASK-007 | Implementa prompt loader | **Você precisa cadastrar os prompts no LangFuse antes de testar** |
| TASK-008 | Configura main.py com LangFuse | Fazer uma chamada de teste e verificar trace no LangFuse |

> ⚠️ **Antes de testar TASK-007:** cadastre os prompts no LangFuse cloud:
> 1. Acesse https://us.cloud.langfuse.com
> 2. Vá em **Prompts → Create**
> 3. Crie um prompt para cada nome abaixo, copiando o YAML de `archi-prompts/`:
>    - `agent-discovery-interview`
>    - `agent-discovery-generator`
>    - `agent-pricing`
>    - `agent-phases`
>    - `agent-proposal-generator`
>
> Ou execute: `make sync-prompts` (após as chaves do LangFuse estarem no `.env`)

---

### Fase 3 — Backend: Fluxo do cliente (TASK-009 a TASK-011)

| Tarefa | O que acontece | Sua ação |
|---|---|---|
| TASK-009 | Implementa endpoints do cliente (validate-code, message, approve) | Testar via `localhost:8000/docs` |
| TASK-010 | Implementa o orchestrator do pipeline | Testar com uma sessão completa — verificar blocos no Supabase |
| TASK-011 | Implementa endpoints do pipeline (start, retry) | Testar disparo em background |

---

### Fase 4 — Backend: Painel admin (TASK-012 a TASK-015)

| Tarefa | O que acontece | Sua ação |
|---|---|---|
| TASK-012 | Implementa autenticação JWT | Testar endpoint admin sem token (401) e com token (200) |
| TASK-013 | Implementa todos os endpoints admin | Testar via `localhost:8000/docs` com token |
| TASK-014 | Implementa geração de DOCX e PDF | Verificar que arquivos são gerados e salvos no Supabase Storage |
| TASK-015 | Implementa envio de email via Resend | Verificar que email chega na caixa de entrada |

---

### Fase 5 — Frontend: Área do cliente (TASK-015b a TASK-017)

| Tarefa | O que acontece | Sua ação |
|---|---|---|
| TASK-015b | Configura design system (tokens.css + assets) | Verificar que `var(--color-primary)` funciona em qualquer componente |
| TASK-016 | Tela de acesso — digitar código | Testar com código válido e inválido |
| TASK-017 | Tela de chat com o agente e streaming | Testar conversa completa com aprovação do discovery |

---

### Fase 6 — Frontend: Painel admin (TASK-018 a TASK-023)

| Tarefa | O que acontece | Sua ação |
|---|---|---|
| TASK-018 | Auth admin + layout sidebar | Verificar que `/admin` sem login redireciona para `/admin/login` |
| TASK-019 | Dashboard | Verificar cards com dados reais |
| TASK-020 | Lista de propostas | Verificar filtros e paginação |
| TASK-021 | Detalhe da proposta | Testar edição, geração de DOCX/PDF e envio |
| TASK-022 | Códigos de acesso | Gerar código e verificar na tabela |
| TASK-023 | Notificações | Verificar badge e marcar como lida |

---

### Fase 7 — Testes (TASK-024 a TASK-026)

| Tarefa | O que acontece | Sua ação |
|---|---|---|
| TASK-024 | Teste end-to-end do fluxo completo | Executar os 10 passos do TASKS.md e verificar cada um |
| TASK-025 | Teste de rate limiting | Configurar limite baixo, testar e restaurar |
| TASK-026 | Teste de retry do pipeline | Forçar falha, verificar erro, executar retry |

---

## Passo 4 — Como lidar com problemas

**Se o Claude Code tomar uma decisão diferente do que está documentado:**
> "Isso não está alinhado com o que definimos. Consulte o [ADR-XXX / TECH_SPEC §X / SCREENS.md §ScreenX] e refaça seguindo a documentação."

**Se o Claude Code pedir para instalar uma biblioteca não prevista:**
> "Por que essa biblioteca é necessária? Temos alternativa com o que já está no `pyproject.toml`? Se precisar adicionar, use `uv add <pacote>`."

**Se uma tarefa não passar no critério de aceite:**
> "O critério de aceite da TASK-XXX não foi atendido: [descreva o que não funcionou]. Corrija antes de avançar."

**Se o Claude Code sugerir mudar a arquitetura:**
> "As decisões de arquitetura estão fechadas nos ADRs. Não vamos alterar agora. Implemente conforme documentado."

---

## Passo 5 — Após a implementação completa

Com todas as 26 tarefas concluídas:

1. Rode o fluxo completo mais uma vez do zero (TASK-024) para confirmar que tudo funciona junto
2. Verifique o LangFuse em https://us.cloud.langfuse.com — você deve ver traces de todas as chamadas LLM
3. Verifique o Supabase Dashboard — todas as tabelas devem ter dados reais dos testes
4. O sistema está pronto para uso interno

---

## Referência rápida — URLs

| Serviço | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Backend docs (Swagger) | http://localhost:8000/docs |
| LangFuse cloud | https://us.cloud.langfuse.com |
| Supabase | https://supabase.com/dashboard |