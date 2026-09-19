#!/usr/bin/env bash
set -euo pipefail
umask 077
APP_DIR="${APP_DIR:-/srv/apps/n7cosmetics}"
IMAGE="${1:?Pass an immutable GHCR image digest}"
EXPECTED_SHA="${2:?Pass the Git commit SHA}"
[[ "$IMAGE" =~ ^ghcr\.io/adnanrahim110/n7cosmetics@sha256:[0-9a-f]{64}$ ]] || exit 1
[[ "$EXPECTED_SHA" =~ ^[0-9a-f]{40}$ ]] || exit 1
cd "$APP_DIR"
exec 9>.deploy.lock
flock -w 600 9
compose() { docker compose --env-file stack.env --env-file release.env -f docker-compose.prod.yml "$@"; }
test -s release.env
test -s app.env
test -s .database-imported
compose config --quiet
docker pull "$IMAGE"
actual_sha="$(docker image inspect --format '{{index .Config.Labels "org.opencontainers.image.revision"}}' "$IMAGE")"
[[ "$actual_sha" == "$EXPECTED_SHA" ]] || { echo 'Image revision mismatch.' >&2; exit 1; }
bash "$APP_DIR/backup.sh"
cp release.env release.previous.env
changed=0
rollback() {
  status=$?
  if [[ "$status" -ne 0 && "$changed" -eq 1 ]]; then
    echo 'Release failed. Restoring the previous application image; database backup retained.' >&2
    cp release.previous.env release.env
    if [[ -s .has-successful-release ]]; then
      compose up -d --no-deps --wait --wait-timeout 180 app || true
    else
      compose stop app || true
    fi
  fi
  exit "$status"
}
trap rollback EXIT
printf 'APP_IMAGE=%s\n' "$IMAGE" > release.env
changed=1
compose run --rm --no-deps app node .scripts-dist/scripts/migrate.js
compose run --rm --no-deps app node scripts/verify-media.cjs
compose up -d --no-deps --wait --wait-timeout 180 app
docker exec -e EXPECTED_SHA="$EXPECTED_SHA" n7-app node -e '
fetch("http://127.0.0.1:3000/api/health",{signal:AbortSignal.timeout(10000)})
 .then(async r=>{const body=await r.json();if(!r.ok||body.release!==process.env.EXPECTED_SHA)throw Error("Release health check failed");console.log(JSON.stringify(body));})
 .catch(e=>{console.error(e.message);process.exitCode=1;});'
printf '%s\n' "$EXPECTED_SHA" > .has-successful-release
changed=0
compose ps
echo "Deployed $EXPECTED_SHA"
