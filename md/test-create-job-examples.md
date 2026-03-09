# Create Job (Auction) API Test Examples

This document provides various examples for testing the Create Job API endpoint.

**Endpoint:** `POST /api/v1/matching/auctions`  
**Authentication:** JWT Bearer token required

---

## 1. cURL Examples

### Basic Job Creation

```bash
curl -X POST http://localhost:3000/api/v1/matching/auctions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "serviceTitle": "Aircon Cleaning Service",
    "serviceDescription": "Need cleaning for 2 split-type aircon units. Not cooling properly, making weird noise.",
    "serviceLocation": "123 Main Street, Quezon City, Metro Manila",
    "locationLatitude": 14.5995,
    "locationLongitude": 120.9842,
    "preferredDate": "2025-12-05",
    "preferredTime": "14:00:00",
    "budgetMin": 1000,
    "budgetMax": 2000
  }'
```

### Full Job Creation with All Fields

```bash
curl -X POST http://localhost:3000/api/v1/matching/auctions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "serviceCategoryId": "category-id-123",
    "serviceTitle": "Home Aircon Maintenance",
    "serviceDescription": "Need comprehensive cleaning and maintenance for 2 split-type aircon units. Units are not cooling properly and making unusual noise. Looking for professional service provider with proper tools and certification.",
    "serviceLocation": "123 Main Street, Quezon City, Metro Manila",
    "locationLatitude": 14.5995,
    "locationLongitude": 120.9842,
    "serviceRequirements": "Professional tools required. Must provide before/after photos. TESDA certified preferred. Insurance required.",
    "preferredDate": "2025-12-05",
    "preferredTime": "14:00:00",
    "deadline": "2025-12-03T14:00:00Z",
    "budgetMin": 1000,
    "budgetMax": 2000,
    "photos": [
      "https://example.com/photos/aircon1.jpg",
      "https://example.com/photos/aircon2.jpg"
    ],
    "documents": [
      "https://example.com/docs/requirements.pdf"
    ],
    "autoSelectEnabled": false,
    "maxBidsToReceive": 10
  }'
```

### Minimal Job Creation (Required Fields Only)

```bash
curl -X POST http://localhost:3000/api/v1/matching/auctions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "serviceTitle": "Plumbing Repair",
    "serviceDescription": "Leaky faucet needs repair",
    "serviceLocation": "456 Oak Avenue, Makati City"
  }'
```

---

## 2. JavaScript/Node.js Example

```javascript
const axios = require('axios');

const createJob = async (jwtToken) => {
  try {
    const response = await axios.post(
      'http://localhost:3000/api/v1/matching/auctions',
      {
        serviceTitle: 'Aircon Cleaning Service',
        serviceDescription: 'Need cleaning for 2 split-type aircon units. Not cooling properly, making weird noise.',
        serviceLocation: '123 Main Street, Quezon City, Metro Manila',
        locationLatitude: 14.5995,
        locationLongitude: 120.9842,
        serviceRequirements: 'Professional tools required. Must provide before/after photos.',
        preferredDate: '2025-12-05',
        preferredTime: '14:00:00',
        deadline: '2025-12-03T14:00:00Z',
        budgetMin: 1000,
        budgetMax: 2000,
        photos: [
          'https://example.com/photos/aircon1.jpg',
          'https://example.com/photos/aircon2.jpg'
        ],
        autoSelectEnabled: false,
        maxBidsToReceive: 10
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        }
      }
    );

    console.log('Job created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating job:', error.response?.data || error.message);
    throw error;
  }
};

// Usage
const jwtToken = 'your-jwt-token-here';
createJob(jwtToken);
```

---

## 3. Python Example

```python
import requests
import json

def create_job(jwt_token):
    url = "http://localhost:3000/api/v1/matching/auctions"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {jwt_token}"
    }
    
    payload = {
        "serviceTitle": "Aircon Cleaning Service",
        "serviceDescription": "Need cleaning for 2 split-type aircon units. Not cooling properly, making weird noise.",
        "serviceLocation": "123 Main Street, Quezon City, Metro Manila",
        "locationLatitude": 14.5995,
        "locationLongitude": 120.9842,
        "serviceRequirements": "Professional tools required. Must provide before/after photos.",
        "preferredDate": "2025-12-05",
        "preferredTime": "14:00:00",
        "deadline": "2025-12-03T14:00:00Z",
        "budgetMin": 1000,
        "budgetMax": 2000,
        "photos": [
            "https://example.com/photos/aircon1.jpg",
            "https://example.com/photos/aircon2.jpg"
        ],
        "autoSelectEnabled": False,
        "maxBidsToReceive": 10
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        print("Job created successfully:", json.dumps(response.json(), indent=2))
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error creating job: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response: {e.response.text}")
        raise

# Usage
jwt_token = "your-jwt-token-here"
create_job(jwt_token)
```

