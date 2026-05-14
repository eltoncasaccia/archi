#!/bin/bash
# =============================================================================
# Archi — Local Development
# Starts all services with Docker Compose
# Usage: bash scripts/dev.sh [--build]
# =============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()    { echo -e "${GREEN}[dev]${NC} $1"; }
warning() { echo -e "${YELLOW}[dev]${NC} $1"; }

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$ROOT_DIR/archi-api"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"

# -----------------------------------------------------------------------------
# Check .env files
# -----------------------------------------------------------------------------

if [ ! -f "$API_DIR/.env" ]; then
  warning ".env not found in archi-api. Run setup.sh first."
  exit 1
fi

# -----------------------------------------------------------------------------
# Start services
# -----------------------------------------------------------------------------

BUILD_FLAG=""
if [ "$1" == "--build" ]; then
  BUILD_FLAG="--build"
  info "Building images before starting..."
fi

info "Starting all services..."
echo ""
echo "  Backend API:  http://localhost:8000"
echo "  Backend docs: http://localhost:8000/docs"
echo "  Frontend:     http://localhost:3000"
echo "  LangFuse:     https://us.cloud.langfuse.com"
echo ""
warning "Press Ctrl+C to stop all services."
echo ""

docker compose -f "$COMPOSE_FILE" up $BUILD_FLAG
