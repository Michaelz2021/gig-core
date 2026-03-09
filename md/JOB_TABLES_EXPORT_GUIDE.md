# JOB Related Tables Export Guide

This guide explains how to download and export JOB (Auction) related tables from the database.

## Files Created

1. **`job_related_tables_schema.sql`** - Complete SQL schema for JOB tables
2. **`export_job_tables.sh`** - Automated export script

---

## Method 1: Using the Export Script (Recommended)

### Quick Start

```bash
# Set database credentials (if needed)
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=ai_trusttrade
export DB_USER=postgres

# Run the export script
./export_job_tables.sh
```

The script will create an `exports/` directory and generate:
- `job_tables_schema_YYYYMMDD_HHMMSS.sql` - Schema only
- `job_tables_data_YYYYMMDD_HHMMSS.sql` - Data only
- `job_tables_complete_YYYYMMDD_HHMMSS.sql` - Schema + Data
- `auctions_YYYYMMDD_HHMMSS.csv` - Auctions table as CSV
- `auction_bids_YYYYMMDD_HHMMSS.csv` - Auction bids table as CSV
- `ai_quotation_sessions_YYYYMMDD_HHMMSS.csv` - AI quotation sessions as CSV

---

## Method 2: Manual Export using pg_dump

### Export Schema Only

```bash
pg_dump -h localhost -U postgres -d ai_trusttrade \
  --schema-only \
  --table=auctions \
  --table=auction_bids \
  --table=ai_quotation_sessions \
  -f job_tables_schema.sql
```

### Export Data Only

```bash
pg_dump -h localhost -U postgres -d ai_trusttrade \
  --data-only \
  --table=auctions \
  --table=auction_bids \
  --table=ai_quotation_sessions \
  -f job_tables_data.sql
```

### Export Complete (Schema + Data)

```bash
pg_dump -h localhost -U postgres -d ai_trusttrade \
  --table=auctions \
  --table=auction_bids \
  --table=ai_quotation_sessions \
  -f job_tables_complete.sql
```

---

## Method 3: Export as CSV

### Export Auctions Table

```bash
psql -h localhost -U postgres -d ai_trusttrade \
  -c "\COPY (SELECT * FROM auctions) TO 'auctions.csv' WITH CSV HEADER"
```

### Export Auction Bids Table

```bash
psql -h localhost -U postgres -d ai_trusttrade \
  -c "\COPY (SELECT * FROM auction_bids) TO 'auction_bids.csv' WITH CSV HEADER"
```

### Export AI Quotation Sessions Table

```bash
psql -h localhost -U postgres -d ai_trusttrade \
  -c "\COPY (SELECT * FROM ai_quotation_sessions) TO 'ai_quotation_sessions.csv' WITH CSV HEADER"
```

---

## Method 4: Using the Schema File

If you just need the table structure (without data), use the provided schema file:

```bash
# View the schema
cat job_related_tables_schema.sql

# Apply to a database
psql -h localhost -U postgres -d your_database -f job_related_tables_schema.sql
```

---

## Tables Included

### 1. `auctions` (Jobs/Auctions)
- Job postings created by consumers
- Contains service information, location, budget, schedule
- Status tracking (draft, published, bidding, etc.)

**Key Columns:**
- `id` - UUID primary key
- `auction_number` - Unique auction identifier
- `consumer_id` - User who created the auction
- `service_title` - Title of the service
- `service_description` - Detailed description
- `budget_min` / `budget_max` - Budget range
- `status` - Current status
- `total_bids` - Number of bids received

### 2. `auction_bids` (Bids)
- Bids submitted by providers for auctions
- Contains proposed price, work plan, portfolio

**Key Columns:**
- `id` - UUID primary key
- `auction_id` - Reference to auction
- `provider_id` - Provider who submitted the bid
- `proposed_price` - Proposed price
- `work_plan` - Work plan description
- `status` - Bid status (submitted, selected, etc.)

### 3. `ai_quotation_sessions` (AI Quotations)
- AI-powered quotation sessions
- Can be converted to auctions

**Key Columns:**
- `id` - UUID primary key
- `consumer_id` - User who created the session
- `session_number` - Unique session identifier
- `ai_quotation` - AI generated quotation (JSONB)
- `converted_to_auction_id` - If converted to auction

---

## Query Examples

### Get all active auctions

```sql
SELECT * FROM auctions 
WHERE status IN ('published', 'bidding')
ORDER BY created_at DESC;
```

### Get auctions with bid counts

```sql
SELECT 
    a.*,
    COUNT(ab.id) as bid_count,
    MIN(ab.proposed_price) as lowest_bid,
    MAX(ab.proposed_price) as highest_bid
FROM auctions a
LEFT JOIN auction_bids ab ON a.id = ab.auction_id
WHERE a.status = 'bidding'
GROUP BY a.id
ORDER BY a.created_at DESC;
```

### Get bids for a specific auction

```sql
SELECT 
    ab.*,
    p.business_name as provider_name,
    p.trust_score
FROM auction_bids ab
JOIN providers p ON ab.provider_id = p.id
WHERE ab.auction_id = 'auction-id-here'
ORDER BY ab.proposed_price ASC;
```

### Get consumer's auctions with statistics

```sql
SELECT 
    a.*,
    COUNT(ab.id) as total_bids,
    AVG(ab.proposed_price) as avg_bid_price
FROM auctions a
LEFT JOIN auction_bids ab ON a.id = ab.auction_id
WHERE a.consumer_id = 'user-id-here'
GROUP BY a.id
ORDER BY a.created_at DESC;
```

---

## Import/Restore

### Restore from SQL file

```bash
psql -h localhost -U postgres -d ai_trusttrade -f job_tables_complete.sql
```

### Import from CSV

```bash
# Import auctions
psql -h localhost -U postgres -d ai_trusttrade \
  -c "\COPY auctions FROM 'auctions.csv' WITH CSV HEADER"

# Import auction_bids
psql -h localhost -U postgres -d ai_trusttrade \
  -c "\COPY auction_bids FROM 'auction_bids.csv' WITH CSV HEADER"
```

---

## Troubleshooting

### Permission Denied
```bash
# Make script executable
chmod +x export_job_tables.sh
```

### Database Connection Error
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -h localhost -U postgres -d ai_trusttrade -c "SELECT 1;"
```

### Tables Don't Exist
If tables don't exist yet, create them using:
```bash
psql -h localhost -U postgres -d ai_trusttrade -f job_related_tables_schema.sql
```

---

## File Locations

All exported files will be saved in:
- Default: `./exports/` directory
- Custom: Set `OUTPUT_DIR` environment variable

---

**Last Updated:** 2025-11-29

