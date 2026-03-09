#!/bin/bash

# Insert Sample Bidding Auctions Script
# 입찰 중인 옥션 샘플 데이터 10개 삽입

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-ai_trusttrade}"
DB_USER="${DB_USER:-trusttrade}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "=========================================="
echo "Insert Sample Bidding Auctions"
echo "=========================================="
echo ""

# Check if password is provided
if [ -z "$DB_PASSWORD" ]; then
    echo -e "${YELLOW}DB_PASSWORD environment variable is not set${NC}"
    echo "Please set it with: export DB_PASSWORD='your-password'"
    echo ""
    echo "Or run with:"
    echo "  PGPASSWORD=your-password ./insert_sample_auctions.sh"
    echo ""
    read -sp "Enter database password: " DB_PASSWORD
    echo ""
fi

# Export password for psql
export PGPASSWORD="$DB_PASSWORD"

# Check connection
echo -e "${YELLOW}Testing database connection...${NC}"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to connect to database${NC}"
    echo "Please check your database credentials"
    exit 1
fi

echo -e "${GREEN}✓ Database connection successful${NC}"
echo ""

# Check if tables exist
echo -e "${YELLOW}Checking if tables exist...${NC}"
TABLE_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'auctions');" | tr -d ' ')

if [ "$TABLE_EXISTS" != "t" ]; then
    echo -e "${RED}✗ Tables do not exist${NC}"
    echo "Please create tables first using:"
    echo "  psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f job_related_tables_schema.sql"
    exit 1
fi

echo -e "${GREEN}✓ Tables exist${NC}"
echo ""

# Run the insert script
echo -e "${YELLOW}Inserting sample data...${NC}"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f insert_sample_auctions.sql

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Successfully inserted sample bidding auctions!${NC}"
    echo ""
    echo "Verifying data..."
    echo ""
    
    # Show summary
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
    SELECT 
        COUNT(*) as total_auctions,
        SUM(total_bids) as total_bids,
        AVG(total_bids)::DECIMAL(10,2) as avg_bids_per_auction
    FROM auctions 
    WHERE status = 'bidding';
    "
    
    echo ""
    echo "Sample auctions created:"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
    SELECT 
        auction_number,
        service_title,
        status,
        total_bids,
        budget_min,
        budget_max,
        created_at
    FROM auctions 
    WHERE status = 'bidding'
    ORDER BY created_at DESC
    LIMIT 10;
    "
else
    echo -e "${RED}✗ Failed to insert data${NC}"
    exit 1
fi

# Clean up
unset PGPASSWORD

echo ""
echo "=========================================="
echo -e "${GREEN}Done!${NC}"
echo "=========================================="

