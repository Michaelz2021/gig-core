#!/bin/bash
# 간단한 채팅 테스트

BASE_URL="http://localhost:3000/api/v1"
USER2_ID="a98a4eb5-4b1e-4851-99c6-f92806ae5f61"

echo "=== 빠른 채팅 테스트 ==="
echo ""

# 사용자 1 로그인
echo "1. 사용자 1 로그인..."
USER1_TOKEN=$(curl -s -X POST ${BASE_URL}/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}' \
  | jq -r '.data.accessToken')

if [ -z "$USER1_TOKEN" ] || [ "$USER1_TOKEN" = "null" ]; then
  echo "❌ 로그인 실패"
  exit 1
fi
echo "✅ 로그인 성공"
echo ""

# 채팅방 생성
echo "2. 채팅방 생성..."
ROOM_RESPONSE=$(curl -s -X POST ${BASE_URL}/messages/chat-rooms \
  -H "Authorization: Bearer ${USER1_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"otherUserId\":\"${USER2_ID}\"}")

ROOM_ID=$(echo "$ROOM_RESPONSE" | jq -r '.id // .data.id // empty')

if [ -z "$ROOM_ID" ] || [ "$ROOM_ID" = "null" ]; then
  echo "❌ 채팅방 생성 실패"
  echo "$ROOM_RESPONSE" | jq '.'
  echo ""
  echo "💡 해결 방법:"
  echo "   .env 파일에 DB_SYNCHRONIZE=true 추가 후 서버 재시작"
  exit 1
fi

echo "✅ 채팅방 생성 성공: $ROOM_ID"
echo ""

# 메시지 전송
echo "3. 메시지 전송..."
MESSAGE=$(curl -s -X POST ${BASE_URL}/messages/chats/${ROOM_ID}/messages \
  -H "Authorization: Bearer ${USER1_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello! This is a test message.","type":"TEXT"}')

echo "$MESSAGE" | jq '.'
echo ""

echo "✅ 테스트 완료!"
echo ""
echo "WebSocket 테스트:"
echo "  node test-websocket.js"
