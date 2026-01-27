#!/bin/bash

# Script to create user_device_tokens table
# This script reads database credentials from .env file and executes the SQL script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SQL_FILE="$SCRIPT_DIR/create-user-device-tokens-table.sql"

cd "$PROJECT_ROOT"

# Load environment variables (skip lines with special characters that break export)
if [ -f .env ]; then
  set -a
  source <(grep -v '^#' .env | grep -v 'FIREBASE_PRIVATE_KEY' | sed 's/^/export /')
  # Load FIREBASE_PRIVATE_KEY separately if needed (not used in this script)
  if grep -q '^FIREBASE_PRIVATE_KEY=' .env; then
    export FIREBASE_PRIVATE_KEY=$(grep '^FIREBASE_PRIVATE_KEY=' .env | cut -d '=' -f2- | sed 's/^"//;s/"$//')
  fi
  set +a
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

echo "Creating user_device_tokens table..."
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo ""

# Execute SQL script
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SQL_FILE"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ user_device_tokens table created successfully!"
else
  echo ""
  echo "❌ Error creating user_device_tokens table"
  exit 1
fi
