# Briefing — Sessão de Arquitetura
## Sistema Autônomo de Pré-Venda

---

## O que já existe (não rediscutir)

Um pipeline de 5 agentes já definido e documentado:

```
Fase 1 — Entrevista ao vivo com o cliente
  agent-discovery-interview     (agente conversacional — fala com o cliente)

Fase 2 — Pipeline interno automatizado
  agent-discovery-generator     (análise estruturada em 13 seções)
  agent-pricing                 (breakdown de preço por módulo)
  agent-phases                  (plano de fases entregáveis)
  agent-proposal-generator      (redação da proposta comercial)

  orchestrator-pre-sales        (pendente — coordena os 4 subagentes acima)
```

**Contratos de interface entre agentes já definidos:**
- `[DISCOVERY_APROVADO]` → gerado na entrevista, consumido pelo generator e pelo proposal
- `[DISCOVERY_SUMMARY]` → gerado pelo generator, consumido pelo pricing, phases e proposal
- `[PRICING_SUMMARY]` → gerado pelo pricing, consumido pelo phases e proposal
- `[PHASES_PLAN]` → gerado pelo phases, consumido pelo proposal
- `[PROPOSAL_METADATA]` → gerado pelo proposal, consumido pelo orchestrator

**Fluxo macro já decidido:**
1. Cliente acessa interface → conversa com agent-discovery-interview em tempo real
2. Cliente aprova o discovery na conversa
3. Pipeline da Fase 2 roda em background (assíncrono)
4. Você recebe notificação → revisa no painel admin → aprova envio
5. Proposta chega ao cliente por email

---

## O que está indefinido (foco desta sessão)

### 1. Interface do cliente — onde a conversa acontece?

Opções possíveis:
- Web app próprio (URL pública, ex: `orcamento.suaempresa.com.br`)
- Widget embeddable em site existente
- WhatsApp Business

**Impacto:** define frontend, autenticação, domínio, hospedagem.

### 2. Multi-tenant ou uso interno?

- **Uso interno:** só você usa o sistema para atender seus próprios clientes
- **Multi-tenant:** outros prestadores de serviço também poderiam usar o sistema (SaaS)

**Impacto:** banco de dados, isolamento de dados, autenticação, complexidade geral, custo.

### 3. Quanto você quer gerenciar de infraestrutura?

- **Menos gestão:** plataformas gerenciadas (Supabase, Vercel, Railway, Render)
- **Mais controle:** VPS próprio, Docker, self-hosted

**Impacto:** custo operacional, complexidade de deploy, manutenção.

### 4. Qual seu nível de conforto técnico para o backend?

Você já tem experiência com React Native, Supabase, n8n, Docker.

- Quer usar o que já conhece ao máximo?
- Está aberto a aprender novas ferramentas se fizerem sentido?

**Impacto:** escolha de stack, curva de aprendizado, velocidade de entrega.

---

## Perguntas para responder no início da sessão

Responda estas antes de começar a discussão de arquitetura. Não precisa ser detalhado — uma frase por resposta já ajuda:

1. **Onde o cliente vai acessar?** Web app próprio, widget ou WhatsApp?
2. **Uso interno ou SaaS?** Só você ou outros poderão usar o sistema?
3. **Quando o cliente aprova a entrevista, ele espera ou recebe email?** (Já decidido: email — só confirmar)
4. **Você quer gerenciar servidor ou prefere plataforma gerenciada?**
5. **Qual o volume esperado?** Quantos clientes por mês em média vão usar o sistema?

---

## O que a sessão de arquitetura deve produzir

Ao final da sessão, você deve ter decidido:

- [ ] Canal de acesso do cliente (frontend)
- [ ] Stack do backend (framework, linguagem)
- [ ] Como o pipeline assíncrono vai rodar (fila, workers, serverless functions)
- [ ] Banco de dados (tipo e produto)
- [ ] Se precisa de cache/fila (Redis ou equivalente)
- [ ] Onde vai hospedar cada peça
- [ ] Se vai usar LangChain, LangGraph ou chamada direta à API
- [ ] Como o painel admin vai funcionar
- [ ] Como o email vai ser disparado

Esses itens respondem o que o Claude Code precisava saber antes de criar o orchestrator.

---

## O que NÃO discutir nessa sessão

- Código — zero código, zero implementação
- Detalhes dos prompts — já estão prontos e fechados
- Backlog detalhado — vem depois da arquitetura
- Design visual — não é prioridade agora

---

## Instrução para o Claude na nova conversa

Cole isso no início da conversa:

> "Vou definir a arquitetura de um sistema autônomo de pré-venda de software.
> O sistema já tem 5 prompts de agentes definidos (ver INVENTORY.md em anexo).
> O fluxo macro está decidido: cliente conversa com agente em tempo real → aprova o discovery → pipeline assíncrono gera a proposta → eu reviso → proposta vai por email para o cliente.
> Não quero discutir os prompts, não quero código, não quero backlog.
> Quero apenas definir a arquitetura técnica do sistema para que eu possa implementar depois.
> Vou responder as perguntas do briefing e você me ajuda a tomar as decisões certas."