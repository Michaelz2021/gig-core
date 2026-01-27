#!/bin/bash

echo "=========================================="
echo "Testing Pending Bids API"
echo "=========================================="
echo ""

# Test endpoint URL
API_URL="http://localhost:3000/api/v1/admin/test/pending-bids"

echo "1. Testing API endpoint: $API_URL"
echo ""

# Make API call
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$API_URL")
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

echo "HTTP Status Code: $HTTP_CODE"
echo ""
echo "Response Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

# Also check database directly
echo "2. Checking database directly:"
echo ""
PGPASSWORD='zxcqwe123$' psql -h localhost -U trusttrade -d ai_trusttrade -c "
SELECT 
    auction_number,
    status::text as status,
    service_title,
    created_at
FROM auctions 
WHERE status::text IN ('draft', 'published', 'bidding', 'reviewing', 'selected', 'expired')
ORDER BY created_at DESC;
"

echo ""
echo "=========================================="
echo "Done!"
echo "=========================================="

