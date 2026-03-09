# Provider 프로필(테이블) API

Provider **테이블**(`providers`) 정보를 조회·갱신하기 위한 API 명세입니다.  
앱에서 제공자(provider) 프로필을 채우거나 수정할 때 사용합니다.

- **Base URL**: `{API_BASE}/api/v1` (예: `https://your-domain.com/api/v1`)
- **인증**: `Authorization: Bearer <access-token>` (JWT 필수)

---

## 1. Provider 테이블 조회

Provider ID로 `providers` 테이블 기반 프로필(및 연관 데이터)을 조회합니다.

### GET `/users/providers_profile/:id`

| 구분 | 내용 |
|------|------|
| **Path** | `id` – Provider UUID |
| **Response** | 200: 프로필 객체 (providerId, userId, businessName, certifications, portfolio 등) |
| **Error** | 404: Provider not found |

**예시 요청**

```http
GET /api/v1/users/providers_profile/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <access-token>
```

---

## 2. Provider 테이블 업데이트 (채우기/수정)

Provider ID에 해당하는 `providers` 테이블 행을 업데이트합니다.  
**보내준 필드만** 갱신되고, 나머지는 기존 값 유지됩니다.

### POST `/users/providers_profile/:id`

| 구분 | 내용 |
|------|------|
| **Path** | `id` – Provider UUID |
| **Body** | JSON. 아래 필드 모두 **선택(optional)**. |
| **Response** | 200: 갱신된 Provider 엔티티 (id, userId, businessName, updatedAt 등) |
| **Error** | 404: Provider not found / 400: Validation error |

#### Request Body (모든 필드 선택)

| 필드 | 타입 | 설명 |
|------|------|------|
| `businessName` | string | 사업자명 |
| `businessType` | `"individual"` \| `"company"` | 사업자 유형 |
| `governmentIdType` | string | 신분증 유형 (예: Driver's License, UMID, SSS) |
| `governmentIdNumber` | string | 신분증 번호 |
| `tinNumber` | string | 납세자 번호 (TIN) |
| `yearsOfExperience` | number | 경력 연수 (≥0) |
| `certifications` | array | 자격증 목록. 각 항목: `{ name?, issuer?, issueDate?, expiryDate?, certificateUrl? }` |
| `portfolioPhotos` | array | 포트폴리오 사진. 각 항목: `{ url?, caption?, uploadedAt? }` (최소 3장 권장) |
| `isAvailable` | boolean | 현재 가용 여부 |
| `availableDays` | number[] | 가용 요일 (1=월 ~ 7=일), 최대 7개 |
| `availableHoursStart` | string | 가용 시간 시작 (예: `"09:00"`) |
| `availableHoursEnd` | string | 가용 시간 종료 (예: `"18:00"`) |
| `instantBookingEnabled` | boolean | 즉시 예약 허용 여부 |
| `serviceRadiusKm` | number | 서비스 반경(km), 1~500 |
| `responseTimeMinutes` | number | 평균 응답 시간(분), ≥0 |
| `completionRate` | number | 완료율(%), 0~100 |
| `totalJobsCompleted` | number | 총 완료 작업 수, ≥0 |
| `isActive` | boolean | 활성화 여부 |
| `isFeatured` | boolean | 추천 제공자 여부 |
| `notificationPreferences` | object | 알림 설정: `pushEnabled?`, `smsEnabled?`, `emailEnabled?`, `auctionNotifications?`, `minTrustScoreThreshold?`, `preferredCategories?` (string[]), `maxDistanceKm?` |

**예시 요청**

```http
POST /api/v1/users/providers_profile/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "businessName": "Professional Services Co.",
  "businessType": "individual",
  "yearsOfExperience": 5,
  "isAvailable": true,
  "availableDays": [1, 2, 3, 4, 5],
  "availableHoursStart": "09:00",
  "availableHoursEnd": "18:00",
  "instantBookingEnabled": false,
  "serviceRadiusKm": 15,
  "certifications": [
    {
      "name": "Professional License",
      "issuer": "PRC",
      "issueDate": "2020-01-01",
      "expiryDate": "2025-12-31",
      "certificateUrl": "https://example.com/cert.pdf"
    }
  ],
  "portfolioPhotos": [
    { "url": "https://example.com/1.jpg", "caption": "Project A", "uploadedAt": "2026-01-01T00:00:00Z" },
    { "url": "https://example.com/2.jpg", "caption": "Project B", "uploadedAt": "2026-01-01T00:00:00Z" },
    { "url": "https://example.com/3.jpg", "caption": "Project C", "uploadedAt": "2026-01-01T00:00:00Z" }
  ]
}
```

**예시 응답 (200)**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "41ea62f4-8329-42ef-a9e3-b38360c76626",
  "businessName": "Professional Services Co.",
  "businessType": "individual",
  "yearsOfExperience": 5,
  "isAvailable": true,
  "availableDays": [1, 2, 3, 4, 5],
  "availableHoursStart": "09:00",
  "availableHoursEnd": "18:00",
  "instantBookingEnabled": false,
  "serviceRadiusKm": 15,
  "certifications": [...],
  "portfolioPhotos": [...],
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-02-14T12:00:00.000Z"
}
```

---

## 3. Swagger에서 테스트

- Swagger UI: `{API_BASE}/api/docs` (또는 프로젝트에 설정된 Swagger 경로)
- **users** 태그 아래에서 다음 항목 사용:
  - **GET** `users/providers_profile/{id}` – Provider 테이블 조회
  - **POST** `users/providers_profile/{id}` – Provider 테이블 업데이트 (Body: `UpdateProviderProfileDto`)

`Try it out`으로 `id`와 Body를 채운 뒤 요청하면 됩니다.
