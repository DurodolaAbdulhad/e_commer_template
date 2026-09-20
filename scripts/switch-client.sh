#!/bin/bash
# ============================================================
# SWITCH CLIENT
# Usage: npm run switch [clientname]
# Example: npm run switch techmart
#
# What it does:
#   1. Copies config/clients/[clientname].js → config/client.js
#   2. Copies .env.clients/[clientname].env → .env.local
#   3. Saves the active client name for the deploy script
# ============================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

CLIENT="$1"

if [[ -z "$CLIENT" ]]; then
  echo ""
  echo -e "${RED}Error: No client name given.${NC}"
  echo ""
  echo "Usage:   npm run switch [clientname]"
  echo "Example: npm run switch techmart"
  echo ""
  echo "Available clients:"
  for f in config/clients/*.js; do
    name=$(basename "$f" .js)
    [[ "$name" == "example-client" ]] && continue
    echo "  → $name"
  done
  echo ""
  exit 1
fi

CONFIG_FILE="config/clients/${CLIENT}.js"
ENV_FILE=".env.clients/${CLIENT}.env"

if [[ ! -f "$CONFIG_FILE" ]]; then
  echo -e "${RED}Error: No config found at $CONFIG_FILE${NC}"
  echo "Create it by copying config/clients/example-client.js"
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo -e "${RED}Error: No secrets found at $ENV_FILE${NC}"
  echo "Create it by copying .env.clients/example-client.env"
  exit 1
fi

# ── Activate client ───────────────────────────────────────────
cp "$CONFIG_FILE" config/client.js
cp "$ENV_FILE" .env.local
echo "$CLIENT" > .active-client

# Swap Vercel project link if this client has been set up on Vercel
if [[ -f ".vercel-clients/${CLIENT}.json" ]]; then
  mkdir -p .vercel
  cp ".vercel-clients/${CLIENT}.json" .vercel/project.json
  VERCEL_STATUS="linked"
else
  rm -f .vercel/project.json
  VERCEL_STATUS="not set up yet"
fi

CLIENT_NAME=$(grep '^CLIENT_NAME=' "$ENV_FILE" | cut -d'=' -f2 | tr -d '"')
SITE_URL=$(grep '^SITE_URL=' "$ENV_FILE" | cut -d'=' -f2 | tr -d '"')

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}  Switched to: ${CLIENT_NAME:-$CLIENT}${NC}"
echo -e "${BLUE}  Domain:      ${SITE_URL:-not set}${NC}"
echo -e "${BLUE}  Vercel:      ${VERCEL_STATUS}${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
if [[ "$VERCEL_STATUS" == "not set up yet" ]]; then
  echo -e "  ${YELLOW}npm run vercel-setup${NC}  → first-time setup on Vercel"
else
  echo -e "  ${YELLOW}npm run dev${NC}           → preview locally"
  echo -e "  ${YELLOW}npm run deploy${NC}        → push live to Vercel"
fi
echo ""
