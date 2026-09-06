#!/bin/bash
# =============================================================================
# Archi — Environment Doctor
# Checks everything the system needs to run, and reports what is missing.
# Read-only: never writes, never sends email, never prints secret values.
# Usage: bash scripts/doctor.sh  (from project root), or: make doctor
# Exit: 0 = tudo pronto | 1 = há falhas
# =============================================================================

set -uo pipefail   # sem -e: o doctor precisa rodar TODAS as checagens

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
DIM='\033[0;90m'
BOLD='\033[1m'
NC='\033[0m'

PASS=0; FAIL=0; WARN=0

section() { echo ""; echo -e "${BOLD}$1${NC}"; }
ok()   { PASS=$((PASS+1)); echo -e "  ${GREEN}✓${NC} $1${DIM}${2:+  $2}${NC}"; }
bad()  { FAIL=$((FAIL+1)); echo -e "  ${RED}✗${NC} $1"; [ -n "${2:-}" ] && echo -e "      ${DIM}→ $2${NC}"; }
warn() { WARN=$((WARN+1)); echo -e "  ${YELLOW}!${NC} $1"; [ -n "${2:-}" ] && echo -e "      ${DIM}→ $2${NC}"; }
skip() { echo -e "  ${DIM}·${NC} ${DIM}$1${NC}"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
API_ENV="$ROOT_DIR/archi-api/.env"
WEB_ENV="$ROOT_DIR/archi-web/.env.local"

# Lê uma chave do .env sem dar source (valores como "R$ 150" quebram o source).
env_val() {
  [ -f "$1" ] || return 0
  grep -E "^${2}=" "$1" 2>/dev/null | head -1 | cut -d= -f2- \
    | sed 's/[[:space:]]\+#.*$//' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//'
}

echo -e "${BOLD}Archi — doctor${NC}  ${DIM}$ROOT_DIR${NC}"

# -----------------------------------------------------------------------------
section "Ferramentas locais"
# -----------------------------------------------------------------------------

if command -v docker >/dev/null 2>&1; then
  if docker info >/dev/null 2>&1; then
    ok "docker" "$(docker --version | sed 's/Docker version //;s/,.*//') — daemon rodando"
  else
    bad "docker instalado mas o daemon não responde" "abra o Docker Desktop ou o OrbStack"
  fi
else
  bad "docker não encontrado" "instale o Docker Desktop ou o OrbStack"
fi

command -v uv >/dev/null 2>&1 \
  && ok "uv" "$(uv --version | awk '{print $2}')" \
  || bad "uv não encontrado" "curl -LsSf https://astral.sh/uv/install.sh | sh"

if command -v node >/dev/null 2>&1; then
  NODE_MAJOR=$(node -v | sed 's/^v//' | cut -d. -f1)
  if [ "${NODE_MAJOR:-0}" -ge 18 ] 2>/dev/null; then
    ok "node" "$(node -v)"
  else
    bad "node $(node -v) é antigo demais" "o projeto exige Node 18+"
  fi
else
  bad "node não encontrado" "instale a versão LTS em https://nodejs.org"
fi

command -v python3 >/dev/null 2>&1 \
  && ok "python3" "$(python3 -V | awk '{print $2}')" \
  || bad "python3 não encontrado" "necessário para as checagens abaixo"

# -----------------------------------------------------------------------------
section "Arquivos de ambiente"
# -----------------------------------------------------------------------------

API_VARS="SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY LLM_API_KEY LITELLM_MODEL
          LANGFUSE_PUBLIC_KEY LANGFUSE_SECRET_KEY LANGFUSE_HOST
          RESEND_API_KEY EMAIL_FROM EMAIL_ADMIN PIPELINE_SECRET"

if [ -f "$API_ENV" ]; then
  MISSING=""
  for v in $API_VARS; do
    [ -z "$(env_val "$API_ENV" "$v")" ] && MISSING="$MISSING $v"
  done
  if [ -z "$MISSING" ]; then
    ok "archi-api/.env" "as 11 variáveis obrigatórias estão preenchidas"
  else
    bad "archi-api/.env — variáveis vazias ou ausentes:" "$(echo $MISSING)"
  fi
else
  bad "archi-api/.env não existe" "rode: make setup"
fi

WEB_VARS="NEXT_PUBLIC_API_URL NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY"

if [ -f "$WEB_ENV" ]; then
  MISSING=""
  for v in $WEB_VARS; do
    [ -z "$(env_val "$WEB_ENV" "$v")" ] && MISSING="$MISSING $v"
  done
  if [ -z "$MISSING" ]; then
    ok "archi-web/.env.local" "as 3 variáveis obrigatórias estão preenchidas"
  else
    bad "archi-web/.env.local — variáveis vazias ou ausentes:" "$(echo $MISSING)"
  fi
else
  bad "archi-web/.env.local não existe" "rode: make setup"
fi

# As duas URLs do Supabase têm que apontar para o mesmo projeto.
A_URL="$(env_val "$API_ENV" SUPABASE_URL)"
W_URL="$(env_val "$WEB_ENV" NEXT_PUBLIC_SUPABASE_URL)"
if [ -n "$A_URL" ] && [ -n "$W_URL" ] && [ "$A_URL" != "$W_URL" ]; then
  bad "backend e frontend apontam para projetos Supabase diferentes" \
      "SUPABASE_URL e NEXT_PUBLIC_SUPABASE_URL têm que ser idênticas"
fi

# Armadilha silenciosa: o Next dá precedência ao .env.local e ignora o .env.
if [ -f "$ROOT_DIR/archi-web/.env" ]; then
  warn "archi-web/.env existe além do .env.local" \
       "o Next ignora este arquivo em silêncio — apague para não depurar o valor errado"
fi

# Chave secreta jamais pode estar exposta no frontend.
if [ -n "$(env_val "$WEB_ENV" NEXT_PUBLIC_SUPABASE_ANON_KEY)" ]; then
  case "$(env_val "$WEB_ENV" NEXT_PUBLIC_SUPABASE_ANON_KEY)" in
    sb_secret_*|*service_role*)
      bad "NEXT_PUBLIC_SUPABASE_ANON_KEY parece ser a chave SECRETA" \
          "ela vai para o bundle do navegador — use a anon/publishable" ;;
  esac
