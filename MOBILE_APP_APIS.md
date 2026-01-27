# 모바일 앱 API 가이드

## 사용자별 작업 목록 조회 API

모바일 앱에서 각 탭 메뉴를 눌렀을 때 해당 사용자의 데이터를 가져오는 API입니다.

---

## 1. Awaiting Bids (입찰 대기 중)

### 엔드포인트
```
GET /api/v1/matching/auctions?status={status}
```

### 설명
Consumer가 생성한 auction 중 입찰 대기 중인 것들을 조회합니다.

### 인증
- JWT Bearer Token 필요
- Header: `Authorization: Bearer {JWT_TOKEN}`

### Query Parameters
- `status` (optional): Auction 상태
  - `draft`: 초안
  - `published`: 게시됨
  - `bidding`: 입찰 중
  - `reviewing`: 검토 중

### 예제 요청

#### 모든 입찰 대기 중인 auction 조회
```bash
# 방법 1: status 없이 호출하면 해당 사용자의 모든 auction 반환 (클라이언트에서 필터링)
GET /api/v1/matching/auctions

# 방법 2: 특정 status로 필터링
GET /api/v1/matching/auctions?status=published
GET /api/v1/matching/auctions?status=bidding
GET /api/v1/matching/auctions?status=reviewing
GET /api/v1/matching/auctions?status=draft
```

#### JavaScript/React Native 예제
```javascript
// 방법 1: status 없이 호출하여 모든 auction을 가져온 후 클라이언트에서 필터링 (권장)
const getAwaitingBids = async (token) => {
  const response = await fetch(
    `http://43.201.114.64:3000/api/v1/matching/auctions`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  const data = await response.json();
  
  if (data.items) {
    // 클라이언트에서 입찰 대기 중인 상태만 필터링
    const awaitingStatuses = ['draft', 'published', 'bidding', 'reviewing'];
    return data.items.filter(auction => awaitingStatuses.includes(auction.status));
  }
  
  return [];
};

