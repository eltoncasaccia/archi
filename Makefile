# Archi — Makefile
# Usage: make <command>

.PHONY: dev dev-build setup doctor eval sync-prompts reset-session help

help:
	@echo ""
	@echo "Archi — comandos disponíveis:"
	@echo ""
	@echo "  make dev            Sobe todos os serviços (Docker)"
	@echo "  make dev-build      Sobe todos os serviços com rebuild"
	@echo "  make setup          Inicializa o projeto (instala deps, cria .env)"
	@echo "  make doctor         Verifica se o ambiente está pronto para rodar"
	@echo "  make eval           Checa os prompts contra os casos de teste (sem LLM)"
	@echo "  make sync-prompts   Envia prompts do archi-prompts para o LangFuse cloud"
	@echo "  make reset-session  Reseta uma sessão (pede o session_id)"
	@echo ""

dev:
	bash scripts/dev.sh

dev-build:
	bash scripts/dev.sh --build

setup:
	bash scripts/setup.sh

doctor:
	@bash scripts/doctor.sh

eval:
	@uv run --directory archi-api python $(CURDIR)/scripts/eval_prompts.py

sync-prompts:
	bash scripts/sync_prompts.sh

reset-session:
	@read -p "Session ID: " id; bash scripts/reset_session.sh $$id
