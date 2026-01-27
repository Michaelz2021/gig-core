#!/bin/bash

# 실시간 채팅 테스트 스크립트
# 두 사용자(test@example.com, provider@example.com)로 채팅 테스트

BASE_URL="http://localhost:3000/api/v1"
TIMESTAMP=$(date +%s)

echo "=========================================="
echo "실시간 채팅 테스트"
echo "=========================================="
echo ""

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 사용자 1: test@example.com (Consumer)
echo -e "${BLUE}=== 사용자 1: test@example.com (Consumer) ===${NC}"
echo "로그인 중..."
USER1_LOGIN=$(curl -s -X POST ${BASE_URL}/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!"
  }')

USER1_TOKEN=$(echo "$USER1_LOGIN" | jq -r '.accessToken // .data.accessToken // empty')
USER1_ID=$(echo "$USER1_LOGIN" | jq -r '.user.id // .data.user.id // empty')

if [ -z "$USER1_TOKEN" ] || [ "$USER1_TOKEN" = "null" ]; then
  echo "❌ 사용자 1 로그인 실패"
  echo "$USER1_LOGIN" | jq '.'
  exit 1
fi

echo -e "${GREEN}✅ 로그인 성공${NC}"
echo "Token: ${USER1_TOKEN:0:50}..."
echo "User ID: $USER1_ID"
echo ""

# 사용자 2: provider@example.com (Provider)
echo -e "${BLUE}=== 사용자 2: provider@example.com (Provider) ===${NC}"
echo "로그인 중..."
USER2_LOGIN=$(curl -s -X POST ${BASE_URL}/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "provider@example.com",
    "password": "Provider1234!"
  }')

USER2_TOKEN=$(echo "$USER2_LOGIN" | jq -r '.accessToken // .data.accessToken // empty')
USER2_ID=$(echo "$USER2_LOGIN" | jq -r '.user.id // .data.user.id // empty')

if [ -z "$USER2_TOKEN" ] || [ "$USER2_TOKEN" = "null" ]; then
  echo "❌ 사용자 2 로그인 실패"
  echo "$USER2_LOGIN" | jq '.'
  exit 1
fi

echo -e "${GREEN}✅ 로그인 성공${NC}"
echo "Token: ${USER2_TOKEN:0:50}..."
echo "User ID: $USER2_ID"
echo ""

# 사용자 검색 테스트
echo -e "${YELLOW}=== 사용자 검색 테스트 ===${NC}"
echo "사용자 1이 사용자 2를 검색..."
SEARCH_RESULT=$(curl -s -X GET "${BASE_URL}/users/search?q=provider" \
  -H "Authorization: Bearer ${USER1_TOKEN}")

echo "$SEARCH_RESULT" | jq '.'
echo ""

# 채팅방 생성/조회
echo -e "${YELLOW}=== 채팅방 생성/조회 ===${NC}"
echo "사용자 1이 사용자 2와의 채팅방 생성..."
ROOM_RESPONSE=$(curl -s -X POST ${BASE_URL}/messages/chat-rooms \
  -H "Authorization: Bearer ${USER1_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"otherUserId\": \"${USER2_ID}\"
  }")

ROOM_ID=$(echo "$ROOM_RESPONSE" | jq -r '.id // .data.id // empty')

if [ -z "$ROOM_ID" ] || [ "$ROOM_ID" = "null" ]; then
  echo "❌ 채팅방 생성 실패"
  echo "$ROOM_RESPONSE" | jq '.'
  exit 1
fi

echo -e "${GREEN}✅ 채팅방 생성 성공${NC}"
echo "Room ID: $ROOM_ID"
echo "$ROOM_RESPONSE" | jq '.'
echo ""

# REST API로 메시지 전송 테스트
echo -e "${YELLOW}=== REST API 메시지 전송 테스트 ===${NC}"
echo "사용자 1이 메시지 전송 (REST API)..."
MESSAGE1=$(curl -s -X POST ${BASE_URL}/messages/chats/${ROOM_ID}/messages \
  -H "Authorization: Bearer ${USER1_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello! This is a test message from consumer.",
    "type": "TEXT"
  }')

echo "$MESSAGE1" | jq '.'
echo ""

echo "사용자 2가 메시지 전송 (REST API)..."
MESSAGE2=$(curl -s -X POST ${BASE_URL}/messages/chats/${ROOM_ID}/messages \
  -H "Authorization: Bearer ${USER2_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hi! This is a reply from provider.",
    "type": "TEXT"
  }')

echo "$MESSAGE2" | jq '.'
echo ""

# 메시지 목록 조회
echo -e "${YELLOW}=== 메시지 목록 조회 ===${NC}"
echo "사용자 1의 메시지 목록..."
MESSAGES=$(curl -s -X GET "${BASE_URL}/messages/chats/${ROOM_ID}/messages?page=1&limit=10" \
  -H "Authorization: Bearer ${USER1_TOKEN}")

echo "$MESSAGES" | jq '.'
echo ""

# 채팅 목록 조회
echo -e "${YELLOW}=== 채팅 목록 조회 ===${NC}"
echo "사용자 1의 채팅 목록..."
CHATS=$(curl -s -X GET ${BASE_URL}/messages/chats \
  -H "Authorization: Bearer ${USER1_TOKEN}")

echo "$CHATS" | jq '.'
echo ""

echo "=========================================="
echo -e "${GREEN}✅ REST API 테스트 완료!${NC}"
echo "=========================================="
echo ""
echo -e "${YELLOW}WebSocket 테스트를 위해서는:${NC}"
echo ""
echo "1. Node.js로 WebSocket 클라이언트 실행:"
echo "   node test-websocket.js"
echo ""
echo "2. 또는 브라우저 콘솔에서:"
echo "   const socket = io('http://localhost:3000/chat', {"
echo "     auth: { token: '${USER1_TOKEN:0:50}...' }"
echo "   });"
echo ""
echo "=========================================="
echo "테스트 정보:"
echo "=========================================="
echo "사용자 1 (Consumer):"
echo "  Email: test@example.com"
echo "  Token: ${USER1_TOKEN:0:50}..."
echo "  User ID: $USER1_ID"
echo ""
echo "사용자 2 (Provider):"
echo "  Email: provider@example.com"
echo "  Token: ${USER2_TOKEN:0:50}..."
echo "  User ID: $USER2_ID"
echo ""
echo "채팅방 ID: $ROOM_ID"
echo "=========================================="

