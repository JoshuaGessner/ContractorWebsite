#!/usr/bin/env sh
set -eu

PROJECT_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$PROJECT_ROOT"

UPDATE_MODE=0

if [ "${1:-}" = "--update" ]; then
  UPDATE_MODE=1
fi

generate_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -base64 48 | tr -d '\n'
    return
  fi

  if command -v node >/dev/null 2>&1; then
    node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
    return
  fi

  tr -dc 'A-Za-z0-9' </dev/urandom | head -c 64
}

if [ ! -f .env.docker ]; then
  if [ -f .env.docker.example ]; then
    cp .env.docker.example .env.docker
    echo "Created .env.docker from .env.docker.example"
  else
    cat > .env.docker <<'EOF'
NODE_ENV=production
APP_PORT=43871
DATABASE_URL=file:/app/data/prod.db
EOF
    echo "Created minimal .env.docker"
  fi
fi

if [ "$UPDATE_MODE" -eq 1 ]; then
  if ! command -v git >/dev/null 2>&1; then
    echo "Git is not installed. Cannot run update mode."
    exit 1
  fi

  if [ ! -d .git ]; then
    echo "No .git directory found. Update mode requires a git clone."
    exit 1
  fi

  if [ -n "$(git status --porcelain 2>/dev/null || true)" ]; then
    echo "Working tree is not clean. Commit/stash changes before using --update."
    exit 1
  fi

  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
  echo "Updating source from origin/${CURRENT_BRANCH}..."
  git fetch origin
  git pull --ff-only origin "$CURRENT_BRANCH"
fi

AUTH_LINE=$(grep '^AUTH_SECRET=' .env.docker || true)
PLACEHOLDER='AUTH_SECRET=replace-with-very-long-random-secret'

if [ -z "$AUTH_LINE" ] || [ "$AUTH_LINE" = "$PLACEHOLDER" ]; then
  SECRET=$(generate_secret)

  if grep -q '^AUTH_SECRET=' .env.docker; then
    awk -v new_secret="$SECRET" '
      BEGIN { replaced = 0 }
      /^AUTH_SECRET=/ { print "AUTH_SECRET=" new_secret; replaced = 1; next }
      { print }
      END { if (!replaced) print "AUTH_SECRET=" new_secret }
    ' .env.docker > .env.docker.tmp
    mv .env.docker.tmp .env.docker
  else
    printf '\nAUTH_SECRET=%s\n' "$SECRET" >> .env.docker
  fi

  echo "Set AUTH_SECRET automatically in .env.docker"
fi

echo "Starting Docker services..."

if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon is not running. Start Docker Desktop and run this command again."
  exit 1
fi

docker compose up -d --build --pull always --remove-orphans

APP_PORT_VALUE=$(grep '^APP_PORT=' .env.docker 2>/dev/null | tail -n 1 | cut -d'=' -f2- || true)
if [ -z "$APP_PORT_VALUE" ]; then
  APP_PORT_VALUE=43871
fi

echo "Done. Open: http://localhost:${APP_PORT_VALUE}"

if [ "$UPDATE_MODE" -eq 1 ]; then
  echo "Update mode complete."
fi
