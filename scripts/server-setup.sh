#!/bin/bash
# ============================================================
# FIRST-TIME SERVER SETUP
# Usage: npm run server-setup
#
# Run this ONCE per cPanel server before the first deploy.
# Installs PM2 and creates the deploy directory.
# ============================================================

set -e

G='\033[0;32m'
Y='\033[1;33m'
R='\033[0;31m'
B='\033[0;34m'
N='\033[0m'

if [[ ! -f ".active-client" ]]; then
  echo -e "${R}No active client. Run: npm run switch [clientname]${N}"
  exit 1
fi

CLIENT=$(cat .active-client)
ENV_FILE=".env.clients/${CLIENT}.env"

SSH_HOST=$(grep    '^SSH_HOST='     "$ENV_FILE" | cut -d'=' -f2-)
SSH_USER=$(grep    '^SSH_USERNAME=' "$ENV_FILE" | cut -d'=' -f2-)
SSH_PASS=$(grep    '^SSH_PASSWORD=' "$ENV_FILE" | cut -d'=' -f2-)
DEPLOY_PATH=$(grep '^DEPLOY_PATH='  "$ENV_FILE" | cut -d'=' -f2-)
CLIENT_NAME=$(grep '^CLIENT_NAME='  "$ENV_FILE" | cut -d'=' -f2- | tr -d '"')

ssh_cmd() {
  if [[ -n "$SSH_PASS" ]] && command -v sshpass &>/dev/null; then
    sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "$@"
  else
    ssh -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "$@"
  fi
}

echo ""
echo -e "${B}════════════════════════════════════════${N}"
echo -e "${B}  SERVER SETUP: ${CLIENT_NAME}${N}"
echo -e "${B}  ${SSH_USER}@${SSH_HOST}${N}"
echo -e "${B}════════════════════════════════════════${N}"
echo ""

echo -e "${B}[1/3] Checking Node.js...${N}"
ssh_cmd "node --version && npm --version" || {
  echo -e "${R}Node.js not found on server.${N}"
  echo "Go to cPanel → Software → Setup Node.js App and install Node 20."
  exit 1
}

echo ""
echo -e "${B}[2/3] Installing PM2...${N}"
ssh_cmd "npm install -g pm2 2>/dev/null && pm2 --version"

echo ""
echo -e "${B}[3/3] Creating deploy directory...${N}"
ssh_cmd "mkdir -p '$DEPLOY_PATH'"

echo ""
echo -e "${G}════════════════════════════════════════${N}"
echo -e "${G}  Server ready for ${CLIENT_NAME}${N}"
echo -e "${G}════════════════════════════════════════${N}"
echo ""
echo -e "Run ${Y}npm run deploy${N} to push the store."
echo ""
