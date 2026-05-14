# archi-web

Frontend do sistema Archi. Interface web em Next.js com duas áreas: área pública para o cliente (chat com o agente) e painel administrativo para revisão e envio de propostas.

## Stack

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- Supabase Auth (`@supabase/ssr`)

## Pré-requisitos

- Node.js 18+
- Backend `archi-api` rodando
- Variáveis de ambiente configuradas (ver abaixo)

## Instalação

```bash
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas chaves reais
```

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL do backend (padrão: `http://localhost:8000`) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon pública do Supabase |

## Rodando localmente

```bash
# Desenvolvimento
npm run dev

# Ou via Docker Compose (recomendado — sobe api + web + langfuse juntos)
bash ../dev.sh
```

Frontend disponível em `http://localhost:3000`

## Telas

| Rota | Descrição | Acesso |
|---|---|---|
| `/` | Entrada com código de acesso | Público |
| `/interview/[sessionId]` | Chat com o agente | Público (com código válido) |
| `/admin/login` | Login do admin | Público |
| `/admin` | Dashboard | Admin autenticado |
| `/admin/proposals` | Lista de propostas | Admin autenticado |
| `/admin/proposals/[id]` | Detalhe e envio da proposta | Admin autenticado |
| `/admin/access-codes` | Gestão de códigos de acesso | Admin autenticado |
| `/admin/notifications` | Notificações do sistema | Admin autenticado |

## Estrutura

```
src/
├── app/
│   ├── page.tsx                    # Tela de acesso
│   ├── interview/[sessionId]/      # Chat com o agente
│   └── admin/                      # Painel administrativo
├── components/
│   ├── chat/                       # Componentes do chat
│   └── admin/                      # Componentes do painel
└── lib/
    ├── supabase.ts                 # Cliente Supabase
    └── api.ts                      # Chamadas ao backend
```
