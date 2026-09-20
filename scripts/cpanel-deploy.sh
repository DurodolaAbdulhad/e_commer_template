#!/bin/bash
# ============================================================
# CPANEL REDEPLOY
# Usage: npm run cpanel-deploy
# ============================================================

set -e

G='\033[0;32m'
Y='\033[1;33m'
R='\033[0;31m'
B='\033[0;34m'
N='\033[0m'

if [[ ! -f ".env.local" ]]; then
  echo -e "${R}No .env.local found. Run: npm run switch tracyboutique${N}"
  exit 1
fi

source .env.local

if [[ "$DEPLOY_TARGET" != "cpanel" ]]; then
  echo -e "${R}Current client is not a cPanel client.${N}"
  echo -e "Use ${Y}npm run deploy${N} for Vercel clients."
  exit 1
fi

SSH_OPTS="-i ~/.ssh/tracyboutique -o StrictHostKeyChecking=no"

echo ""
echo -e "${B}Deploying ${CLIENT_NAME} → cPanel${N}"
echo ""

echo -e "${Y}Building...${N}"
rm -rf .next
DEPLOY_TARGET=cpanel npm run build
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
cp .env.local .next/standalone/.env

echo -e "${Y}Packing and uploading...${N}"
COPYFILE_DISABLE=1 tar -czf /tmp/deploy-tracyboutique.tar.gz -C .next/standalone .
scp -P ${SSH_PORT} ${SSH_OPTS} /tmp/deploy-tracyboutique.tar.gz "${SSH_USER}@${SSH_HOST}:/tmp/deploy-tracyboutique.tar.gz"
ssh -p ${SSH_PORT} ${SSH_OPTS} "${SSH_USER}@${SSH_HOST}" "
  rm -rf ${CPANEL_APP_ROOT}/app &&
  mkdir -p ${CPANEL_APP_ROOT}/app &&
  cd ${CPANEL_APP_ROOT}/app &&
  tar -xzf /tmp/deploy-tracyboutique.tar.gz &&
  rm /tmp/deploy-tracyboutique.tar.gz
"
rm /tmp/deploy-tracyboutique.tar.gz

echo ""
echo -e "${G}✓ Done — restart the app in cPanel → Setup Node.js App → Restart${N}"
echo ""
