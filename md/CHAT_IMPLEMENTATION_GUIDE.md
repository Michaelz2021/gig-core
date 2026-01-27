# 실시간 채팅 구현 가이드

## 구현 완료 사항

### ✅ 1. WebSocket Gateway (실시간 통신)
- **파일**: `src/modules/messages/gateways/chat.gateway.ts`
- **기능**:
  - JWT 인증 기반 WebSocket 연결
  - 실시간 메시지 전송/수신
  - 오프라인 메시지 큐 (Redis)
  - 타이핑 인디케이터
  - 온라인 상태 관리
  - 룸 구독/해제

### ✅ 2. 사용자 검색 기능
- **엔드포인트**: `GET /api/v1/users/search?q={query}&limit={limit}`
- **기능**:
  - 이메일, 이름, 전화번호, 사용자 ID로 검색
  - 활성 사용자만 검색
  - 프로필 정보 포함

### ✅ 3. 오프라인 메시지 큐
- **구현**: Redis List 사용
- **동작**:
  - 오프라인 사용자에게 메시지 전송 시 Redis에 저장
  - 사용자 온라인 시 자동 전달
  - 24시간 보관 후 자동 삭제

### ✅ 4. 파일/이미지 첨부
- **지원 타입**: TEXT, IMAGE, FILE
- **자동 감지**: 파일 확장자로 이미지/파일 자동 구분
- **통합**: 기존 Upload 서비스와 연동

---

## WebSocket 연결 방법

### 클라이언트 연결

```javascript
import io from 'socket.io-client';

// JWT 토큰으로 연결
const socket = io('http://localhost:3000/chat', {
  auth: {
    token: 'your_jwt_token_here'
  },
  // 또는 헤더로 전달
  extraHeaders: {
    Authorization: 'Bearer your_jwt_token_here'
  }
});

// 연결 성공
socket.on('connect', () => {
  console.log('Connected to chat server');
});

// 오프라인 메시지 수신
socket.on('messages:offline', (messages) => {
  console.log('Offline messages:', messages);
  // 메시지들을 UI에 표시
});
```

---

## WebSocket 이벤트

### 클라이언트 → 서버

#### 1. 메시지 전송
```javascript
socket.emit('message:send', {
  roomId: 'chat-room-id',
  content: 'Hello!',
  messageType: 'TEXT', // 'TEXT', 'IMAGE', 'FILE'
  attachmentUrl: 'https://example.com/image.jpg' // 선택사항
});
```

#### 2. 메시지 읽음 표시
```javascript
socket.emit('message:read', {
  messageId: 'message-id'
});
```

#### 3. 타이핑 시작
```javascript
socket.emit('typing:start', {
  roomId: 'chat-room-id'
});
```

#### 4. 타이핑 중지
```javascript
socket.emit('typing:stop', {
  roomId: 'chat-room-id'
});
```

#### 5. 룸 참여
```javascript
socket.emit('room:join', {
  roomId: 'chat-room-id'
});
```

#### 6. 룸 나가기
```javascript
socket.emit('room:leave', {
  roomId: 'chat-room-id'
});
```

### 서버 → 클라이언트

#### 1. 새 메시지 수신
```javascript
socket.on('message:new', (data) => {
  console.log('New message:', data);
  // {
  //   messageId: 'uuid',
  //   roomId: 'chat-room-id',
  //   senderId: 'user-id',
  //   content: 'Message text',
  //   messageType: 'TEXT',
  //   attachmentUrl: 'url',
  //   timestamp: '2025-11-22T...'
  // }
});
```

#### 2. 타이핑 시작 알림
```javascript
socket.on('typing:start', (data) => {
  // { roomId, userId }
  // 상대방이 타이핑 중임을 표시
});
```

#### 3. 타이핑 중지 알림
```javascript
socket.on('typing:stop', (data) => {
  // { roomId, userId }
  // 타이핑 인디케이터 제거
});
```

#### 4. 사용자 온라인
```javascript
socket.on('user:online', (data) => {
  // { userId }
  // 온라인 상태 업데이트
});
```

#### 5. 사용자 오프라인
```javascript
socket.on('user:offline', (data) => {
  // { userId }
  // 오프라인 상태 업데이트
});
```

#### 6. 오프라인 메시지 배치
```javascript
socket.on('messages:offline', (messages) => {
  // [ { messageId, roomId, senderId, content, ... }, ... ]
  // 오프라인 중 받은 모든 메시지
});
```

---

## REST API 사용법

### 1. 사용자 검색
```bash
GET /api/v1/users/search?q=john&limit=20
Authorization: Bearer {token}

# 응답
{
  "users": [
    {
      "id": "user-id",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+639123456789",
      "profileImage": "url",
      "userType": "provider",
      "trustScore": 85.5,
      "fullName": "John Doe"
    }
  ],
  "total": 1
}
```

### 2. 채팅방 생성/조회
```bash
POST /api/v1/messages/chat-rooms
Authorization: Bearer {token}
Content-Type: application/json

{
  "otherUserId": "user-id",
  "bookingId": "booking-id" // 선택사항
}

# 응답
{
  "id": "room-id",
  "user1Id": "your-id",
  "user2Id": "other-user-id",
  ...
}
```

### 3. 메시지 전송 (REST - 오프라인 대비)
```bash
POST /api/v1/messages/chats/{chatId}/messages
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Hello!",
  "type": "TEXT",
  "attachmentUrl": "https://example.com/file.jpg" // 선택사항
}
```

