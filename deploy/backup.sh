#!/usr/bin/env bash
set -euo pipefail
umask 077
APP_DIR="${APP_DIR:-/srv/apps/n7cosmetics}"
cd "$APP_DIR"
mkdir -p backups
exec 8>backups/.backup.lock
flock -w 120 8
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
destination="$APP_DIR/backups/$stamp"
mkdir "$destination"
docker exec n7-db sh -c 'MYSQL_PWD="$(cat /run/secrets/db_root_password)" exec mariadb-dump -uroot --single-transaction --quick --routines --triggers --events n7cosmetics' | gzip > "$destination/database.sql.gz"
gzip -t "$destination/database.sql.gz"
tar -czf "$destination/media.tar.gz" media
tar -czf "$destination/config.tar.gz" app.env stack.env release.env secrets docker-compose.prod.yml
touch "$destination/complete"
echo "Backup complete: $destination"
# Only prune completed backups within this application's backup directory.
find "$APP_DIR/backups" -mindepth 2 -maxdepth 2 -name complete -type f -mtime +14 -printf '%h\0' |
  while IFS= read -r -d '' directory; do
    [[ "$directory" == "$APP_DIR/backups/"* ]] && rm -rf -- "$directory"
  done
