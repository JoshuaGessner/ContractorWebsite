#!/usr/bin/env sh
set -eu

PROJECT_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$PROJECT_ROOT"

USERNAME=${1:-${ADMIN_USERNAME:-}}
PASSWORD=${2:-${ADMIN_PASSWORD:-}}

if [ -z "$USERNAME" ]; then
  printf "New admin username: "
  read -r USERNAME
fi

if [ -z "$PASSWORD" ]; then
  if [ -t 0 ]; then
    printf "New admin password (min 8 chars): "
    stty -echo
    read -r PASSWORD
    stty echo
    printf "\n"
  else
    echo "Password not provided. Pass as second arg or set ADMIN_PASSWORD."
    exit 1
  fi
fi

if [ -z "$USERNAME" ]; then
  echo "Username cannot be empty."
  exit 1
fi

if [ "${#PASSWORD}" -lt 8 ]; then
  echo "Password must be at least 8 characters."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon is not running. Start Docker and try again."
  exit 1
fi

if ! docker compose ps app >/dev/null 2>&1; then
  echo "Docker app service is not available. Run ./scripts/deploy-docker.sh first."
  exit 1
fi

export RESET_ADMIN_USERNAME="$USERNAME"
export RESET_ADMIN_PASSWORD="$PASSWORD"

docker compose exec -T \
  -e RESET_ADMIN_USERNAME \
  -e RESET_ADMIN_PASSWORD \
  app node <<'NODE'
const { randomBytes, scryptSync } = require("crypto");
const { PrismaClient } = require("@prisma/client");

const username = (process.env.RESET_ADMIN_USERNAME || "").trim();
const password = process.env.RESET_ADMIN_PASSWORD || "";

if (!username) {
  console.error("Username cannot be empty.");
  process.exit(1);
}

if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

function hashPassword(value) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(value, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const prisma = new PrismaClient();

(async () => {
  await prisma.$transaction(async (tx) => {
    await tx.adminUser.deleteMany({});
    await tx.adminUser.create({
      data: {
        singletonKey: 1,
        username,
        passwordHash: hashPassword(password),
      },
    });
  });

  console.log("Admin login reset successfully.");
  console.log("Existing admin sessions are invalidated.");
})()
  .catch((error) => {
    console.error("Failed to reset admin login:", error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
NODE

echo "Done. You can now log in at /admin/login with the new credentials."
