#!/bin/bash
# ============================================================
# CPANEL FIRST-TIME SETUP
# Usage: npm run cpanel-setup
#
# Structure on server (CloudLinux compatible):
#   tracyboutique/
#     server.js        ← wrapper (CloudLinux runs this)
#     package.json     ← minimal, no deps
#     node_modules/    ← symlink managed by CloudLinux
#     app/             ← full Next.js standalone output
#       server.js      ← real Next.js server
#       node_modules/  ← bundled runtime deps
#       .next/
#       public/
#       .env
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
  echo -e "${R}This client is not configured for cPanel deployment.${N}"
  exit 1
fi

echo ""
echo -e "${B}══════════════════════════════════════════════════════${N}"
echo -e "${B}  CPANEL FIRST-TIME DEPLOY — ${CLIENT_NAME}${N}"
echo -e "${B}══════════════════════════════════════════════════════${N}"
echo ""

SSH_OPTS="-i ~/.ssh/tracyboutique -o StrictHostKeyChecking=no"

# ── STEP 1: Build ─────────────────────────────────────────────
echo -e "${Y}[1/4] Building Next.js (standalone mode)...${N}"
rm -rf .next
DEPLOY_TARGET=cpanel npm run build
echo -e "${G}✓ Build complete${N}"
echo ""

# ── STEP 2: Prepare upload package ────────────────────────────
echo -e "${Y}[2/4] Preparing upload package...${N}"
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
cp .env.local .next/standalone/.env
echo -e "${G}✓ Package ready${N}"
echo ""

# ── STEP 3: Upload to app/ subdirectory ───────────────────────
echo -e "${Y}[3/4] Uploading to ${SSH_HOST}...${N}"

COPYFILE_DISABLE=1 tar -czf /tmp/deploy-tracyboutique.tar.gz -C .next/standalone .

scp -P ${SSH_PORT} ${SSH_OPTS} /tmp/deploy-tracyboutique.tar.gz \
  "${SSH_USER}@${SSH_HOST}:/tmp/deploy-tracyboutique.tar.gz"

# Extract into app/ subdir, create root wrapper files
ssh -p ${SSH_PORT} ${SSH_OPTS} "${SSH_USER}@${SSH_HOST}" "
  rm -rf ${CPANEL_APP_ROOT}/app &&
  mkdir -p ${CPANEL_APP_ROOT}/app &&
  cd ${CPANEL_APP_ROOT}/app &&
  tar -xzf /tmp/deploy-tracyboutique.tar.gz &&
  rm /tmp/deploy-tracyboutique.tar.gz &&
  echo 'require(\"./app/server.js\")' > ${CPANEL_APP_ROOT}/server.js &&
  printf '{\"name\":\"tracyboutique\",\"version\":\"1.0.0\",\"scripts\":{\"start\":\"node server.js\"}}' > ${CPANEL_APP_ROOT}/package.json
"

rm /tmp/deploy-tracyboutique.tar.gz
echo -e "${G}✓ Upload complete${N}"
echo ""

# ── STEP 4: Done ──────────────────────────────────────────────
echo -e "${Y}[4/4] In cPanel → Setup Node.js App → ${CPANEL_DOMAIN}:${N}"
echo -e "  1. Click ${Y}Run NPM Install${N}  (creates CloudLinux symlink)"
echo -e "  2. Click ${Y}Start App${N}"
echo ""
echo -e "${G}══════════════════════════════════════════════════════${N}"
echo -e "${G}  ${CLIENT_NAME} deployed!${N}"
echo -e "${G}  URL: https://${CPANEL_DOMAIN}${N}"
echo -e "${G}══════════════════════════════════════════════════════${N}"
echo ""
echo -e "${B}Future deploys:${N} npm run cpanel-deploy"
echo ""
