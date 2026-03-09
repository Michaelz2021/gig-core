#!/bin/bash
# reward_payment_sessions 테이블에 Xendit 컬럼 추가 (008)
# 사용: ./scripts/run-reward-payment-sigrations.sh
# 또는: bash scripts/run-reward-payment-sessions-migration.sh

set -e
cd "$(dirname "$0")/.."

if [ -f .env ]; then
  set -a
  source .env 2>/dev/null || true
  set +a
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USERNAME="${DB_USERNAME:-postgres}"
DB_DATABASE="${DB_DATABASE:-ai_trusttrade}"

echo "Running migration 008_reward_payment_sessions_xendit.sql ..."
echo "DB: $DB_DATABASE @ $DB_HOST:$DB_PORT"

if [ -n "$DB_PASSWORD" ]; then
  export PGPASSWORD="$DB_PASSWORD"
fi

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_DATABASE" \
  -v ON_ERROR_STOP=1 \
  -f migrations/008_reward_payment_sessions_xendit.sql

echo "Done."
