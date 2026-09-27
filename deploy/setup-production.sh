#!/usr/bin/env bash
# Production setup: PM2 (frontend :8080 + API :8787) and optional Nginx routing.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Building frontend (same-origin /api paths)"
VITE_API_BASE_URL= npm run build

echo "==> Starting PM2 processes (API :8787, frontend :8080 with SPA fallback)"
pm2 delete serve 2>/dev/null || true
pm2 startOrRestart ecosystem.config.cjs
pm2 save

echo "==> Local validation"
echo "App root (expect 302 redirect to /web/):"
curl -sS -i http://127.0.0.1:8080/ | head -5
echo ""
echo "Login route (expect 200 text/html, NOT 404):"
curl -sS -i http://127.0.0.1:8080/web/login | head -8
echo ""
echo "API health (expect JSON on :8787, or via Nginx /api/):"
curl -sS -i http://127.0.0.1:8787/api/health | head -8

echo ""
echo "==> Next: configure Nginx (see deploy/nginx/educore.conf)"
echo "    sudo cp deploy/nginx/educore.conf /etc/nginx/sites-available/educore"
echo "    sudo ln -sf /etc/nginx/sites-available/educore /etc/nginx/sites-enabled/educore"
echo "    sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "    Then verify via your public domain:"
echo "    curl -i https://YOUR_DOMAIN/api/auth/me   # must be JSON, not HTML"
