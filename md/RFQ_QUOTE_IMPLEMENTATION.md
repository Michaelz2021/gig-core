# RFQ 및 Quote 구현 가이드

이 문서는 구매자(Consumer)의 RFQ(Request for Quotation) 요청과 서비스 제공자(Provider)의 Quote 제출 기능 구현을 설명합니다.

---

## 개요

### 기능 요약
1. **구매자가 RFQ 생성**: 서비스 요청 시 RFQ ID에 따른 S3 저장소 공간 자동 생성
2. **서비스 제공자가 Quote 제출**: RFQ에 대한 Quote 작성 및 구매자 지정
3. **S3 저장**: Quote는 RFQ의 S3 폴더에 자동 저장
4. **알림 발송**: 구매자는 Quote 수신 시 알림을 받음

---

## 데이터베이스 구조

### RFQ 엔티티 (`rfqs` 테이블)
- `id`: UUID (Primary Key)
- `rfqNumber`: 고유 RFQ 번호
- `consumerId`: 구매자 ID
- `serviceType`: 서비스 유형
- `title`: 제목
- `description`: 설명
- `budgetMin`/`budgetMax`: 예산 범위
- `timeline`: 타임라인
- `preferredSchedule`: 선호 일정
- `requirements`: 요구사항 배열
- `location`: 서비스 위치
- `photos`: 사진 URL 배열
- `documents`: 문서 URL 배열
- `status`: OPEN, CLOSED, CANCELLED
- `s3FolderPath`: S3 폴더 경로 (예: `rfqs/{rfqId}/`)
- `createdAt`, `updatedAt`: 타임스탬프

### Quote 엔티티 (`quotes` 테이블) - 업데이트됨
- 기존 필드 유지
- **추가된 필드**:
  - `rfqId`: RFQ ID (선택사항, RFQ에 대한 Quote인 경우)
  - `s3FilePath`: S3 파일 경로 (Quote 문서 저장 위치)

---

## API 엔드포인트

### RFQ API

#### 1. RFQ 생성
```http
POST /api/v1/rfqs
Authorization: Bearer {token}
Content-Type: application/json

{
  "serviceType": "plumbing",
  "title": "Kitchen sink repair",
  "description": "Need to fix leaking kitchen sink",
  "budgetMin": 100,
  "budgetMax": 500,
  "timeline": "1 week",
  "preferredSchedule": "2024-01-15T10:00:00Z",
  "requirements": ["Licensed plumber", "Same day service"],
  "location": "123 Main St, City",
  "photos": ["https://..."],
  "deadline": "2024-01-20T23:59:59Z"
}
```

**응답:**
```json
{
  "id": "rfq-uuid",
  "rfqNumber": "RFQ-1234567890-abc123",
  "consumerId": "consumer-uuid",
  "serviceType": "plumbing",
  "title": "Kitchen sink repair",
  "s3FolderPath": "rfqs/rfq-uuid/",
  "status": "OPEN",
  "createdAt": "2024-01-10T10:00:00Z"
}
```

**동작:**
- RFQ 생성 시 자동으로 S3 폴더 생성: `rfqs/{rfqId}/`
- 폴더 경로가 `s3FolderPath`에 저장됨

#### 2. RFQ 목록 조회
```http
GET /api/v1/rfqs?status=OPEN&page=1&limit=20
Authorization: Bearer {token}
```

#### 3. RFQ 상세 조회
```http
GET /api/v1/rfqs/{rfqId}
Authorization: Bearer {token}
```

#### 4. RFQ 마감
```http
PATCH /api/v1/rfqs/{rfqId}/close
Authorization: Bearer {token}
```

#### 5. RFQ 취소
```http
PATCH /api/v1/rfqs/{rfqId}/cancel
Authorization: Bearer {token}
```

### Quote API

