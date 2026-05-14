#!/bin/bash
# =============================================================================
# Archi — Reset Session (development use only)
# Resets a session status back to awaiting_start for retesting
# Usage: bash scripts/reset_session.sh <session_id>  (from project root)
# =============================================================================

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[reset]${NC} $1"; }
error() { echo -e "${RED}[reset]${NC} $1"; exit 1; }

SESSION_ID="$1"

if [ -z "$SESSION_ID" ]; then
  error "Usage: bash scripts/reset_session.sh <session_id>"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
API_DIR="$ROOT_DIR/archi-api"
ENV_FILE="$API_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
  error ".env not found in archi-api."
fi

export $(grep -v '^#' "$ENV_FILE" | grep -v '^$' | xargs)

info "Resetting session $SESSION_ID..."

python3 - <<EOF
import asyncio
from supabase import create_client

supabase = create_client("$SUPABASE_URL", "$SUPABASE_SERVICE_ROLE_KEY")

result = supabase.table("sessions").update({
    "status": "awaiting_start",
    "discovery_approved": None,
    "discovery_summary": None,
    "pricing_summary": None,
    "phases_plan": None,
    "proposal_metadata": None,
    "error_step": None,
    "error_message": None,
    "message_count": 0,
    "input_tokens": 0,
}).eq("id", "$SESSION_ID").execute()

if result.data:
    print("Session reset successfully.")
else:
    print("Session not found or already reset.")
EOF

info "Done."
