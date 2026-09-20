#!/bin/bash
# ============================================================
# DEPLOY TO VERCEL
# Usage: npm run deploy
#
# Run "npm run switch [clientname]" first.
# First time per client: run "npm run vercel-setup" instead.
# ============================================================

G='\033[0;32m'
Y='\033[1;33m'
R='\033[0;31m'
B='\033[0;34m'
N='\033[0m'

# ── Check active client ───────────────────────────────────────
if [[ ! -f ".active-client" ]]; then
  echo -e "${R}No active client. Run: npm run switch [clientname]${N}"
  exit 1
fi

CLIENT=$(cat .active-client)
ENV_FILE=".env.clients/${CLIENT}.env"
CLIENT_NAME=$(grep '^CLIENT_NAME=' "$ENV_FILE" | cut -d'=' -f2- | tr -d '"')
SITE_URL=$(grep '^SITE_URL=' "$ENV_FILE" | cut -d'=' -f2- | tr -d '"')

# ── Check Vercel project is linked ────────────────────────────
if [[ ! -f ".vercel/project.json" ]]; then
  echo -e "${R}No Vercel project linked for '${CLIENT}'.${N}"
  echo -e "Run first: ${Y}npm run vercel-setup${N}"
  exit 1
fi

# ── Confirm ───────────────────────────────────────────────────
echo ""
echo -e "${Y}════════════════════════════════════════${N}"
echo -e "${Y}  DEPLOYING: ${CLIENT_NAME:-$CLIENT}${N}"
echo -e "${Y}  To Vercel project: store-${CLIENT}${N}"
echo -e "${Y}════════════════════════════════════════${N}"
echo ""
read -p "Continue? (y/N) " CONFIRM
[[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]] && echo "Cancelled." && exit 0
echo ""

# ── Deploy ────────────────────────────────────────────────────
echo -e "${B}Deploying to Vercel...${N}"
vercel --prod --yes

echo ""
echo -e "${G}════════════════════════════════════════${N}"
echo -e "${G}  Live: ${SITE_URL}${N}"
echo -e "${G}  (if domain not connected yet, check Vercel dashboard for the .vercel.app URL)${N}"
echo -e "${G}════════════════════════════════════════${N}"
echo ""