#### 1. Quote 생성 (서비스 제공자)
```http
POST /api/v1/quotes
Authorization: Bearer {token}
Content-Type: application/json

{
  "rfqId": "rfq-uuid",  // RFQ에 대한 Quote인 경우
  // 또는
  "clientId": "client-uuid",  // 직접 Quote인 경우
  
  "providerId": "provider-uuid",
  "serviceType": "plumbing",
  "title": "Kitchen sink repair quote",
  "description": "I can fix your sink for $300",
  "budget": 300,
  "timeline": "Same day",
  "preferredSchedule": "2024-01-15T14:00:00Z",
  "requirements": ["Will bring all tools"]
}
```

**응답:**
```json
{
  "id": "quote-uuid",
  "quoteNumber": "QUOTE-1234567890-xyz789",
  "rfqId": "rfq-uuid",
  "clientId": "client-uuid",
  "providerId": "provider-uuid",
  "s3FilePath": "rfqs/rfq-uuid/quotes/quote_quote-uuid.json",
  "status": "PENDING",
  "createdAt": "2024-01-10T11:00:00Z"
}
```

**동작:**
- `rfqId`가 제공된 경우:
  - RFQ에서 `clientId` 자동 추출
  - RFQ의 S3 폴더에 Quote JSON 파일 저장: `rfqs/{rfqId}/quotes/quote_{quoteId}.json`
  - `s3FilePath`에 저장 경로 기록
- 구매자에게 알림 발송 (NotificationType.QUOTE)

#### 2. Quote 목록 조회
```http
GET /api/v1/quotes?status=PENDING&page=1&limit=20
Authorization: Bearer {token}
```

#### 3. Quote 상세 조회
```http
GET /api/v1/quotes/{quoteId}
Authorization: Bearer {token}
```

---

## S3 저장소 구조

### 폴더 구조
```
s3-bucket/
└── rfqs/
    └── {rfqId}/
        ├── quotes/
        │   ├── quote_{quoteId1}.json
        │   ├── quote_{quoteId2}.json
        │   └── ...
        └── (기타 RFQ 관련 파일들)
```

### Quote JSON 파일 구조
```json
{
  "quoteId": "quote-uuid",
  "quoteNumber": "QUOTE-1234567890-xyz789",
  "providerId": "provider-uuid",
  "clientId": "client-uuid",
  "serviceType": "plumbing",
  "title": "Kitchen sink repair quote",
  "description": "I can fix your sink for $300",
  "budget": 300,
  "timeline": "Same day",
  "requirements": ["Will bring all tools"],
  "createdAt": "2024-01-10T11:00:00.000Z"
}
```

---

## 알림 시스템

### 알림 타입 추가
- `NotificationType.QUOTE`: Quote 수신 알림
- `NotificationType.RFQ`: RFQ 관련 알림 (향후 확장 가능)

### Quote 생성 시 알림
구매자가 Quote를 받으면 다음 알림이 발송됩니다:

```json
{
  "userId": "client-uuid",
  "type": "quote",
  "title": "New Quote Received",
  "message": "John Doe has submitted a quote for your request: Kitchen sink repair",
  "metadata": {
    "quoteId": "quote-uuid",
    "rfqId": "rfq-uuid",
    "providerId": "provider-uuid",
    "actionUrl": "/quotes/quote-uuid"
  }
}
```

---

## 환경 변수 설정

`.env` 파일에 다음 변수를 추가하세요:

```env
# AWS S3 설정
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_S3_BUCKET=your_s3_bucket_name
```

---

## 사용 시나리오

### 시나리오 1: RFQ를 통한 Quote 제출

1. **구매자가 RFQ 생성**
   ```bash
   POST /api/v1/rfqs
   {
     "serviceType": "plumbing",
     "title": "Kitchen sink repair",
     ...
   }
   ```
   - S3 폴더 자동 생성: `rfqs/{rfqId}/`

2. **서비스 제공자가 RFQ 확인**
   ```bash
   GET /api/v1/rfqs?status=OPEN
   ```

