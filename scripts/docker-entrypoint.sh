#!/bin/sh
set -eu

if [ -n "${DB_PASSWORD_FILE:-}" ]; then
  DB_PASSWORD="$(cat "$DB_PASSWORD_FILE")"
  export DB_PASSWORD
fi
if [ -n "${APP_ENCRYPTION_KEY_FILE:-}" ]; then
  APP_ENCRYPTION_KEY="$(cat "$APP_ENCRYPTION_KEY_FILE")"
  export APP_ENCRYPTION_KEY
fi
exec "$@"
