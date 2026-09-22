#!/bin/sh
set -eu

APP_DIR=/var/www/gigxomi-app
secret=$(sed -n 's/^CRON_SECRET=//p' "$APP_DIR/.env" | tail -n 1)
[ -n "$secret" ] || exit 1

curl -fsS --max-time 120 \
  -H "Authorization: Bearer $secret" \
  http://127.0.0.1:3000/api/cron/connected-drip-campaigns \
  >/dev/null
