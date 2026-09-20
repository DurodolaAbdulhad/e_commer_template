#!/bin/bash
# ============================================================
# NEW CLIENT SETUP
# Usage: npm run new-client
#
# Creates two files:
#   config/clients/[slug].js      — brand, colors, contact info
#   .env.clients/[slug].env       — all secrets and API keys
#
# Run this AFTER you have:
#   1. Created a Supabase project and run schema.sql + rls.sql + seed.sql
#   2. Got the client's Paystack or Flutterwave API keys (optional — can add later)
#   Note: Deploys to Vercel — no SSH/cPanel needed
# ============================================================

set -e

G='\033[0;32m'
Y='\033[1;33m'
R='\033[0;31m'
B='\033[0;34m'
C='\033[0;36m'
N='\033[0m'

ask() {
  local prompt="$1"
  local default="$2"
  local result
  if [[ -n "$default" ]]; then
    read -p "$(echo -e "${C}${prompt}${N} [${default}]: ")" result
    echo "${result:-$default}"
  else
    read -p "$(echo -e "${C}${prompt}${N}: ")" result
    echo "$result"
  fi
}

ask_secret() {
  local prompt="$1"
  local result
  read -s -p "$(echo -e "${C}${prompt}${N}: ")" result
  echo ""
  echo "$result"
}

echo ""
echo -e "${B}══════════════════════════════════════════════════════${N}"
echo -e "${B}  NEW CLIENT STORE SETUP${N}"
echo -e "${B}══════════════════════════════════════════════════════${N}"
echo ""
echo -e "${Y}Have ready before starting:${N}"
echo "  • Client name, domain, contact details"
echo "  • Supabase project URL + Anon Key + Service Role Key (optional — can add later)"
echo "  • Paystack or Flutterwave API keys (optional — can add later)"
echo "  • Vercel account: already logged in (npm install -g vercel && vercel login)"
echo ""
read -p "Press Enter to continue..."
echo ""

# ── SECTION 1: IDENTITY ──────────────────────────────────────
echo -e "${B}── Store Identity ──────────────────────────────────────${N}"
SLUG=$(ask "Client slug (no spaces, e.g. techmart)")
if [[ -z "$SLUG" ]]; then echo -e "${R}Slug cannot be empty.${N}"; exit 1; fi
if [[ -f "config/clients/${SLUG}.js" ]]; then
  echo -e "${R}Client '${SLUG}' already exists. Edit config/clients/${SLUG}.js directly.${N}"
  exit 1
fi

STORE_NAME=$(ask "Store display name (e.g. Tech Mart Nigeria)")
TAGLINE=$(ask "Store tagline (e.g. Best prices in Lagos)")
echo ""
echo -e "${C}Industry options:${N} electronics | fashion | grocery | beauty | furniture | general"
INDUSTRY=$(ask "Industry" "general")
PAYMENT=$(ask "Payment gateway — paystack or flutterwave" "paystack")

# ── SECTION 2: CONTACT ───────────────────────────────────────
echo ""
echo -e "${B}── Contact & Location ───────────────────────────────────${N}"
DOMAIN=$(ask "Domain (e.g. techmart.com.ng)")
EMAIL=$(ask "Store email" "hello@${DOMAIN}")
PHONE=$(ask "Phone number (e.g. +234 800 123 4567)")
WHATSAPP=$(ask "WhatsApp number — digits only (e.g. 2348001234567)")
ADDRESS=$(ask "City / address (e.g. Victoria Island, Lagos)")

# ── SECTION 3: BRAND COLORS ──────────────────────────────────
echo ""
echo -e "${B}── Brand Colors ─────────────────────────────────────────${N}"
echo -e "${Y}Leave blank to use the default dark store palette.${N}"
PRIMARY=$(ask "Primary color hex (header/nav background)" "#222222")
SECONDARY=$(ask "Secondary color hex (buttons, prices, badges)" "#22C55E")
ACCENT=$(ask "Accent color hex (highlights, promo labels)" "#F5A623")

# ── SECTION 4: SOCIAL MEDIA ──────────────────────────────────
echo ""
echo -e "${B}── Social Media (press Enter to skip any) ───────────────${N}"
INSTAGRAM=$(ask "Instagram handle (without @)" "")
FACEBOOK=$(ask "Facebook page name" "")
TWITTER=$(ask "Twitter/X handle (without @)" "")
YOUTUBE=$(ask "YouTube channel name" "")

