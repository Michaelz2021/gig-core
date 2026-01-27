#!/bin/bash

# Test script for creating a new JOB (Auction)
# This script tests the POST /api/v1/matching/auctions endpoint

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
API_URL="${BASE_URL}/api/v1/matching/auctions"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Test: Create New Job (Auction)"
echo "=========================================="
echo ""

# Check if JWT token is provided
if [ -z "$JWT_TOKEN" ]; then
    echo -e "${YELLOW}Warning: JWT_TOKEN environment variable is not set${NC}"
    echo "Please set it with: export JWT_TOKEN='your-jwt-token'"
    echo ""
    echo "To get a token, first login:"
    echo "  curl -X POST ${BASE_URL}/api/v1/auth/login \\"
    echo "    -H 'Content-Type: application/json' \\"
    echo "    -d '{\"email\":\"test@example.com\",\"password\":\"Test1234!\"}'"
    echo ""
    exit 1
fi

# Sample job data
JOB_DATA=$(cat <<EOF
{
  "serviceTitle": "Aircon Cleaning Service",
  "serviceDescription": "Need cleaning for 2 split-type aircon units. Not cooling properly, making weird noise. Need professional service with proper tools.",
  "serviceLocation": "123 Main Street, Quezon City, Metro Manila",
  "locationLatitude": 14.5995,
  "locationLongitude": 120.9842,
  "serviceRequirements": "Professional tools required. Must provide before/after photos. TESDA certified preferred.",
  "preferredDate": "2025-12-05",
  "preferredTime": "14:00:00",
  "deadline": "2025-12-03T14:00:00Z",
  "budgetMin": 1000,
  "budgetMax": 2000,
  "photos": [
    "https://example.com/photos/aircon1.jpg",
    "https://example.com/photos/aircon2.jpg"
  ],
  "autoSelectEnabled": false,
  "maxBidsToReceive": 10
}
EOF
)

echo "Request URL: ${API_URL}"
echo "Request Method: POST"
echo ""
echo "Request Body:"
echo "$JOB_DATA" | jq '.' 2>/dev/null || echo "$JOB_DATA"
echo ""
echo "----------------------------------------"
echo ""

# Make the API request
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -d "${JOB_DATA}")

# Extract HTTP status code (last line)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

# Extract response body (all lines except last)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response HTTP Status: ${HTTP_CODE}"
echo ""
echo "Response Body:"
echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
echo ""

# Check if request was successful
if [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ Test PASSED: Job created successfully${NC}"
    
    # Extract job ID if available
    JOB_ID=$(echo "$RESPONSE_BODY" | jq -r '.id // .auctionId // .data.id // .data.auctionId // empty' 2>/dev/null)
    if [ ! -z "$JOB_ID" ] && [ "$JOB_ID" != "null" ]; then
        echo -e "${GREEN}Job ID: ${JOB_ID}${NC}"
        echo ""
        echo "To view the job details, run:"
        echo "  curl -X GET ${BASE_URL}/api/v1/matching/auctions/${JOB_ID} \\"
        echo "    -H 'Authorization: Bearer ${JWT_TOKEN}'"
    fi
    exit 0
else
    echo -e "${RED}✗ Test FAILED: HTTP ${HTTP_CODE}${NC}"
    exit 1
fi

