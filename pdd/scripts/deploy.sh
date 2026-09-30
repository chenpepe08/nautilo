#!/usr/bin/env bash
# Deploy pdd/dist to pdd.aiflaps.com (nginx + optional certbot).
# Loads credentials from Project store secrets.env — never commit that file.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SECRETS="${PDD_SECRETS_FILE:-/cursor/stores/bc-d23f8fc1-9bbc-4ad1-8e69-79ada30d4152/internal/secrets.env}"

if [[ ! -f "$SECRETS" ]]; then
  echo "Missing secrets file: $SECRETS" >&2
  exit 1
fi

# shellcheck disable=SC1090
set -a
# shellcheck source=/dev/null
source "$SECRETS"
set +a

: "${SSH_HOST:?}"
: "${SSH_USER:?}"
: "${SSH_PASSWORD:?}"
SITE_DOMAIN="${SITE_DOMAIN:-pdd.aiflaps.com}"
REMOTE_HOME_DIR="\$HOME/domains/${SITE_DOMAIN}/public_html"
REMOTE_WWW="/var/www/${SITE_DOMAIN}"

cd "$ROOT"
npm run build

if ! command -v sshpass >/dev/null 2>&1; then
  sudo apt-get update -qq && sudo apt-get install -y -qq sshpass >/dev/null
fi

export SSHPASS="$SSH_PASSWORD"
SSH=(sshpass -e ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=20)
SCP=(sshpass -e scp -o StrictHostKeyChecking=accept-new -o ConnectTimeout=20)

echo "==> Upload to home staging"
"${SSH[@]}" "${SSH_USER}@${SSH_HOST}" "mkdir -p domains/${SITE_DOMAIN}/public_html"
"${SCP[@]}" -r "$ROOT/dist/"* "${SSH_USER}@${SSH_HOST}:domains/${SITE_DOMAIN}/public_html/"

echo "==> Install under /var/www + nginx (sudo)"
"${SSH[@]}" "${SSH_USER}@${SSH_HOST}" bash -s <<EOF
set -euo pipefail
PASS='${SSH_PASSWORD}'
SITE='${SITE_DOMAIN}'
WWW='/var/www/${SITE_DOMAIN}'
STAGE="\$HOME/domains/${SITE_DOMAIN}/public_html"
echo "\$PASS" | sudo -S mkdir -p "\$WWW"
echo "\$PASS" | sudo -S cp -a "\$STAGE/." "\$WWW/"
echo "\$PASS" | sudo -S chown -R www-data:www-data "\$WWW"
echo "\$PASS" | sudo -S tee /etc/nginx/sites-available/"\$SITE" >/dev/null <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name \$SITE;
    root \$WWW;
    index index.html;
    location / {
        try_files \\\$uri \\\$uri/ /index.html;
    }
}
NGINX
echo "\$PASS" | sudo -S ln -sfn /etc/nginx/sites-available/"\$SITE" /etc/nginx/sites-enabled/"\$SITE"
echo "\$PASS" | sudo -S nginx -t
echo "\$PASS" | sudo -S systemctl reload nginx
if command -v certbot >/dev/null 2>&1; then
  echo "\$PASS" | sudo -S certbot --nginx -d "\$SITE" --non-interactive --agree-tos --register-unsafely-without-email --redirect || true
fi
EOF

echo "Deployed https://${SITE_DOMAIN}"
