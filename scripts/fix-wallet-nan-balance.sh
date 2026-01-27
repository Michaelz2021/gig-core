#!/bin/bash

# Script to fix NaN balance values in wallets table

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SQL_FILE="$SCRIPT_DIR/fix-wallet-nan-balance.sql"

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

echo "Fixing NaN balance values in wallets table..."
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo ""

# Execute SQL script
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SQL_FILE"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ NaN balance values fixed successfully!"
else
  echo ""
  echo "❌ Error fixing NaN balance values"
  exit 1
fi

