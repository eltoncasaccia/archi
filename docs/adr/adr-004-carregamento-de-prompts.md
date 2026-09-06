# ADR-004 — Estratégia de carregamento de prompts no startup

**Status:** Aceito  
**Data:** 2026

---

## Contexto

Os prompts dos subagentes são gerenciados no LangFuse. O backend precisa acessá-los durante a execução do pipeline. Fazer uma chamada ao LangFuse a cada execução de subagente cria latência adicional e dependência em runtime. Por outro lado, embutir os prompts no código elimina a capacidade de editá-los sem deploy.

## Decisão

No startup do backend, buscar todos os prompts do LangFuse via SDK, carregar em memória (dicionário Python) e salvar uma cópia local em `prompts_cache.json`. Durante a execução, usar apenas o que está em memória. Se o LangFuse estiver indisponível no startup, carregar do arquivo local.

## Justificativa

- Zero latência em runtime — prompts já estão em memória
- Zero dependência do LangFuse durante a execução do pipeline
- Prompts atualizados a cada restart do backend (sem necessidade de deploy de código)
- Cache local garante que o sistema não fica parado se o LangFuse cair

## Fluxo

```
Backend starta
    ↓
Tenta buscar prompts no LangFuse
    ├── Sucesso → carrega em memória + salva prompts_cache.json
    └── Falha   → carrega prompts_cache.json existente
                     └── Se não existir → lança exceção e impede startup
```

## Consequências

**Positivas:**
- Sem chamadas de rede durante execução do pipeline
- Sistema resiliente a falhas do LangFuse após primeiro startup bem-sucedido

**Negativas:**
- Prompts novos só entram em vigor após restart do backend
- `prompts_cache.json` não deve ser versionado no Git (contém conteúdo dos prompts, não código)

## Alternativas consideradas

- **Chamar LangFuse a cada execução:** descartado — latência adicionada, dependência em runtime
- **Prompts embutidos no código:** descartado — exige deploy para qualquer edição de prompt
- **Cache com TTL (sem arquivo local):** descartado — não sobrevive a restart com LangFuse fora do ar