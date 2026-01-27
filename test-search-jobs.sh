#!/bin/bash

# Test script for searching JOBs (Auctions)
# This script tests the GET /api/v1/matching/auctions/search endpoint

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
API_URL="${BASE_URL}/api/v1/matching/auctions/search"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Test: Search Jobs (Auctions) API"
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

# Test 1: Search all jobs
echo -e "${BLUE}Test 1: Search all jobs${NC}"
echo "Request: GET ${API_URL}"
echo ""
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}" \
  -H "Authorization: Bearer ${JWT_TOKEN}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response HTTP Status: ${HTTP_CODE}"
echo "Response Body:"
echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
echo ""
echo "----------------------------------------"
echo ""

# Test 2: Search by keyword
echo -e "${BLUE}Test 2: Search by keyword 'aircon'${NC}"
echo "Request: GET ${API_URL}?keyword=aircon"
echo ""
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}?keyword=aircon" \
  -H "Authorization: Bearer ${JWT_TOKEN}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response HTTP Status: ${HTTP_CODE}"
echo "Response Body:"
echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
echo ""
echo "----------------------------------------"
echo ""

# Test 3: Search by status
echo -e "${BLUE}Test 3: Search by status 'published'${NC}"
echo "Request: GET ${API_URL}?status=published"
echo ""
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}?status=published" \
  -H "Authorization: Bearer ${JWT_TOKEN}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response HTTP Status: ${HTTP_CODE}"
echo "Response Body:"
echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
echo ""
echo "----------------------------------------"
echo ""

# Test 4: Search by location
echo -e "${BLUE}Test 4: Search by location 'Quezon'${NC}"
echo "Request: GET ${API_URL}?location=Quezon"
echo ""
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}?location=Quezon" \
  -H "Authorization: Bearer ${JWT_TOKEN}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response HTTP Status: ${HTTP_CODE}"
echo "Response Body:"
echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
echo ""
echo "----------------------------------------"
echo ""

# Test 5: Search by budget range
echo -e "${BLUE}Test 5: Search by budget range (1000-2000)${NC}"
echo "Request: GET ${API_URL}?budgetMin=1000&budgetMax=2000"
echo ""
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}?budgetMin=1000&budgetMax=2000" \
  -H "Authorization: Bearer ${JWT_TOKEN}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response HTTP Status: ${HTTP_CODE}"
echo "Response Body:"
echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
echo ""
echo "----------------------------------------"
echo ""

# Test 6: Combined search
echo -e "${BLUE}Test 6: Combined search (keyword + status + budget)${NC}"
echo "Request: GET ${API_URL}?keyword=cleaning&status=published&budgetMax=3000"
echo ""
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}?keyword=cleaning&status=published&budgetMax=3000" \
  -H "Authorization: Bearer ${JWT_TOKEN}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response HTTP Status: ${HTTP_CODE}"
echo "Response Body:"
echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
echo ""
echo "----------------------------------------"
echo ""

# Test 7: Pagination
echo -e "${BLUE}Test 7: Pagination (page 1, limit 2)${NC}"
echo "Request: GET ${API_URL}?page=1&limit=2"
echo ""
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}?page=1&limit=2" \
  -H "Authorization: Bearer ${JWT_TOKEN}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

echo "Response HTTP Status: ${HTTP_CODE}"
echo "Response Body:"
echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
echo ""
echo "----------------------------------------"
echo ""

# Summary
echo "=========================================="
echo -e "${GREEN}All tests completed!${NC}"
echo "=========================================="
echo ""
echo "Available search parameters:"
echo "  - keyword: Search in title and description"
echo "  - category: Service category ID"
echo "  - status: Auction status (draft, published, bidding, reviewing, selected, expired, cancelled)"
echo "  - location: Search in location"
echo "  - budgetMin: Minimum budget"
echo "  - budgetMax: Maximum budget"
echo "  - page: Page number (default: 1)"
echo "  - limit: Items per page (default: 20)"
echo ""

