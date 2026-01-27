#!/bin/bash
# 전체 채팅 기능 테스트 (REST API + 메시지 조회)

BASE_URL="http://localhost:3000/api/v1"
USER2_ID="a98a4eb5-4b1e-4851-99c6-f92806ae5f61"

echo "=========================================="
echo "전체 채팅 기능 테스트"
echo "=========================================="
echo ""

# 사용자 1 로그인
echo "1. 사용자 1 (Consumer) 로그인..."
USER1_LOGIN=$(curl -s -X POST ${BASE_URL}/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}')
USER1_TOKEN=$(echo "$USER1_LOGIN" | jq -r '.data.accessToken')
USER1_ID=$(echo "$USER1_LOGIN" | jq -r '.data.user.id')
echo "✅ 로그인 성공 (User ID: $USER1_ID)"
echo ""

# 사용자 2 로그인
echo "2. 사용자 2 (Provider) 로그인..."
USER2_LOGIN=$(curl -s -X POST ${BASE_URL}/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"provider@example.com","password":"Provider1234!"}')
USER2_TOKEN=$(echo "$USER2_LOGIN" | jq -r '.data.accessToken')
echo "✅ 로그인 성공"
echo ""

# 채팅방 생성
echo "3. 채팅방 생성..."
ROOM_RESPONSE=$(curl -s -X POST ${BASE_URL}/messages/chat-rooms \
  -H "Authorization: Bearer ${USER1_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"otherUserId\":\"${USER2_ID}\"}")
ROOM_ID=$(echo "$ROOM_RESPONSE" | jq -r '.id // .data.id')
echo "✅ 채팅방 생성 성공 (Room ID: $ROOM_ID)"
echo ""

# 메시지 전송 (사용자 1)
echo "4. 사용자 1이 메시지 전송..."
MESSAGE1=$(curl -s -X POST ${BASE_URL}/messages/chats/${ROOM_ID}/messages \
  -H "Authorization: Bearer ${USER1_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello! This is a test message from consumer.","type":"TEXT"}')
echo "$MESSAGE1" | jq '.'
echo ""

# 메시지 전송 (사용자 2)
echo "5. 사용자 2가 메시지 전송..."
MESSAGE2=$(curl -s -X POST ${BASE_URL}/messages/chats/${ROOM_ID}/messages \
  -H "Authorization: Bearer ${USER2_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hi! This is a reply from provider.","type":"TEXT"}')
echo "$MESSAGE2" | jq '.'
echo ""

# 메시지 목록 조회
echo "6. 메시지 목록 조회 (사용자 1)..."
MESSAGES=$(curl -s -X GET "${BASE_URL}/messages/chats/${ROOM_ID}/messages?page=1&limit=10" \
  -H "Authorization: Bearer ${USER1_TOKEN}")
echo "$MESSAGES" | jq '.'
echo ""

# 채팅 목록 조회
echo "7. 채팅 목록 조회 (사용자 1)..."
CHATS=$(curl -s -X GET ${BASE_URL}/messages/chats \
  -H "Authorization: Bearer ${USER1_TOKEN}")
echo "$CHATS" | jq '.'
echo ""

echo "=========================================="
echo "✅ 모든 테스트 완료!"
echo "=========================================="
echo ""
echo "WebSocket 실시간 테스트:"
echo "  node test-websocket.js"
echo ""
