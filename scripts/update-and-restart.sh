#!/usr/bin/env sh
set -eu

PROJECT_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$PROJECT_ROOT"

if ./scripts/deploy-docker.sh --update; then
	exit 0
fi

echo "Update mode failed or was not applicable. Falling back to restart/redeploy only..."
./scripts/deploy-docker.sh