# ── SECTION 5: SUPABASE ──────────────────────────────────────
echo ""
echo -e "${B}── Supabase (OPTIONAL — press Enter to skip, add later) ────${N}"
echo -e "${Y}Each client needs their OWN Supabase project (never share between clients).${N}"
echo -e "${Y}From: supabase.com → New Project → Settings → API${N}"
echo -e "${Y}Remember to run schema.sql → rls.sql → seed.sql in the SQL editor first.${N}"
SUPA_URL=$(ask "Project URL (https://xxxx.supabase.co) or Enter to skip" "")
if [[ -n "$SUPA_URL" ]]; then
  SUPA_ANON=$(ask "Anon (public) key")
  SUPA_SERVICE=$(ask "Service role key (secret — never expose publicly)")
else
  SUPA_ANON=""
  SUPA_SERVICE=""
fi

# ── SECTION 6: PAYMENT KEYS (optional) ───────────────────────
echo ""
echo -e "${B}── Payment Keys (OPTIONAL — press Enter to skip, add later) ─${N}"
echo -e "${Y}Store works without this. Only checkout won't work until keys are added.${N}"
echo -e "${Y}To add later: edit .env.clients/${SLUG}.env then npm run switch + deploy.${N}"
echo ""
PSK_PUBLIC=""
PSK_SECRET=""
FLW_PUBLIC=""
FLW_SECRET=""
FLW_WEBHOOK=""
if [[ "$PAYMENT" == "flutterwave" ]]; then
  echo -e "${Y}From: dashboard.flutterwave.com → Settings → API Keys${N}"
  FLW_PUBLIC=$(ask "Public key (FLWPUBK-...) or Enter to skip" "")
  if [[ -n "$FLW_PUBLIC" ]]; then
    FLW_SECRET=$(ask_secret "Secret key (FLWSECK-...)")
    FLW_WEBHOOK=$(ask "Webhook secret (you choose this string, paste it in Flutterwave dashboard too)" "")
  fi
else
  echo -e "${Y}From: dashboard.paystack.com → Settings → API Keys & Webhooks${N}"
  PSK_PUBLIC=$(ask "Public key (pk_live_...) or Enter to skip" "")
  if [[ -n "$PSK_PUBLIC" ]]; then
    PSK_SECRET=$(ask_secret "Secret key (sk_live_...)")
  fi
fi

# ── SECTION 7: EMAIL (optional) ───────────────────────────────
echo ""
echo -e "${B}── Email / Resend (OPTIONAL — press Enter to skip, add later) ─${N}"
echo -e "${Y}Without this: order confirmation emails won't send. Everything else works.${N}"
echo -e "${Y}From: resend.com → API Keys (one account serves all clients)${N}"
RESEND_KEY=$(ask "Resend API key (re_...) or Enter to skip" "")
FROM_EMAIL=$(ask "Order confirmation from-address" "orders@${DOMAIN}")

# ── SECTION 8: ANALYTICS (optional) ─────────────────────────
echo ""
echo -e "${B}── Analytics (optional — press Enter to skip) ───────────${N}"
META_PIXEL=$(ask "Meta Pixel ID (Facebook ads)" "")
GA_ID=$(ask "Google Analytics 4 ID (G-XXXXXXX)" "")

# ── GENERATE SECRETS ─────────────────────────────────────────
echo ""
echo -e "${Y}Generating security secrets...${N}"
SECRET_SESSION=$(openssl rand -hex 32)
SECRET_CHECKOUT=$(openssl rand -hex 32)
SECRET_DOWNLOAD=$(openssl rand -hex 32)
SECRET_INTERNAL=$(openssl rand -hex 32)
ADMIN_PASS=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 20)

# ── WRITE config/clients/[slug].js ───────────────────────────
mkdir -p config/clients
cat > "config/clients/${SLUG}.js" << CONFIGEOF
export const client = {
  name: "${STORE_NAME}",
  tagline: "${TAGLINE}",
  industry: "${INDUSTRY}",
  logo: "",
  logoHeight: 40,
  favicon: "/assets/favicon.ico",

  colors: {
    primary: "${PRIMARY}",
    secondary: "${SECONDARY}",
    accent: "${ACCENT}",
    background: "#FFFFFF",
    text: "#333333",
    textLight: "#777777",
  },

  fonts: {
    heading: "Bricolage Grotesque",
    body: "Poppins",
  },

  currency: "NGN",
  currencySymbol: "₦",
  phone: "${PHONE}",
  email: "${EMAIL}",
  address: "${ADDRESS}",
  whatsapp: "${WHATSAPP}",

  shipping: {
    flatRate: 2500,
    freeAbove: 50000,
    estimatedDays: "2–5 business days",
  },

  tax: {
    enabled: false,
    rate: 7.5,
    label: "VAT (7.5%)",
    inclusive: false,
  },

  wholesale: {
    enabled: false,
    tag: "wholesale",
    discountPercent: 15,
  },

  socials: {
    instagram: "${INSTAGRAM}",
    facebook: "${FACEBOOK}",
    twitter: "${TWITTER}",
    youtube: "${YOUTUBE}",
  },

  seo: {
    title: "${STORE_NAME} — Shop Online in Nigeria",
    description: "${TAGLINE}",
    ogImage: "/opengraph-image",
  },

  tracking: {
    metaPixelId: "${META_PIXEL}",
    googleTagId: "${GA_ID}",
    termiiSenderId: "$(echo "$STORE_NAME" | tr ' ' '' | cut -c1-11)",
  },

  paymentGateway: "${PAYMENT}",

  features: {
    wishlist: true,
    reviews: true,
    blog: true,
    whatsappChat: true,
    whatsappOrder: true,
    compare: false,
    newsletter: true,
    guestCheckout: true,
    googleAuth: false,
    digitalProducts: false,
    giftCards: true,
    bundles: true,
    abandonedCart: true,
    smsNotifications: false,
  },
}
CONFIGEOF