### 4. 파일 업로드 후 메시지 전송
```bash
# Step 1: 파일 업로드
POST /api/v1/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [file]
type: IMAGE
purpose: PROJECT

# 응답
{
  "fileId": "file-id",
  "fileUrl": "/uploads/file.jpg",
  ...
}

# Step 2: 메시지 전송 (WebSocket 또는 REST)
socket.emit('message:send', {
  roomId: 'chat-room-id',
  content: 'Check this image',
  attachmentUrl: '/uploads/file.jpg',
  messageType: 'IMAGE'
});
```

### 5. 채팅 목록 조회
```bash
GET /api/v1/messages/chats
Authorization: Bearer {token}

# 응답
{
  "chats": [
    {
      "chatId": "room-id",
      "participantId": "other-user-id",
      "participantName": "John Doe",
      "participantImage": "url",
      "lastMessage": "Hello!",
      "lastMessageTime": "2025-11-22T...",
      "unreadCount": 2,
      "isOnline": false,
      "transactionId": "booking-id"
    }
  ]
}
```

### 6. 메시지 목록 조회
```bash
GET /api/v1/messages/chats/{chatId}/messages?page=1&limit=50
Authorization: Bearer {token}

# 응답
{
  "messages": [
    {
      "messageId": "msg-id",
      "senderId": "user-id",
      "senderName": "John Doe",
      "content": "Hello!",
      "type": "TEXT",
      "timestamp": "2025-11-22T...",
      "isRead": true
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 250,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 전체 플로우 예시

### 시나리오: 사용자 A가 사용자 B에게 메시지 전송

1. **사용자 검색**
   ```bash
   GET /api/v1/users/search?q=userB
   ```

2. **채팅방 생성/조회**
   ```bash
   POST /api/v1/messages/chat-rooms
   { "otherUserId": "user-b-id" }
   ```

3. **WebSocket 연결**
   ```javascript
   const socket = io('http://localhost:3000/chat', {
     auth: { token: 'jwt-token' }
   });
   ```

4. **룸 참여**
   ```javascript
   socket.emit('room:join', { roomId: 'room-id' });
   ```

5. **메시지 전송 (텍스트)**
   ```javascript
   socket.emit('message:send', {
     roomId: 'room-id',
     content: 'Hello!',
     messageType: 'TEXT'
   });
   ```

6. **메시지 전송 (이미지)**
   ```bash
   # 파일 업로드
   POST /api/v1/upload
   # → fileUrl 받음
   
   # 메시지 전송
   socket.emit('message:send', {
     roomId: 'room-id',
     content: 'Check this image',
     attachmentUrl: '/uploads/image.jpg',
     messageType: 'IMAGE'
   });
   ```

7. **메시지 수신 (사용자 B)**
   ```javascript
   socket.on('message:new', (message) => {
     // UI에 메시지 표시
   });
   ```

8. **오프라인 사용자 처리**
   - 사용자 B가 오프라인인 경우
   - 메시지는 Redis에 저장됨
   - 사용자 B가 온라인 되면 자동으로 `messages:offline` 이벤트로 전달

---

## 주요 기능

### ✅ 실시간 통신
- WebSocket 기반 양방향 통신
- JWT 인증 통합
- 자동 재연결 지원

### ✅ 오프라인 지원
- Redis 기반 메시지 큐
- 자동 전달 (온라인 시)
- 24시간 보관

### ✅ 파일/이미지 지원
- 이미지 자동 감지
- 파일 타입 구분
- 업로드 서비스 통합

### ✅ 사용자 검색
- 이메일, 이름, 전화번호, ID 검색
- 활성 사용자만 검색
- 프로필 정보 포함

### ✅ 타이핑 인디케이터
- 실시간 타이핑 상태 표시
- 자동 중지 감지

### ✅ 온라인 상태
- 실시간 온라인/오프라인 감지
- Redis 기반 상태 관리

---

## 테스트 방법

### 1. WebSocket 연결 테스트
```bash
# Socket.io 클라이언트로 테스트
npm install socket.io-client

# 또는 브라우저 콘솔
const socket = io('http://localhost:3000/chat', {
  auth: { token: 'your-jwt-token' }
});
```

### 2. 사용자 검색 테스트
```bash
curl -X GET "http://localhost:3000/api/v1/users/search?q=test" \
  -H "Authorization: Bearer {token}"
```

### 3. 메시지 전송 테스트 (REST)
```bash
curl -X POST "http://localhost:3000/api/v1/messages/chats/{chatId}/messages" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Test message",
    "type": "TEXT"
  }'
```

---

## 주의사항

1. **JWT 토큰**: WebSocket 연결 시 반드시 JWT 토큰 필요
2. **Redis**: 오프라인 메시지 큐를 위해 Redis 필수
3. **CORS**: 프로덕션에서는 CORS 설정 필요
4. **확장성**: 멀티 서버 환경에서는 Redis Pub/Sub 추가 필요

---

## 다음 단계 (선택사항)

1. **멀티 서버 지원**: Redis Adapter 추가
2. **메시지 암호화**: E2E 암호화 구현
3. **푸시 알림**: 오프라인 사용자에게 푸시 알림
4. **메시지 검색**: 메시지 내용 검색 기능
5. **읽음 확인**: 상세한 읽음 상태 (읽음, 전달됨)

