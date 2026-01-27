#!/bin/bash

# Script to add availability columns to providers table
# This script reads database credentials from .env file and executes the SQL script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SQL_FILE="$SCRIPT_DIR/add-provider-availability-columns.sql"

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

echo "Adding availability columns to providers table..."
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo ""

# Execute SQL script
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SQL_FILE"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Availability columns added successfully!"
else
  echo ""
  echo "❌ Error adding availability columns"
  exit 1
fi