fi

# WeasyPrint no macOS precisa das libs do Homebrew para gerar o PDF.
if [ "$(uname)" = "Darwin" ] && [ -f "$API_ENV" ]; then
  [ -z "$(env_val "$API_ENV" DYLD_LIBRARY_PATH)" ] \
    && warn "DYLD_LIBRARY_PATH não definida em archi-api/.env" \
            "no macOS o WeasyPrint precisa dela para gerar PDF fora do Docker (brew install pango)"
fi

# -----------------------------------------------------------------------------
section "Supabase"
# -----------------------------------------------------------------------------

SB_URL="$A_URL"
SB_KEY="$(env_val "$API_ENV" SUPABASE_SERVICE_ROLE_KEY)"

if [ -z "$SB_URL" ] || [ -z "$SB_KEY" ]; then
  skip "sem SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY — checagens puladas"
else
  # -E: o sed do BSD/macOS não entende \? em regex básica
  SB_HOST="$(echo "$SB_URL" | sed -E 's|^https?://||; s|/.*||')"

  if ! host "$SB_HOST" >/dev/null 2>&1 && ! nslookup "$SB_HOST" >/dev/null 2>&1; then
    bad "o projeto Supabase não existe (DNS não resolve $SB_HOST)" \
        "projeto deletado ou URL errada — crie um novo e rode archi-api/db/schema.sql"
  else
    SB_AUTH=(-H "apikey: $SB_KEY" -H "Authorization: Bearer $SB_KEY")

    TABLES_OK=1; TABLES_BAD=""
    for t in access_codes sessions messages proposals notifications; do
      code=$(curl -s -o /dev/null -w "%{http_code}" -m 20 \
        "$SB_URL/rest/v1/$t?select=*&limit=1" "${SB_AUTH[@]}")
      case "$code" in
        200) ;;
        401|403) TABLES_OK=0; TABLES_BAD="auth";  break ;;
        *)       TABLES_OK=0; TABLES_BAD="$TABLES_BAD $t" ;;
      esac
    done

    if [ "$TABLES_BAD" = "auth" ]; then
      bad "a SUPABASE_SERVICE_ROLE_KEY foi recusada" "copie a Secret key em Settings → API"
    elif [ "$TABLES_OK" = "1" ]; then
      ok "banco" "as 5 tabelas respondem"
    else
      bad "tabelas ausentes:$TABLES_BAD" \
          "rode archi-api/db/schema.sql no SQL Editor do Supabase"
    fi

    code=$(curl -s -o /dev/null -w "%{http_code}" -m 20 \
      "$SB_URL/storage/v1/bucket/proposals" "${SB_AUTH[@]}")
    case "$code" in
      200) ok "storage" "bucket 'proposals' existe" ;;
      404) bad "o bucket 'proposals' não existe" \
               "Storage → New bucket → nome exatamente 'proposals', marcado como Public" ;;
      *)   bad "não deu para checar o bucket (HTTP $code)" ;;
    esac
  fi
fi

# -----------------------------------------------------------------------------
section "LangFuse"
# -----------------------------------------------------------------------------

LF_HOST="$(env_val "$API_ENV" LANGFUSE_HOST)"
LF_PK="$(env_val "$API_ENV" LANGFUSE_PUBLIC_KEY)"
LF_SK="$(env_val "$API_ENV" LANGFUSE_SECRET_KEY)"

if [ -z "$LF_HOST" ] || [ -z "$LF_PK" ] || [ -z "$LF_SK" ]; then
  skip "sem chaves do LangFuse — checagens puladas"
