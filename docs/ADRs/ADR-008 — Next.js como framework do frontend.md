# ADR-008 — Next.js como framework do frontend

**Status:** Aceito  
**Data:** 2026

---

## Contexto

O frontend precisa suportar: chat em tempo real com streaming de respostas (SSE), painel admin protegido por autenticação, e múltiplas rotas com comportamentos distintos (área pública do cliente vs. área protegida do admin). A escolha do framework impacta a capacidade de lidar com streaming, autenticação server-side e manutenibilidade.

## Decisão

Usar **Next.js 14+** com App Router e TypeScript.

## Justificativa

- Suporte nativo a streaming via Server Components e API Routes
- App Router permite layouts aninhados — sidebar do admin é um layout que envolve todas as rotas `/admin/*`
- Autenticação server-side com `@supabase/ssr` — sessão verificada antes de renderizar, sem flash de conteúdo não autorizado
- Ecossistema React maduro — componentes de chat, rich text e tabelas disponíveis como bibliotecas
- Deploy simples na Vercel (quando chegar a hora) ou via Docker em qualquer VPS
- TypeScript garante consistência nos tipos de request/response com o backend

## Consequências

**Positivas:**
- Streaming de respostas do agente funciona nativamente
- Layout do admin (sidebar persistente) implementado como Next.js layout sem repetição de código
- Compatibilidade direta com Supabase Auth via `@supabase/ssr`

**Negativas:**
- App Router tem curva de aprendizado (Server vs. Client Components) — mitigado pela experiência prévia com React

## Alternativas consideradas

- **React puro (Vite + SPA):** descartado — sem suporte nativo a SSR, autenticação server-side mais trabalhosa
- **Vue / Nuxt:** descartado — ecossistema menos maduro para o perfil do projeto, sem ganho técnico relevante
- **Remix:** descartado — similar ao Next.js, mas ecossistema menor e menos exemplos com Supabase