3. **서비스 제공자가 Quote 제출**
   ```bash
   POST /api/v1/quotes
   {
     "rfqId": "rfq-uuid",
     "providerId": "provider-uuid",
     ...
   }
   ```
   - Quote가 S3에 저장: `rfqs/{rfqId}/quotes/quote_{quoteId}.json`
   - 구매자에게 알림 발송

4. **구매자가 알림 확인 및 Quote 조회**
   ```bash
   GET /api/v1/notifications
   GET /api/v1/quotes/{quoteId}
   ```

### 시나리오 2: 직접 Quote 제출 (RFQ 없이)

1. **서비스 제공자가 직접 Quote 제출**
   ```bash
   POST /api/v1/quotes
   {
     "clientId": "client-uuid",
     "providerId": "provider-uuid",
     ...
   }
   ```
   - S3 저장 없음 (RFQ가 없으므로)
   - 구매자에게 알림 발송

---

## 주요 구현 파일

### 엔티티
- `src/modules/quotes/entities/rfq.entity.ts` - RFQ 엔티티
- `src/modules/quotes/entities/quote.entity.ts` - Quote 엔티티 (업데이트)

### DTO
- `src/modules/quotes/dto/create-rfq.dto.ts` - RFQ 생성 DTO
- `src/modules/quotes/dto/create-quote.dto.ts` - Quote 생성 DTO (업데이트)

### 서비스
- `src/modules/quotes/rfq.service.ts` - RFQ 서비스
- `src/modules/quotes/quotes.service.ts` - Quote 서비스 (업데이트)
- `src/modules/upload/s3.service.ts` - S3 서비스 (신규)

### 컨트롤러
- `src/modules/quotes/rfq.controller.ts` - RFQ 컨트롤러
- `src/modules/quotes/quotes.controller.ts` - Quote 컨트롤러 (업데이트)

### 모듈
- `src/modules/quotes/quotes.module.ts` - Quotes 모듈 (업데이트)
- `src/modules/upload/upload.module.ts` - Upload 모듈 (업데이트)

---

## 테스트 방법

### 1. RFQ 생성 테스트
```bash
# 로그인 (구매자)
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test1234!"}'

# RFQ 생성
curl -X POST http://localhost:3000/api/v1/rfqs \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceType": "plumbing",
    "title": "Kitchen sink repair",
    "description": "Need to fix leaking kitchen sink",
    "budgetMin": 100,
    "budgetMax": 500
  }'
```

### 2. Quote 제출 테스트
```bash
# 로그인 (서비스 제공자)
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "provider@example.com", "password": "Provider1234!"}'

# Quote 제출
curl -X POST http://localhost:3000/api/v1/quotes \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "rfqId": "rfq-uuid",
    "providerId": "provider-uuid",
    "serviceType": "plumbing",
    "title": "Kitchen sink repair quote",
    "description": "I can fix your sink for $300",
    "budget": 300
  }'
```

### 3. 알림 확인
```bash
# 구매자로 로그인 후 알림 확인
curl -X GET http://localhost:3000/api/v1/notifications \
  -H "Authorization: Bearer {token}"
```

---

## 주의사항

1. **S3 설정**: AWS S3 버킷이 올바르게 설정되어 있어야 합니다.
2. **권한**: RFQ는 구매자만 생성/수정할 수 있고, Quote는 서비스 제공자만 생성할 수 있습니다.
3. **RFQ와 Quote 연결**: `rfqId`를 제공하면 자동으로 `clientId`가 설정되고 S3에 저장됩니다.
4. **에러 처리**: S3 저장 실패 시에도 Quote 생성은 성공합니다 (로그만 기록).

---

## 향후 개선 사항

1. Quote 파일 첨부 기능 (PDF, 이미지 등)
2. Quote 비교 기능
3. RFQ 마감일 자동 처리
4. Quote 승인/거부 워크플로우
5. S3 파일 다운로드 API

