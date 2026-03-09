# POST /api/v1/notifications/send — 특정 사용자 알림 전송

특정 사용자에게 알림을 보냅니다. **notifications** 테이블에 저장한 뒤, 해당 사용자의 등록된 FCM 토큰으로 푸시를 발송합니다.

## 요청

- **Method**: `POST`
- **URL**: `http://43.201.114.64:3000/api/v1/notifications/send` (또는 `http://localhost:3000/api/v1/notifications/send`)
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <accessToken>` (필수, 로그인 후 발급된 JWT)

## Body (JSON)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| userId | string (UUID) | O | 알림을 받을 사용자 ID (users.id) |
| type | string | O | `booking`, `payment`, `review`, `message`, `auction`, `quote`, `rfq`, `system` 중 하나 |
| title | string | O | 알림 제목 |
| message | string | O | 알림 본문 |
| metadata | object | X | 추가 데이터 (선택) |

## 예시 요청 (curl)

```bash
# 1) 로그인하여 accessToken 발급
TOKEN=$(curl -s -X POST 'http://43.201.114.64:3000/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email":"YOUR_EMAIL","password":"YOUR_PASSWORD"}' | jq -r '.data.accessToken // .accessToken // empty')

# 2) 알림 전송 (USER_ID를 받을 사용자 UUID로 교체)
curl -s -X POST 'http://43.201.114.64:3000/api/v1/notifications/send' \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "userId": "USER_ID",
    "type": "system",
    "title": "테스트 알림 제목",
    "message": "테스트 메시지 내용입니다."
  }'
```

## 성공 응답 (200)

- `success: true`, `data`에 저장된 알림 객체 (id, userId, title, message, sentViaPush 등) 포함.

## 실패

- **401**: 토큰 없음/만료 — 로그인 후 새 accessToken 사용.
- **400**: body 검증 실패 (userId, type, title, message 등 누락/형식 오류).
