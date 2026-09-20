#!/bin/bash
# ============================================================
# FIRST-TIME VERCEL SETUP FOR A CLIENT
# Usage: npm run vercel-setup
#
# Run this ONCE per client, after "npm run switch [clientname]"
#
# What it does:
#   1. Creates a Vercel project named store-[clientname]
#   2. Uploads all environment variables to Vercel
#   3. Saves the project link for future deploys
#   4. Does the first deployment
#   5. Helps you connect their custom domain
# ============================================================

G='\033[0;32m'
Y='\033[1;33m'
R='\033[0;31m'
B='\033[0;34m'
C='\033[0;36m'
N='\033[0m'

# ── Check Vercel CLI installed ────────────────────────────────
if ! command -v vercel &>/dev/null; then
  echo -e "${R}Vercel CLI not installed.${N}"
  echo "Run: npm install -g vercel"
  echo "Then: vercel login"
  exit 1
fi

# ── Check logged in ───────────────────────────────────────────
if ! vercel whoami &>/dev/null; then
  echo -e "${Y}Not logged in to Vercel. Logging in now...${N}"
  vercel login
fi

# ── Check active client ───────────────────────────────────────
if [[ ! -f ".active-client" ]]; then
  echo -e "${R}No active client. Run: npm run switch [clientname]${N}"
  exit 1
fi

CLIENT=$(cat .active-client)
ENV_FILE=".env.clients/${CLIENT}.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo -e "${R}No secrets file: $ENV_FILE${N}"
  echo "Run: npm run new-client"
  exit 1
fi

CLIENT_NAME=$(grep '^CLIENT_NAME=' "$ENV_FILE" | cut -d'=' -f2- | tr -d '"')
SITE_URL=$(grep '^SITE_URL=' "$ENV_FILE" | cut -d'=' -f2- | tr -d '"')
DOMAIN=$(echo "$SITE_URL" | sed 's|https://||')

echo ""
echo -e "${B}════════════════════════════════════════════${N}"
echo -e "${B}  VERCEL FIRST-TIME SETUP${N}"
echo -e "${B}  Client: ${CLIENT_NAME}${N}"
echo -e "${B}  Domain: ${DOMAIN}${N}"
echo -e "${B}════════════════════════════════════════════${N}"
echo ""

# ── Step 1: Link/create Vercel project ───────────────────────
echo -e "${B}[1/4] Creating Vercel project: store-${CLIENT}...${N}"
echo ""

# Remove old link if any
rm -rf .vercel

# Link to project (creates it if it doesn't exist)
vercel link --project "store-${CLIENT}" --yes

# Save this project's link for future switches
mkdir -p .vercel-clients
cp .vercel/project.json ".vercel-clients/${CLIENT}.json"
echo -e "${G}✓ Project linked and saved${N}"
echo ""

# ── Step 2: Upload env vars to Vercel ────────────────────────
echo -e "${B}[2/4] Uploading environment variables...${N}"
echo -e "${Y}(This takes a moment — uploading each variable to Vercel)${N}"
echo ""

# Read .env.local (already populated by npm run switch)
SKIP_KEYS="CLIENT_NAME|SITE_URL|SSH_HOST|SSH_USERNAME|SSH_PASSWORD|DEPLOY_PATH"

upload_count=0
fail_count=0

while IFS= read -r line; do
  # Skip comments, empty lines, and local-only keys
  [[ "$line" =~ ^#.*$ || -z "$line" ]] && continue
  [[ "$line" =~ ^($SKIP_KEYS)= ]] && continue

  KEY="${line%%=*}"
  VALUE="${line#*=}"

  # Skip empty values
  [[ -z "$VALUE" ]] && continue

  # Upload to Vercel (production environment)
  if echo "$VALUE" | vercel env add "$KEY" production --yes 2>/dev/null; then
    echo -e "  ${G}✓${N} $KEY"
    ((upload_count++))
  else
    # Already exists — try to remove and re-add
    vercel env rm "$KEY" production --yes 2>/dev/null || true
    if echo "$VALUE" | vercel env add "$KEY" production --yes 2>/dev/null; then
      echo -e "  ${G}↻${N} $KEY (updated)"
      ((upload_count++))
    else
      echo -e "  ${Y}!${N} $KEY (add manually in Vercel dashboard)"
      ((fail_count++))
    fi
  fi
done < .env.local

echo ""
echo -e "${G}✓ ${upload_count} variables uploaded${N}"
if [[ $fail_count -gt 0 ]]; then
  echo -e "${Y}! ${fail_count} variables need manual entry in Vercel dashboard → Settings → Environment Variables${N}"
fi
echo ""

# ── Step 3: First deployment ──────────────────────────────────
echo -e "${B}[3/4] First deployment...${N}"
vercel --prod --yes
echo ""

# ── Step 4: Connect custom domain ────────────────────────────
echo -e "${B}[4/4] Connect custom domain${N}"
echo ""
echo -e "Domain to connect: ${C}${DOMAIN}${N}"
echo ""

# Try to add domain automatically
if vercel domains add "$DOMAIN" 2>/dev/null; then
  echo -e "${G}✓ Domain added to Vercel${N}"
else
  echo -e "${Y}Add domain manually in Vercel dashboard → Project → Settings → Domains${N}"
fi

echo ""
echo -e "${Y}In your cPanel (Zone Editor), add this DNS record:${N}"
echo ""
echo -e "  Type:  ${C}CNAME${N}"
echo -e "  Name:  ${C}$(echo $DOMAIN | cut -d. -f1)${N}   (the subdomain part)"
echo -e "  Value: ${C}cname.vercel-dns.com${N}"
echo ""
echo -e "${B}════════════════════════════════════════════${N}"
echo -e "${G}  Setup complete for ${CLIENT_NAME}!${N}"
echo -e "${B}════════════════════════════════════════════${N}"
echo ""
echo -e "Future deploys: ${G}npm run switch ${CLIENT} && npm run deploy${N}"
echo ""
