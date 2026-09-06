#!/bin/bash
# =============================================================================
# Archi — Sync Prompts to LangFuse cloud
# Reads YAML prompt files from archi-prompts and pushes to LangFuse
# Usage: bash scripts/sync_prompts.sh  (from project root)
# =============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()    { echo -e "${GREEN}[sync]${NC} $1"; }
warning() { echo -e "${YELLOW}[sync]${NC} $1"; }
error()   { echo -e "${RED}[sync]${NC} $1"; exit 1; }

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROMPTS_DIR="$ROOT_DIR/archi-prompts"
ENV_FILE="$ROOT_DIR/archi-api/.env"

# -----------------------------------------------------------------------------
# Load environment variables
# -----------------------------------------------------------------------------

if [ ! -f "$ENV_FILE" ]; then
  error ".env not found in archi-api. Run setup.sh first."
fi

export $(grep -v '^#' "$ENV_FILE" | grep -v '^$' | xargs)

if [ -z "$LANGFUSE_PUBLIC_KEY" ] || [ -z "$LANGFUSE_SECRET_KEY" ]; then
  error "LANGFUSE_PUBLIC_KEY or LANGFUSE_SECRET_KEY not set in .env"
fi

if [ -z "$LANGFUSE_HOST" ]; then
  LANGFUSE_HOST="http://localhost:3001"
  warning "LANGFUSE_HOST not set, using default: $LANGFUSE_HOST"
fi

# -----------------------------------------------------------------------------
# Check prompts directory
# -----------------------------------------------------------------------------

if [ ! -d "$PROMPTS_DIR" ]; then
  error "archi-prompts directory not found at $PROMPTS_DIR"
fi

# -----------------------------------------------------------------------------
# Gate: a eval de montagem roda antes de publicar
# Publicar é irreversível na prática — o LangFuse marca a versão como production
# e a API passa a servi-la na próxima subida. A eval é determinística e leva
# menos de um segundo, então não há motivo para publicar sem ela.
# Use --skip-eval para publicar mesmo com falha (deliberadamente).
# -----------------------------------------------------------------------------

if [ "${1:-}" != "--skip-eval" ]; then
  info "Rodando a eval dos prompts antes de publicar..."
  if ! uv run --directory "$ROOT_DIR/archi-api" python "$ROOT_DIR/scripts/eval_prompts.py"; then
    error "A eval falhou — nada foi publicado. Corrija, ou use: bash scripts/sync_prompts.sh --skip-eval"
  fi
  echo ""
else
  warning "Eval pulada por --skip-eval."
fi

# -----------------------------------------------------------------------------
# Sync function — pushes one prompt to LangFuse via API
# -----------------------------------------------------------------------------

sync_prompt() {
  local prompt_name="$1"
  local prompt_file="$2"

  if [ ! -f "$prompt_file" ]; then
    warning "File not found, skipping: $prompt_file"
    return
  fi

  # Extract the 'system' field from the YAML using uv run --directory "$ROOT_DIR/archi-api" python
  local prompt_content
  prompt_content=$(uv run --directory "$ROOT_DIR/archi-api" python -c "
import yaml, sys
with open('$prompt_file') as f:
    data = yaml.safe_load(f)
# Support both 'system' and 'prompt' keys
content = data.get('template') or data.get('system') or data.get('prompt') or ''
print(content)
")

  if [ -z "$prompt_content" ]; then
    warning "No content found in $prompt_file, skipping."
    return
  fi

  # Push to LangFuse via REST API
  local response
  response=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$LANGFUSE_HOST/api/public/v2/prompts" \
    -u "$LANGFUSE_PUBLIC_KEY:$LANGFUSE_SECRET_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"$prompt_name\",
      \"prompt\": $(echo "$prompt_content" | uv run --directory "$ROOT_DIR/archi-api" python -c 'import json,sys; print(json.dumps(sys.stdin.read()))'),
      \"type\": \"text\",
      \"labels\": [\"production\"]
    }")

  if [ "$response" == "200" ] || [ "$response" == "201" ]; then
    info "Synced: $prompt_name"
  else
    warning "Failed to sync $prompt_name (HTTP $response) — check LangFuse is running."
  fi
}

# -----------------------------------------------------------------------------
# Sync all prompts
# -----------------------------------------------------------------------------

info "Syncing prompts from $PROMPTS_DIR to $LANGFUSE_HOST"
echo ""

sync_prompt "agent-discovery-interview" \
  "$PROMPTS_DIR/agent-discovery-interview/v1.0.0/prompt.yaml"

sync_prompt "agent-discovery-generator" \
  "$PROMPTS_DIR/agent-discovery-generator/v1.0.0/prompt.yaml"

sync_prompt "agent-pricing" \
  "$PROMPTS_DIR/agent-pricing/v1.0.0/prompt.yaml"

sync_prompt "agent-phases" \
  "$PROMPTS_DIR/agent-phases/v1.0.0/prompt.yaml"

sync_prompt "agent-proposal-generator" \
  "$PROMPTS_DIR/agent-proposal-generator/v1.0.0/prompt.yaml"

echo ""
info "Sync complete. Verify prompts at $LANGFUSE_HOST"