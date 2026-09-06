#!/bin/bash
# =============================================================================
# Archi — Project Setup
# Run once after cloning the repositories
# Usage: bash scripts/setup.sh  (from project root)
# =============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()    { echo -e "${GREEN}[setup]${NC} $1"; }
warning() { echo -e "${YELLOW}[setup]${NC} $1"; }
error()   { echo -e "${RED}[setup]${NC} $1"; exit 1; }

# -----------------------------------------------------------------------------
# Check dependencies
# -----------------------------------------------------------------------------

info "Checking dependencies..."

command -v python3 >/dev/null 2>&1 || error "python3 not found. Install Python 3.12+."
command -v pip >/dev/null 2>&1    || error "pip not found."
command -v node >/dev/null 2>&1   || error "node not found. Install Node.js 18+."
command -v npm >/dev/null 2>&1    || error "npm not found."
command -v docker >/dev/null 2>&1 || error "docker not found. Install Docker Desktop."

info "All dependencies found."

# -----------------------------------------------------------------------------
# Backend (archi-api)
# -----------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
API_DIR="$ROOT_DIR/archi-api"

info "Setting up backend..."

# Copy .env.example if .env doesn't exist
if [ ! -f "$API_DIR/.env" ]; then
  cp "$API_DIR/.env.example" "$API_DIR/.env"
  warning ".env created from .env.example — fill in the values before running."
else
  info ".env already exists, skipping."
fi

# Install Python dependencies via uv
info "Installing Python dependencies..."
(cd "$API_DIR" && uv sync)

# -----------------------------------------------------------------------------
# Frontend (archi-web)
# -----------------------------------------------------------------------------

WEB_DIR="$ROOT_DIR/archi-web"

if [ -d "$WEB_DIR" ]; then
  info "Setting up frontend..."

  if [ ! -f "$WEB_DIR/.env.local" ]; then
    cp "$WEB_DIR/.env.example" "$WEB_DIR/.env.local"
    warning ".env.local created from .env.example — fill in the values before running."
  else
    info ".env.local already exists, skipping."
  fi

  info "Installing npm dependencies..."
  npm install --prefix "$WEB_DIR" --silent
else
  warning "archi-web directory not found at $WEB_DIR — skipping frontend setup."
fi

# -----------------------------------------------------------------------------
# Done
# -----------------------------------------------------------------------------

echo ""
info "Setup complete. Next steps:"
echo "  1. Edit archi-api/.env with your API keys"
echo "  2. Edit archi-web/.env.local with your Supabase public keys"
echo "  3. Run the database setup: execute archi-api/db/schema.sql in Supabase SQL Editor"
echo "  4. Start everything: bash scripts/dev.sh"
echo ""
