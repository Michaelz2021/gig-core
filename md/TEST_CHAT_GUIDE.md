# 채팅 기능 테스트 가이드

## 현재 사용자 정보

### 사용자 1: Consumer
- **Email**: `test@example.com`
- **Password**: `Test1234!`
- **User ID**: `41ea62f4-8329-42ef-a9e3-b38360c76626`
- **Type**: consumer

### 사용자 2: Provider
- **Email**: `provider@example.com`
- **Password**: `Provider1234!`
- **User ID**: `a98a4eb5-4b1e-4851-99c6-f92806ae5f61`
- **Type**: provider

---

## 빠른 테스트 방법

### 1. 로그인하여 토큰 받기

**사용자 1 (Consumer):**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!"
  }' | jq -r '.data.accessToken'
```

**사용자 2 (Provider):**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "provider@example.com",
    "password": "Provider1234!"
  }' | jq -r '.data.accessToken'
```

### 2. 사용자 검색 (수정 필요)

현재 데이터베이스 스키마와 엔티티가 일치하지 않아 검색 기능이 작동하지 않을 수 있습니다.

**대안**: 직접 User ID 사용
- User 1 ID: `41ea62f4-8329-42ef-a9e3-b38360c76626`
- User 2 ID: `a98a4eb5-4b1e-4851-99c6-f92806ae5f61`

### 3. 채팅방 생성

```bash
# USER1_TOKEN과 USER2_ID를 위에서 받은 값으로 교체
curl -X POST http://localhost:3000/api/v1/messages/chat-rooms \
  -H "Authorization: Bearer {USER1_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "otherUserId": "a98a4eb5-4b1e-4851-99c6-f92806ae5f61"
  }' | jq '.'
```

### 4. 메시지 전송 (REST API)

```bash
# ROOM_ID를 위에서 받은 값으로 교체
curl -X POST http://localhost:3000/api/v1/messages/chats/{ROOM_ID}/messages \
  -H "Authorization: Bearer {USER1_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello from Consumer!",
    "type": "TEXT"
  }' | jq '.'
```

### 5. 메시지 조회

```bash
curl -X GET "http://localhost:3000/api/v1/messages/chats/{ROOM_ID}/messages?page=1&limit=10" \
  -H "Authorization: Bearer {USER1_TOKEN}" | jq '.'
```

---

## WebSocket 테스트

### Node.js로 테스트

```bash
cd /var/www/gig-core
node test-websocket.js
```

### 브라우저 콘솔에서 테스트

```javascript
// 1. Socket.io 클라이언트 로드 (CDN)
// <script src="https://cdn.socket.io/4.5.0/socket.io.min.js"></script>

// 2. 로그인하여 토큰 받기
const loginResponse = await fetch('http://localhost:3000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'Test1234!'
  })
});
const { data } = await loginResponse.json();
const token = data.accessToken;

// 3. WebSocket 연결
const socket = io('http://localhost:3000/chat', {
  auth: { token }
});

// 4. 연결 확인
socket.on('connect', () => {
  console.log('✅ 연결 성공!');
  
  // 룸 참여 (ROOM_ID 필요)
  socket.emit('room:join', { roomId: 'ROOM_ID' });
});

// 5. 메시지 수신
socket.on('message:new', (message) => {
  console.log('📨 새 메시지:', message);
});

// 6. 메시지 전송
socket.emit('message:send', {
  roomId: 'ROOM_ID',
  content: 'Hello from browser!',
  messageType: 'TEXT'
});
```

---

## 데이터베이스 스키마 이슈

현재 데이터베이스에 `chat_rooms` 테이블이 없습니다. 다음 중 하나를 선택하세요:

### 옵션 1: DB_SYNCHRONIZE 활성화 (개발 환경)

`.env` 파일에 추가:
```env
DB_SYNCHRONIZE=true
```

서버 재시작 시 자동으로 테이블이 생성됩니다.

### 옵션 2: 수동 테이블 생성

```sql
-- chat_rooms 테이블 생성
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_type VARCHAR(20) DEFAULT 'direct',
  user1_id UUID,
  user2_id UUID,
  related_booking_id UUID,
  related_auction_id UUID,
  status VARCHAR(20) DEFAULT 'active',
  last_message_at TIMESTAMP,
  unread_count_user1 INTEGER DEFAULT 0,
  unread_count_user2 INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- messages 테이블 업데이트 (room_id 추가)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS room_id UUID;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'text';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_url VARCHAR(500);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_type VARCHAR(50);
```

---

## 간단한 테스트 스크립트

```bash
#!/bin/bash

# 1. 로그인
USER1_TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}' \
  | jq -r '.data.accessToken')

USER2_TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"provider@example.com","password":"Provider1234!"}' \
  | jq -r '.data.accessToken')

echo "User 1 Token: ${USER1_TOKEN:0:50}..."
echo "User 2 Token: ${USER2_TOKEN:0:50}..."

# 2. 채팅방 생성
ROOM_ID=$(curl -s -X POST http://localhost:3000/api/v1/messages/chat-rooms \
  -H "Authorization: Bearer ${USER1_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"otherUserId":"a98a4eb5-4b1e-4851-99c6-f92806ae5f61"}' \
  | jq -r '.id // .data.id')

echo "Room ID: $ROOM_ID"

# 3. 메시지 전송
curl -X POST http://localhost:3000/api/v1/messages/chats/${ROOM_ID}/messages \
  -H "Authorization: Bearer ${USER1_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello!","type":"TEXT"}' | jq '.'
```

---

## 문제 해결

### "chat_rooms does not exist" 오류
→ DB_SYNCHRONIZE=true 설정 또는 수동 테이블 생성 필요

### "User not found or inactive" 오류
→ JWT Strategy 수정 완료, 서버 재시작 필요

### "trust_score does not exist" 오류
→ users.service.ts의 searchUsers 메서드 수정 완료

