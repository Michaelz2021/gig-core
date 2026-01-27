#!/bin/bash

# 전체 등록 프로세스 테스트 스크립트 (등록 -> OTP 검증 -> 로그인)

BASE_URL="http://localhost:3000/api/v1/auth"
TIMESTAMP=$(date +%s)
EMAIL="testuser${TIMESTAMP}@example.com"
PHONE="+639123456${TIMESTAMP: -3}"

echo "=========================================="
echo "전체 등록 프로세스 테스트"
echo "=========================================="
echo "이메일: $EMAIL"
echo "전화번호: $PHONE"
echo ""

# 1. 등록 요청
echo "1. 사용자 등록 요청:"
REGISTER_RESPONSE=$(curl -s -X POST ${BASE_URL}/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${EMAIL}\",
    \"phone\": \"${PHONE}\",
    \"firstName\": \"Test\",
    \"lastName\": \"User\",
    \"password\": \"Test123!\"
  }")

echo "$REGISTER_RESPONSE" | jq '.'
echo ""

# OTP 추출 (개발 환경에서만)
OTP=$(echo "$REGISTER_RESPONSE" | jq -r '.data.otp // empty')

if [ -z "$OTP" ]; then
  echo "⚠️  OTP가 응답에 없습니다. NODE_ENV=development로 설정되어 있는지 확인하세요."
  echo "Redis에서 OTP를 확인하거나, 수동으로 입력하세요:"
  read -p "OTP를 입력하세요: " OTP
else
  echo "✅ OTP: $OTP"
fi

echo ""
echo "---"
echo ""

# 2. OTP 검증
echo "2. OTP 검증:"
VERIFY_RESPONSE=$(curl -s -X POST ${BASE_URL}/verify-otp \
  -H "Content-Type: application/json" \
  -d "{
    \"phone\": \"${PHONE}\",
    \"otp\": \"${OTP}\"
  }")

echo "$VERIFY_RESPONSE" | jq '.'
echo ""

# 사용자 생성 확인
if echo "$VERIFY_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo "✅ 사용자 계정이 생성되었습니다!"
  USER_ID=$(echo "$VERIFY_RESPONSE" | jq -r '.data.user.id')
  echo "사용자 ID: $USER_ID"
else
  echo "❌ OTP 검증 실패"
  exit 1
fi

echo ""
echo "---"
echo ""

# 3. 로그인 테스트
echo "3. 로그인 테스트:"
LOGIN_RESPONSE=$(curl -s -X POST ${BASE_URL}/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${EMAIL}\",
    \"password\": \"Test123!\"
  }")

echo "$LOGIN_RESPONSE" | jq '.'

if echo "$LOGIN_RESPONSE" | jq -e '.accessToken' > /dev/null; then
  echo ""
  echo "✅ 로그인 성공!"
  ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken')
  echo "Access Token: ${ACCESS_TOKEN:0:50}..."
else
  echo ""
  echo "❌ 로그인 실패"
  exit 1
fi

echo ""
echo "=========================================="
echo "테스트 완료!"
echo "=========================================="

