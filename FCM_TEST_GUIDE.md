# FCM 테스트 가이드

## 1. 환경 변수 설정 확인

`.env` 파일에 다음 Firebase 설정이 있는지 확인하세요:

```env
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

## 2. 디바이스 토큰 가져오기

### Android 앱에서:
1. 앱에서 FCM 토큰을 가져옵니다
2. 토큰을 서버에 등록합니다 (예: `/api/v1/users/me/device-token` 엔드포인트)

### 테스트용 더미 토큰:
실제 디바이스가 없을 경우, Firebase Console에서 테스트 토큰을 생성하거나 앱에서 로그로 확인할 수 있습니다.

## 3. API 테스트 방법

### 방법 1: cURL 사용

```bash
# JWT 토큰을 먼저 가져옵니다 (로그인 API 사용)
TOKEN="your_jwt_token_here"

# FCM 테스트 알림 전송
curl -X POST http://43.201.114.64:3000/api/v1/notifications/test/push \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "deviceTokens": ["your-device-token-here"],
    "title": "테스트 알림",
    "body": "이것은 FCM 테스트 알림입니다.",
    "data": {
      "requestId": "REQ-2025-001234",
      "category": "Home Services"
    }
  }'
```

### 방법 2: Postman 사용

1. **URL**: `POST http://43.201.114.64:3000/api/v1/notifications/test/push`
2. **Headers**:
   - `Content-Type: application/json`
   - `Authorization: Bearer YOUR_JWT_TOKEN`
3. **Body** (JSON):
```json
{
  "deviceTokens": ["your-device-token-1", "your-device-token-2"],
  "title": "새 경매 알림",
  "body": "Makati City에서 Aircon Cleaning 서비스 경매가 시작되었습니다.",
  "data": {
    "requestId": "REQ-2025-001234",
    "category": "Home Services - Aircon",
    "location": "Makati City",
    "deadline": "2025-12-26T18:00:00Z"
  }
}
```

### 방법 3: Swagger UI 사용

1. 브라우저에서 `http://43.201.114.64:3000/api-docs` 접속
2. `notifications` 섹션에서 `POST /api/v1/notifications/test/push` 찾기
3. "Authorize" 버튼 클릭하여 JWT 토큰 입력
4. Request body에 위의 JSON 데이터 입력
5. "Execute" 클릭

## 4. 응답 예시

### 성공 응답:
```json
{
  "success": 1,
  "failure": 0,
  "errors": []
}
```

### 실패 응답 (유효하지 않은 토큰):
```json
{
  "success": 0,
  "failure": 1,
  "errors": [
    {
      "token": "invalid-token",
      "error": {
        "code": "messaging/invalid-registration-token",
        "message": "The registration token is not a valid FCM registration token"
      }
    }
  ]
}
```

## 5. 로그 확인

서버 로그에서 FCM 전송 결과를 확인할 수 있습니다:

```bash
# PM2 로그 확인
pm2 logs gig-core --lines 50

# 또는 실시간 로그
pm2 logs gig-core --follow
```

예상 로그:
- `Firebase Admin SDK initialized successfully` - Firebase 초기화 성공
- `Push notification sent: 1 success, 0 failure` - 알림 전송 성공
- `Invalid or unregistered token: xxx` - 유효하지 않은 토큰 경고

## 6. 문제 해결

### Firebase credentials not found 경고
- `.env` 파일에 Firebase 설정이 없거나 잘못되었습니다
- 환경 변수를 확인하고 서버를 재시작하세요

### Invalid registration token 에러
- 디바이스 토큰이 유효하지 않거나 만료되었습니다
- 앱에서 새로운 토큰을 가져와야 합니다

### Firebase 초기화 실패
- `FIREBASE_PRIVATE_KEY`의 줄바꿈 문자(`\n`)가 올바르게 이스케이프되었는지 확인
- Private key가 전체 키(시작/끝 라인 포함)인지 확인

## 7. 실제 사용 예시

### 경매 알림 전송:
```typescript
// NotificationsService에서 사용
const deviceTokens = user.deviceTokens || [];
if (deviceTokens.length > 0) {
  await this.fcmService.sendPushNotification(deviceTokens, {
    title: 'New Auction: Aircon Cleaning Service',
    body: 'Makati City • Budget: ₱1,500-2,000 • Deadline: 24 hrs',
    data: {
      requestId: 'REQ-2025-001234',
      category: 'Home Services - Aircon',
      location: 'Makati City',
      deadline: '2025-12-26T18:00:00Z',
    },
  });
}
```