// 방법 2: 여러 상태를 각각 호출하여 합치기
const getAwaitingBidsMultiple = async (token) => {
  const statuses = ['draft', 'published', 'bidding', 'reviewing'];
  const allAuctions = [];
  
  for (const status of statuses) {
    const response = await fetch(
      `http://43.201.114.64:3000/api/v1/matching/auctions?status=${status}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const data = await response.json();
    if (data.items) {
      allAuctions.push(...data.items);
    }
  }
  
  return allAuctions;
};
```

### 응답 예제
```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "auctionNumber": "AUCT-2025-001",
      "consumerId": "user-id",
      "serviceTitle": "Aircon Cleaning Service",
      "serviceDescription": "Need cleaning for 2 split-type aircon units.",
      "serviceLocation": "123 Main Street, Quezon City",
      "status": "published",
      "totalBids": 3,
      "budgetMin": 1000,
      "budgetMax": 2000,
      "deadline": "2025-12-08T14:00:00.000Z",
      "createdAt": "2025-12-01T10:00:00.000Z"
    }
  ],
  "total": 1
}
```

---

## 2. Contracted (계약 완료)

### 엔드포인트
```
GET /api/v1/bookings?role={role}&status=confirmed
```

### 설명
Consumer 또는 Provider의 계약 완료된(확정된) booking을 조회합니다.

### 인증
- JWT Bearer Token 필요
- Header: `Authorization: Bearer {JWT_TOKEN}`

### Query Parameters
- `role` (required): 사용자 역할
  - `consumer`: Consumer의 booking 조회
  - `provider`: Provider의 booking 조회
- `status` (optional): Booking 상태
  - `confirmed`: 계약 완료 (확정됨)

### 예제 요청
```bash
# Consumer의 계약 완료된 booking 조회
GET /api/v1/bookings?role=consumer&status=confirmed

# Provider의 계약 완료된 booking 조회
GET /api/v1/bookings?role=provider&status=confirmed
```

### JavaScript/React Native 예제
```javascript
const getContracted = async (token, userRole = 'consumer') => {
  const response = await fetch(
    `http://43.201.114.64:3000/api/v1/bookings?role=${userRole}&status=confirmed`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  const data = await response.json();
  return data.items || [];
};
```

### 응답 예제
```json
{
  "items": [
    {
      "id": "booking-id",
      "status": "confirmed",
      "serviceTitle": "Aircon Cleaning Service",
      "totalAmount": 1500,
      "consumer": {
        "id": "consumer-id",
        "email": "consumer@example.com",
        "name": "John Doe"
      },
      "provider": {
        "id": "provider-id",
        "email": "provider@example.com",
        "name": "Jane Smith"
      },
      "createdAt": "2025-12-05T10:00:00.000Z"
    }
  ],
  "total": 1
}
```

---

## 3. In Progress (진행 중)

### 엔드포인트
```
GET /api/v1/bookings?role={role}&status=in_progress
```

### 설명
Consumer 또는 Provider의 진행 중인 booking을 조회합니다.

### 인증
- JWT Bearer Token 필요
- Header: `Authorization: Bearer {JWT_TOKEN}`

### Query Parameters
- `role` (required): 사용자 역할
  - `consumer`: Consumer의 booking 조회
  - `provider`: Provider의 booking 조회
- `status` (optional): Booking 상태
  - `in_progress`: 진행 중

### 예제 요청
```bash
# Consumer의 진행 중인 booking 조회
GET /api/v1/bookings?role=consumer&status=in_progress

# Provider의 진행 중인 booking 조회
GET /api/v1/bookings?role=provider&status=in_progress
```

### JavaScript/React Native 예제
```javascript
const getInProgress = async (token, userRole = 'consumer') => {
  const response = await fetch(
    `http://43.201.114.64:3000/api/v1/bookings?role=${userRole}&status=in_progress`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  const data = await response.json();
  return data.items || [];
};
```

### 응답 예제
```json
{
  "items": [
    {
      "id": "booking-id",
      "status": "in_progress",
      "serviceTitle": "Aircon Cleaning Service",
      "totalAmount": 1500,
      "scheduledDate": "2025-12-10",
      "actualStartTime": "2025-12-10T09:00:00.000Z",
      "consumer": {
        "id": "consumer-id",
        "email": "consumer@example.com",
        "name": "John Doe"
      },
      "provider": {
        "id": "provider-id",
        "email": "provider@example.com",
        "name": "Jane Smith"
      },
      "createdAt": "2025-12-05T10:00:00.000Z"
    }
  ],
  "total": 1
}
```

---

## 4. Completed (완료됨)

### 엔드포인트
```
GET /api/v1/bookings?role={role}&status=completed
```

### 설명
Consumer 또는 Provider의 완료된 booking을 조회합니다.

### 인증
- JWT Bearer Token 필요
- Header: `Authorization: Bearer {JWT_TOKEN}`

### Query Parameters
- `role` (required): 사용자 역할
  - `consumer`: Consumer의 booking 조회
  - `provider`: Provider의 booking 조회
- `status` (optional): Booking 상태
  - `completed`: 완료됨

### 예제 요청
```bash
# Consumer의 완료된 booking 조회
GET /api/v1/bookings?role=consumer&status=completed

# Provider의 완료된 booking 조회
GET /api/v1/bookings?role=provider&status=completed
```

### JavaScript/React Native 예제
```javascript
const getCompleted = async (token, userRole = 'consumer') => {
  const response = await fetch(
    `http://43.201.114.64:3000/api/v1/bookings?role=${userRole}&status=completed`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  const data = await response.json();
  return data.items || [];
};
```

### 응답 예제
```json
{
  "items": [
    {
      "id": "booking-id",
      "status": "completed",
      "serviceTitle": "Aircon Cleaning Service",
      "totalAmount": 1500,
      "actualStartTime": "2025-12-10T09:00:00.000Z",
      "actualEndTime": "2025-12-10T12:00:00.000Z",
      "consumer": {
        "id": "consumer-id",
        "email": "consumer@example.com",
        "name": "John Doe"
      },
      "provider": {
        "id": "provider-id",
        "email": "provider@example.com",
        "name": "Jane Smith"
      },
      "createdAt": "2025-12-05T10:00:00.000Z"
    }
  ],
  "total": 1
}
```

---

## 전체 예제 (React Native)

```javascript
// API Base URL
const API_BASE_URL = 'http://43.201.114.64:3000/api/v1';

// API 클라이언트 함수
const apiClient = {
  async request(endpoint, options = {}) {
    const token = await AsyncStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    return response.json();
  },

  // 1. Awaiting Bids
  async getAwaitingBids() {
    const statuses = ['draft', 'published', 'bidding', 'reviewing'];
    const allAuctions = [];
    
    for (const status of statuses) {
      const data = await this.request(`/matching/auctions?status=${status}`);
      if (data.items) {
        allAuctions.push(...data.items);
      }
    }
    
    return allAuctions;
  },

  // 2. Contracted
  async getContracted(userRole = 'consumer') {
    const data = await this.request(`/bookings?role=${userRole}&status=confirmed`);
    return data.items || [];
  },

  // 3. In Progress
  async getInProgress(userRole = 'consumer') {
    const data = await this.request(`/bookings?role=${userRole}&status=in_progress`);
    return data.items || [];
  },

  // 4. Completed
  async getCompleted(userRole = 'consumer') {
    const data = await this.request(`/bookings?role=${userRole}&status=completed`);
    return data.items || [];
  },
};

// 사용 예제
const loadTabData = async (tabName, userRole = 'consumer') => {
  switch (tabName) {
    case 'awaitingBids':
      return await apiClient.getAwaitingBids();
    case 'contracted':
      return await apiClient.getContracted(userRole);
    case 'inProgress':
      return await apiClient.getInProgress(userRole);
    case 'completed':
      return await apiClient.getCompleted(userRole);
    default:
      return [];
  }
};
```

---

## 참고사항

1. **서버 URL**: `http://43.201.114.64:3000` (프로덕션)
2. **인증**: 모든 API는 JWT Bearer Token이 필요합니다.
3. **사용자 역할**: Consumer와 Provider 모두 동일한 API를 사용하되, `role` 파라미터로 구분합니다.
4. **Auction Status**: 
   - `draft`: 초안
   - `published`: 게시됨
   - `bidding`: 입찰 중
   - `reviewing`: 검토 중
   - `selected`: 선택됨
   - `expired`: 만료됨
   - `cancelled`: 취소됨
5. **Booking Status**:
   - `pending_payment`: 결제 대기
   - `confirmed`: 계약 완료 (확정됨)
   - `in_progress`: 진행 중
   - `completed`: 완료됨
   - `cancelled`: 취소됨
   - `disputed`: 분쟁 중

---

## 주의사항

현재 `bookings` API에 `status` 쿼리 파라미터가 없을 수 있습니다. 만약 API가 status 필터를 지원하지 않는다면, 백엔드에 status 필터 기능을 추가해야 합니다.

