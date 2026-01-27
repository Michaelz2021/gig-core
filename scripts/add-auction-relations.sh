#!/bin/bash

# Script to add auction relations to bookings and smart_contracts tables
# This script reads database credentials from .env file and executes the SQL scripts

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BOOKINGS_SQL="$SCRIPT_DIR/add-auction-relations-to-bookings.sql"
CONTRACTS_SQL="$SCRIPT_DIR/add-auction-relations-to-smart-contracts.sql"

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

echo "Adding auction relations to bookings and smart_contracts tables..."
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo ""

# Execute SQL scripts
echo "1. Updating bookings table..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$BOOKINGS_SQL"

if [ $? -eq 0 ]; then
  echo "✅ bookings table updated successfully!"
else
  echo "❌ Error updating bookings table"
  exit 1
fi

echo ""
echo "2. Updating smart_contracts table..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$CONTRACTS_SQL"

if [ $? -eq 0 ]; then
  echo "✅ smart_contracts table updated successfully!"
else
  echo "❌ Error updating smart_contracts table"
  exit 1
fi

echo ""
echo "✅ All tables updated successfully!"

