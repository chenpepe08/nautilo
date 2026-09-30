#!/usr/bin/env bash
# Deploy pdd/dist to the SSH host for pdd.aiflaps.com.
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
source "$SECRETS"
set +a

: "${SSH_HOST:?}"
: "${SSH_USER:?}"
: "${SSH_PASSWORD:?}"
SITE_DOMAIN="${SITE_DOMAIN:-pdd.aiflaps.com}"
REMOTE_DIR="${REMOTE_DIR:-/var/www/pdd}"

cd "$ROOT"
npm run build

if ! command -v sshpass >/dev/null 2>&1; then
  sudo apt-get update -qq && sudo apt-get install -y -qq sshpass >/dev/null
fi

export SSHPASS="$SSH_PASSWORD"
SSH=(sshpass -e ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=20)
SCP=(sshpass -e scp -o StrictHostKeyChecking=accept-new -o ConnectTimeout=20)

echo "==> Ensuring remote dir $REMOTE_DIR"
"${SSH[@]}" "${SSH_USER}@${SSH_HOST}" "mkdir -p '$REMOTE_DIR' && chmod u+rwx '$REMOTE_DIR' || true"

echo "==> Uploading dist"
"${SCP[@]}" -r "$ROOT/dist/"* "${SSH_USER}@${SSH_HOST}:${REMOTE_DIR}/"

echo "==> Writing nginx site snippet (best-effort)"
"${SSH[@]}" "${SSH_USER}@${SSH_HOST}" bash -s <<EOF
set -e
SITE='${SITE_DOMAIN}'
DIR='${REMOTE_DIR}'
if command -v nginx >/dev/null 2>&1 && [[ -w /etc/nginx/sites-available || -d /etc/nginx/conf.d ]]; then
  CONF_DIR=/etc/nginx/conf.d
  [[ -d /etc/nginx/sites-available ]] && CONF_DIR=/etc/nginx/sites-available
  cat > /tmp/pdd.nginx.conf <<NGINX
server {
  listen 80;
  server_name \${SITE};
  root \${DIR};
  index index.html;
  location / {
    try_files \\\$uri \\\$uri/ /index.html;
  }
}
NGINX
  if [[ -w "\$CONF_DIR" ]]; then
    cp /tmp/pdd.nginx.conf "\$CONF_DIR/pdd.conf"
    nginx -t && (systemctl reload nginx || service nginx reload || true)
  else
    echo "No write access to \$CONF_DIR — left config at /tmp/pdd.nginx.conf"
  fi
else
  echo "nginx not available or not writable; files uploaded to \$DIR"
fi

# Try certbot if root-ish
if command -v certbot >/dev/null 2>&1; then
  certbot --nginx -d "\$SITE" --non-interactive --agree-tos -m admin@\${SITE} --redirect || true
fi
EOF

echo "Deploy finished for https://${SITE_DOMAIN} (HTTP maybe only if certbot skipped)"