else
  BODY=$(curl -s -m 25 -w $'\n%{http_code}' "$LF_HOST/api/public/v2/prompts?limit=100" -u "$LF_PK:$LF_SK")
  CODE=$(printf '%s' "$BODY" | tail -1)
  JSON=$(printf '%s' "$BODY" | sed '$d')

  if [ "$CODE" != "200" ]; then
    bad "as chaves do LangFuse foram recusadas (HTTP $CODE)" \
        "confira LANGFUSE_PUBLIC_KEY / LANGFUSE_SECRET_KEY em $LF_HOST"
  else
    ok "chaves" "$LF_HOST"
    FOUND=$(printf '%s' "$JSON" | python3 -c '
import json,sys
want={"agent-discovery-interview","agent-discovery-generator",
      "agent-pricing","agent-phases","agent-proposal-generator"}
try: have={p.get("name") for p in json.load(sys.stdin).get("data",[])}
except Exception: print("ERR"); raise SystemExit
missing=sorted(want-have)
print("OK" if not missing else " ".join(missing))
' 2>/dev/null)
    if [ "$FOUND" = "OK" ]; then
      ok "prompts" "os 5 agentes estão publicados"
    elif [ "$FOUND" = "ERR" ] || [ -z "$FOUND" ]; then
      warn "não deu para ler a lista de prompts do LangFuse"
    else
      bad "prompts não publicados: $FOUND" "rode: make sync-prompts"
    fi
  fi
fi

# Sem LangFuse a API ainda sobe se houver cache local.
if [ -f "$ROOT_DIR/archi-api/prompts_cache.json" ]; then
  ok "cache local" "prompts_cache.json presente (fallback se o LangFuse cair)"
else
  warn "prompts_cache.json não existe" \
       "a API só sobe com o LangFuse acessível até o primeiro fetch bem-sucedido"
fi

# -----------------------------------------------------------------------------
section "Provider LLM"
# -----------------------------------------------------------------------------

MODEL="$(env_val "$API_ENV" LITELLM_MODEL)"
LLM_KEY="$(env_val "$API_ENV" LLM_API_KEY)"

if [ -z "$LLM_KEY" ] || [ -z "$MODEL" ]; then
  skip "sem LITELLM_MODEL/LLM_API_KEY — checagens puladas"
else
  case "$MODEL" in
    openrouter/*)
      code=$(curl -s -o /dev/null -w "%{http_code}" -m 20 \
        https://openrouter.ai/api/v1/key -H "Authorization: Bearer $LLM_KEY")
      [ "$code" = "200" ] \
        && ok "OpenRouter" "chave válida — $MODEL" \
        || bad "a chave do OpenRouter foi recusada (HTTP $code)" "gere outra em openrouter.ai → Keys"
      ;;
    groq/*)
      code=$(curl -s -o /dev/null -w "%{http_code}" -m 20 \
        https://api.groq.com/openai/v1/models -H "Authorization: Bearer $LLM_KEY")
      [ "$code" = "200" ] \
        && ok "Groq" "chave válida — $MODEL" \
        || bad "a chave do Groq foi recusada (HTTP $code)"
      ;;
    *)
      skip "provider '$MODEL' sem checagem automática — validado na primeira chamada"
      ;;
  esac
fi

# -----------------------------------------------------------------------------
section "Resend"
# -----------------------------------------------------------------------------

RS_KEY="$(env_val "$API_ENV" RESEND_API_KEY)"
RS_FROM="$(env_val "$API_ENV" EMAIL_FROM)"

if [ -z "$RS_KEY" ]; then
  skip "sem RESEND_API_KEY — checagens puladas"
else
  # POST com corpo vazio: a validação rejeita antes de enviar qualquer email.
  # 422 = autenticou e caiu na validação (chave boa). GET /domains daria 401
  # para chaves "sending only", que funcionam perfeitamente — falso negativo.
  code=$(curl -s -o /dev/null -w "%{http_code}" -m 20 -X POST https://api.resend.com/emails \
    -H "Authorization: Bearer $RS_KEY" -H "Content-Type: application/json" -d '{}')
  case "$code" in
    422|200) ok "Resend" "chave válida" ;;
    401|403) bad "a chave do Resend foi recusada (HTTP $code)" "gere outra em resend.com → API Keys" ;;
    *)       warn "não deu para validar a chave do Resend (HTTP $code)" ;;
  esac

  case "$RS_FROM" in
    *@resend.dev)
      warn "EMAIL_FROM=$RS_FROM é o sandbox do Resend" \
           "só entrega para o email dono da conta — verifique um domínio para enviar a clientes" ;;
  esac
fi

# -----------------------------------------------------------------------------
# Resumo
# -----------------------------------------------------------------------------

echo ""
if [ "$FAIL" -eq 0 ] && [ "$WARN" -eq 0 ]; then
  echo -e "${GREEN}${BOLD}Tudo pronto.${NC} $PASS checagens passaram. Suba com: make dev"
elif [ "$FAIL" -eq 0 ]; then
  echo -e "${GREEN}${BOLD}Pronto para rodar.${NC} $PASS ok, ${YELLOW}$WARN aviso(s)${NC} — nada impeditivo."
else
  echo -e "${RED}${BOLD}$FAIL problema(s)${NC} — $PASS ok, $WARN aviso(s)."
  echo -e "${DIM}Passo a passo do setup: docs/setup/prerequisites.md${NC}"
fi
echo ""

[ "$FAIL" -eq 0 ]
