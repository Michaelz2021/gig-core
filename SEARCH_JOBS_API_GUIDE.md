# Search Jobs API Guide

This guide explains how to use the Search Jobs (Auctions) API endpoint.

## Endpoint

**GET** `/api/v1/matching/auctions/search`

**Authentication:** JWT Bearer token required

---

## Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `keyword` | string | No | Search in title and description (case-insensitive) |
| `category` | string (UUID) | No | Service category ID |
| `status` | enum | No | Auction status: `draft`, `published`, `bidding`, `reviewing`, `selected`, `expired`, `cancelled` |
| `location` | string | No | Search in location (case-insensitive) |
| `budgetMin` | number | No | Minimum budget |
| `budgetMax` | number | No | Maximum budget |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 20) |

---

## Response Format

```json
{
  "items": [
    {
      "id": "auction-id",
      "auctionNumber": "AUCT-2025-001",
      "consumerId": "user-id",
      "serviceTitle": "Aircon Cleaning Service",
      "serviceDescription": "Need cleaning for 2 split-type aircon units...",
      "serviceLocation": "123 Main Street, Quezon City",
      "budgetMin": 1000,
      "budgetMax": 2000,
      "status": "published",
      "totalViews": 15,
      "totalBids": 3,
      "createdAt": "2025-12-01T10:00:00Z",
      "consumer": {
        "id": "user-id",
        "email": "test@example.com"
      }
    }
  ],
  "total": 4,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

---

## Usage Examples

### 1. Search All Jobs

```bash
curl -X GET "http://localhost:3000/api/v1/matching/auctions/search" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Search by Keyword

```bash
curl -X GET "http://localhost:3000/api/v1/matching/auctions/search?keyword=aircon" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Search by Status

```bash
curl -X GET "http://localhost:3000/api/v1/matching/auctions/search?status=published" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Search by Location

```bash
curl -X GET "http://localhost:3000/api/v1/matching/auctions/search?location=Quezon" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Search by Budget Range

```bash
curl -X GET "http://localhost:3000/api/v1/matching/auctions/search?budgetMin=1000&budgetMax=2000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 6. Combined Search

```bash
curl -X GET "http://localhost:3000/api/v1/matching/auctions/search?keyword=cleaning&status=published&budgetMax=3000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 7. With Pagination

```bash
curl -X GET "http://localhost:3000/api/v1/matching/auctions/search?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## JavaScript Example

```javascript
const axios = require('axios');

async function searchJobs(filters = {}) {
  try {
    const params = new URLSearchParams();
    
    if (filters.keyword) params.append('keyword', filters.keyword);
    if (filters.status) params.append('status', filters.status);
    if (filters.location) params.append('location', filters.location);
    if (filters.budgetMin) params.append('budgetMin', filters.budgetMin);
    if (filters.budgetMax) params.append('budgetMax', filters.budgetMax);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await axios.get(
      `http://localhost:3000/api/v1/matching/auctions/search?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${jwtToken}`
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error searching jobs:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
const results = await searchJobs({
  keyword: 'aircon',
  status: 'published',
  budgetMax: 2000
});
```

---

## Python Example

```python
import requests

def search_jobs(jwt_token, **filters):
    url = "http://localhost:3000/api/v1/matching/auctions/search"
    
    headers = {
        "Authorization": f"Bearer {jwt_token}"
    }
    
    params = {}
    if filters.get('keyword'):
        params['keyword'] = filters['keyword']
    if filters.get('status'):
        params['status'] = filters['status']
    if filters.get('location'):
        params['location'] = filters['location']
    if filters.get('budgetMin'):
        params['budgetMin'] = filters['budgetMin']
    if filters.get('budgetMax'):
        params['budgetMax'] = filters['budgetMax']
    if filters.get('page'):
        params['page'] = filters['page']
    if filters.get('limit'):
        params['limit'] = filters['limit']
    
    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response: {e.response.text}")
        raise

# Usage
results = search_jobs(
    jwt_token="your-token",
    keyword="aircon",
    status="published",
    budgetMax=2000
)
```

---

## Using the Test Script

```bash
# Set your JWT token
export JWT_TOKEN="your-jwt-token-here"

# Run the test script
./test-search-jobs.sh
```

The script will test:
1. Search all jobs
2. Search by keyword
3. Search by status
4. Search by location
5. Search by budget range
6. Combined search
7. Pagination

---

## Search Features

### Keyword Search
- Searches in both `serviceTitle` and `serviceDescription`
- Case-insensitive (ILIKE)
- Partial matching (uses `%keyword%`)

### Status Filter
Available statuses:
- `draft` - Draft auctions
- `published` - Published and visible
- `bidding` - Currently accepting bids
- `reviewing` - Under review
- `selected` - Bid selected
- `expired` - Expired auctions
- `cancelled` - Cancelled auctions

### Budget Range
- `budgetMin`: Returns auctions where `budgetMax >= budgetMin` OR `budgetMin >= budgetMin`
- `budgetMax`: Returns auctions where `budgetMin <= budgetMax` OR `budgetMax <= budgetMax`
- Can use both together for a range

### Location Search
- Searches in `serviceLocation` field
- Case-insensitive
- Partial matching

### Pagination
- `page`: Page number (starts from 1)
- `limit`: Number of items per page
- Response includes `totalPages` for easy navigation

---

## Sample Data

The test script uses sample data from the database:
- **4 auctions** with various statuses
- **9 bids** across different auctions
- **2 AI quotation sessions**

Sample auction titles:
- Aircon Cleaning Service
- Home Plumbing Repair
- Electrical Installation
- Deep House Cleaning

---

**Last Updated:** 2025-12-06

