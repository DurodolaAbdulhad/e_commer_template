#!/bin/bash
# ============================================================
# EDIT CLIENT SECRETS
# Usage: npm run edit-secrets [clientname]
# Example: npm run edit-secrets techmart
#
# Opens the client's .env file in your default text editor.
# After saving: npm run switch [clientname] && npm run deploy
# ============================================================

CLIENT="${1}"

if [[ -z "$CLIENT" ]]; then
  # Try active client if no argument given
  if [[ -f ".active-client" ]]; then
    CLIENT=$(cat .active-client)
    echo "No client specified — using active client: $CLIENT"
  else
    echo "Usage: npm run edit-secrets [clientname]"
    echo ""
    echo "Available clients:"
    for f in .env.clients/*.env; do
      name=$(basename "$f" .env)
      [[ "$name" == "example-client" ]] && continue
      echo "  → $name"
    done
    exit 1
  fi
fi

ENV_FILE=".env.clients/${CLIENT}.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "No secrets file found: $ENV_FILE"
  echo "Run: npm run new-client"
  exit 1
fi

# Open in default editor (VS Code if available, else TextEdit/nano)
if command -v code &>/dev/null; then
  code "$ENV_FILE"
elif command -v nano &>/dev/null; then
  nano "$ENV_FILE"
else
  open "$ENV_FILE"
fi

echo ""
echo "After saving your changes:"
echo "  npm run switch ${CLIENT} && npm run deploy"
echo ""
