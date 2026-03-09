#!/bin/bash

# Script to export JOB (Auction) related tables from PostgreSQL database
# This script exports both schema and data

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | grep -E 'DB_|POSTGRES_' | xargs)
fi

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_DATABASE:-${DB_NAME:-ai_trusttrade}}"
DB_USER="${DB_USERNAME:-${DB_USER:-postgres}}"
DB_PASSWORD="${DB_PASSWORD:-${POSTGRES_PASSWORD:-}}"
OUTPUT_DIR="${OUTPUT_DIR:-./exports}"

# Set PGPASSWORD for non-interactive authentication
if [ ! -z "$DB_PASSWORD" ]; then
    export PGPASSWORD="$DB_PASSWORD"
fi

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "=========================================="
echo "Export JOB Related Tables"
echo "=========================================="
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Check if pg_dump is available
if ! command -v pg_dump &> /dev/null; then
    echo -e "${RED}Error: pg_dump command not found${NC}"
    echo "Please install PostgreSQL client tools"
    exit 1
fi

# Export schema only
echo -e "${YELLOW}Exporting schema...${NC}"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --schema-only \
    --table=auctions \
    --table=auction_bids \
    --table=ai_quotation_sessions \
    -f "$OUTPUT_DIR/job_tables_schema_${TIMESTAMP}.sql" 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Schema exported to: job_tables_schema_${TIMESTAMP}.sql${NC}"
else
    echo -e "${RED}✗ Failed to export schema${NC}"
    echo "Please check database connection settings"
    exit 1
fi

# Export data only
echo -e "${YELLOW}Exporting data...${NC}"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --data-only \
    --table=auctions \
    --table=auction_bids \
    --table=ai_quotation_sessions \
    -f "$OUTPUT_DIR/job_tables_data_${TIMESTAMP}.sql" 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Data exported to: job_tables_data_${TIMESTAMP}.sql${NC}"
else
    echo -e "${RED}✗ Failed to export data${NC}"
fi

# Export complete (schema + data)
echo -e "${YELLOW}Exporting complete (schema + data)...${NC}"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --table=auctions \
    --table=auction_bids \
    --table=ai_quotation_sessions \
    -f "$OUTPUT_DIR/job_tables_complete_${TIMESTAMP}.sql" 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Complete export: job_tables_complete_${TIMESTAMP}.sql${NC}"
else
    echo -e "${RED}✗ Failed to export complete${NC}"
fi

# Export as CSV
echo -e "${YELLOW}Exporting as CSV...${NC}"

# Export auctions table
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -c "\COPY (SELECT * FROM auctions) TO '$OUTPUT_DIR/auctions_${TIMESTAMP}.csv' WITH CSV HEADER" 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Auctions CSV: auctions_${TIMESTAMP}.csv${NC}"
fi

# Export auction_bids table
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -c "\COPY (SELECT * FROM auction_bids) TO '$OUTPUT_DIR/auction_bids_${TIMESTAMP}.csv' WITH CSV HEADER" 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Auction Bids CSV: auction_bids_${TIMESTAMP}.csv${NC}"
fi

# Export ai_quotation_sessions table
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -c "\COPY (SELECT * FROM ai_quotation_sessions) TO '$OUTPUT_DIR/ai_quotation_sessions_${TIMESTAMP}.csv' WITH CSV HEADER" 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ AI Quotation Sessions CSV: ai_quotation_sessions_${TIMESTAMP}.csv${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}Export completed!${NC}"
echo "=========================================="
echo "Files saved in: $OUTPUT_DIR"
echo ""
echo "To use different database settings:"
echo "  export DB_HOST=your-host"
echo "  export DB_PORT=5432"
echo "  export DB_DATABASE=your-database"
echo "  export DB_USERNAME=your-user"
echo "  export DB_PASSWORD=your-password"
echo "  ./export_job_tables.sh"
echo ""
echo "Or create/update .env file with:"
echo "  DB_HOST=localhost"
echo "  DB_PORT=5432"
echo "  DB_DATABASE=ai_trusttrade"
echo "  DB_USERNAME=trusttrade"
echo "  DB_PASSWORD=your-password"