# ── WRITE .env.clients/[slug].env ────────────────────────────
mkdir -p .env.clients
cat > ".env.clients/${SLUG}.env" << ENVEOF
CLIENT_NAME="${STORE_NAME}"
SITE_URL="https://${DOMAIN}"
NEXT_PUBLIC_APP_URL="https://${DOMAIN}"

NEXT_PUBLIC_SUPABASE_URL=${SUPA_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPA_ANON}
SUPABASE_SERVICE_ROLE_KEY=${SUPA_SERVICE}

NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=${PSK_PUBLIC}
PAYSTACK_SECRET_KEY=${PSK_SECRET}

NEXT_PUBLIC_FLW_PUBLIC_KEY=${FLW_PUBLIC}
FLW_SECRET_KEY=${FLW_SECRET}
FLW_WEBHOOK_SECRET=${FLW_WEBHOOK}

ADMIN_PASSWORD=${ADMIN_PASS}
ADMIN_SESSION_SECRET=${SECRET_SESSION}
CHECKOUT_SECRET=${SECRET_CHECKOUT}
DOWNLOAD_TOKEN_SECRET=${SECRET_DOWNLOAD}
API_INTERNAL_SECRET=${SECRET_INTERNAL}

RESEND_API_KEY=${RESEND_KEY}
EMAIL_FROM=${FROM_EMAIL}

NEXT_PUBLIC_SITE_URL=https://${DOMAIN}
NEXT_PUBLIC_META_PIXEL_ID=${META_PIXEL}
NEXT_PUBLIC_GA_MEASUREMENT_ID=${GA_ID}

TERMII_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
ALLOWED_DOWNLOAD_HOSTS=
ENVEOF

# ── DONE ─────────────────────────────────────────────────────
echo ""
echo -e "${G}══════════════════════════════════════════════════════${N}"
echo -e "${G}  Client '${STORE_NAME}' is ready!${N}"
echo -e "${G}══════════════════════════════════════════════════════${N}"
echo ""
echo -e "  Admin password: ${Y}${ADMIN_PASS}${N}  ← save this now"
echo ""

# Show what's missing
MISSING=()
[[ -z "$SUPA_URL" ]]  && MISSING+=("Supabase  → add to .env.clients/${SLUG}.env  (store won't load without this)")
[[ -z "$PSK_PUBLIC" && -z "$FLW_PUBLIC" ]] && MISSING+=("Payment   → add to .env.clients/${SLUG}.env  (checkout disabled until added)")
[[ -z "$RESEND_KEY" ]] && MISSING+=("Resend    → add to .env.clients/${SLUG}.env  (order emails disabled until added)")

if [[ ${#MISSING[@]} -gt 0 ]]; then
  echo -e "${Y}Still needed before deploying:${N}"
  for item in "${MISSING[@]}"; do
    echo -e "  ${R}✗${N}  $item"
  done
  echo ""
  echo -e "  Edit with: ${G}open .env.clients/${SLUG}.env${N}"
  echo ""
fi

echo -e "${B}When ready — run in order:${N}"
echo ""
echo -e "  ${G}npm run switch ${SLUG}${N}        ← load this client"
echo -e "  ${G}npm run dev${N}                   ← preview locally first"
echo -e "  ${G}npm run vercel-setup${N}          ← first deploy to Vercel (once per client)"
echo -e "  ${G}npm run deploy${N}                ← all future deploys"
echo ""
if [[ -n "$PSK_PUBLIC" || -n "$FLW_PUBLIC" ]]; then
  echo -e "${B}Webhook URL to add in ${PAYMENT^} dashboard:${N}"
  if [[ "$PAYMENT" == "paystack" ]]; then
    echo -e "  https://${DOMAIN}/api/paystack/webhook"
  else
    echo -e "  https://${DOMAIN}/api/flutterwave/webhook"
  fi
  echo ""
fi
