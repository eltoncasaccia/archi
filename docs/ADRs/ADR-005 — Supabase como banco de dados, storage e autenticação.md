# ADR-005 — Supabase como banco de dados, storage e autenticação

**Status:** Aceito  
**Data:** 2026

---

## Contexto

O sistema precisa de banco de dados relacional (PostgreSQL), armazenamento de arquivos (DOCX/PDF gerados), e autenticação para o painel admin. Gerenciar três serviços separados (banco + storage + auth) aumenta a complexidade operacional, especialmente para um sistema de uso interno com volume baixo.

## Decisão

Usar **Supabase** (cloud, plano gratuito) como solução unificada para banco de dados, storage de arquivos e autenticação do admin.

## Justificativa

- Um único serviço resolve banco, storage e auth — menos infraestrutura para operar
- PostgreSQL gerenciado — backups, escalabilidade e alta disponibilidade sem configuração
- Supabase Auth: email/senha pronto para uso, com JWT compatível com FastAPI
- Supabase Storage: bucket para DOCX/PDF com URLs públicas ou com controle de acesso
- SDK Python (`supabase-py`) com suporte async nativo
- Plano gratuito cobre o volume esperado da V1 com folga

## Consequências

**Positivas:**
- Redução significativa de infraestrutura a gerenciar
- Auth e storage integrados nativamente ao banco
- Migração para plano pago é transparente quando o volume crescer

**Negativas:**
- Dependência de serviço externo (cloud) — mitigada pelo plano gerenciado que oferece alta disponibilidade
- Não é self-hosted — dados ficam na infraestrutura do Supabase

## Alternativas consideradas

- **PostgreSQL self-hosted + S3 + Auth próprio:** descartado — complexidade operacional desnecessária para V1
- **PlanetScale + Cloudflare R2 + Auth0:** descartado — três serviços separados, mais custo e configuração
- **Firebase:** descartado — banco NoSQL não adequado para os relacionamentos do sistema