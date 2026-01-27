#!/bin/bash

# Script to check wallet balance for a specific user
# Usage: ./check-wallet-balance.sh <user_id>

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Build connection string
DB_USER=${DB_USERNAME:-${DB_USER:-postgres}}
DB_PASSWORD=${DB_PASSWORD}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_DATABASE:-${DB_NAME:-ai_trusttrade}}

if [ -z "$DB_PASSWORD" ]; then
  echo "Error: DB_PASSWORD not found in .env file"
  exit 1
fi

USER_ID=${1:-"a98a4eb5-4b1e-4851-99c6-f92806ae5f61"}

echo "Checking wallet balance for user: $USER_ID"
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo ""

# Check wallet balance
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
  id,
  user_id,
  balance,
  escrow_balance,
  available_balance,
  currency,
  status,
  created_at,
  updated_at
FROM wallets
WHERE user_id = '$USER_ID';
"

echo ""
echo "--- Recent transactions ---"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT 
  id,
  type,
  amount,
  balance_before,
  balance_after,
  description,
  status,
  created_at
FROM wallet_transactions
WHERE user_id = '$USER_ID'
ORDER BY created_at DESC
LIMIT 10;
"