---

## 4. Request Body Schema

### Required Fields
- `serviceTitle` (string): Title of the service/job
- `serviceDescription` (string): Detailed description of the job
- `serviceLocation` (string): Location address

### Optional Fields
- `serviceCategoryId` (string): Category ID for the service
- `serviceRequirements` (string): Additional requirements
- `locationLatitude` (number): Latitude coordinate
- `locationLongitude` (number): Longitude coordinate
- `preferredDate` (string, ISO date): Preferred date for service
- `preferredTime` (string): Preferred time (HH:mm:ss format)
- `deadline` (string, ISO datetime): Bidding deadline
- `budgetMin` (number): Minimum budget
- `budgetMax` (number): Maximum budget
- `photos` (array of strings): Array of photo URLs
- `documents` (array of strings): Array of document URLs
- `autoSelectEnabled` (boolean): Enable automatic bid selection
- `maxBidsToReceive` (number, 1-100): Maximum number of bids to receive

---

## 5. Response Examples

### Success Response (201 Created)

```json
{
  "id": "auction-id-123",
  "serviceTitle": "Aircon Cleaning Service",
  "serviceDescription": "Need cleaning for 2 split-type aircon units...",
  "status": "DRAFT",
  "createdAt": "2025-11-29T10:00:00Z",
  "updatedAt": "2025-11-29T10:00:00Z"
}
```

### Error Response (400 Bad Request)

```json
{
  "statusCode": 400,
  "message": [
    "serviceTitle should not be empty",
    "serviceDescription should not be empty"
  ],
  "error": "Bad Request"
}
```

### Error Response (401 Unauthorized)

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

---

## 6. Using the Test Script

The `test-create-job.sh` script provides an automated way to test the API:

```bash
# Set your JWT token
export JWT_TOKEN="your-jwt-token-here"

# Optionally set base URL (default: http://localhost:3000)
export BASE_URL="http://localhost:3000"

# Run the test
chmod +x test-create-job.sh
./test-create-job.sh
```

---

## 7. Getting a JWT Token

Before creating a job, you need to authenticate and get a JWT token:

```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'

# Response will include access_token
# Use this token in the Authorization header
```

---

## 8. Complete Workflow Example

```bash
# Step 1: Login and get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }' | jq -r '.access_token')

# Step 2: Create a job
JOB_ID=$(curl -s -X POST http://localhost:3000/api/v1/matching/auctions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "serviceTitle": "Aircon Cleaning",
    "serviceDescription": "Need professional aircon cleaning",
    "serviceLocation": "123 Main St, Quezon City",
    "budgetMax": 2000
  }' | jq -r '.id')

# Step 3: View the created job
curl -X GET http://localhost:3000/api/v1/matching/auctions/$JOB_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

---

## 9. Common Use Cases

### Home Services
```json
{
  "serviceTitle": "Home Cleaning Service",
  "serviceDescription": "Deep cleaning for 3-bedroom house",
  "serviceLocation": "456 Oak Avenue, Makati City",
  "preferredDate": "2025-12-10",
  "budgetMax": 3000
}
```

### Plumbing
```json
{
  "serviceTitle": "Plumbing Repair",
  "serviceDescription": "Fix leaky faucet and replace pipes",
  "serviceLocation": "789 Pine Street, Pasig City",
  "preferredDate": "2025-12-07",
  "budgetMax": 1500
}
```

### Electrical Work
```json
{
  "serviceTitle": "Electrical Installation",
  "serviceDescription": "Install new electrical outlets in kitchen",
  "serviceLocation": "321 Elm Street, Taguig City",
  "serviceRequirements": "Licensed electrician required",
  "preferredDate": "2025-12-08",
  "budgetMax": 2500
}
```

---

**Note:** Replace `YOUR_JWT_TOKEN` with your actual JWT token obtained from the login endpoint.

