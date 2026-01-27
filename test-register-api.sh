#!/bin/bash

# 사용자 등록 API 테스트 스크립트

BASE_URL="http://localhost:3000/api/v1/auth"

echo "=========================================="
echo "사용자 등록 API 테스트"
echo "=========================================="
echo ""

# 1. 기본 등록 테스트
echo "1. 기본 등록 테스트:"
curl -X POST ${BASE_URL}/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "phone": "+639123456791",
    "firstName": "New",
    "lastName": "User",
    "password": "password123"
  }' | jq '.'
echo ""
echo "---"
echo ""

# 2. 중복 이메일 테스트
echo "2. 중복 이메일 테스트 (에러 케이스):"
curl -X POST ${BASE_URL}/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phone": "+639123456792",
    "firstName": "Duplicate",
    "lastName": "Email",
    "password": "password123"
  }' | jq '.'
echo ""
echo "---"
echo ""

# 3. 중복 전화번호 테스트
echo "3. 중복 전화번호 테스트 (에러 케이스):"
curl -X POST ${BASE_URL}/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newemail@example.com",
    "phone": "+639123456789",
    "firstName": "Duplicate",
    "lastName": "Phone",
    "password": "password123"
  }' | jq '.'
echo ""
echo "---"
echo ""

# 4. 잘못된 이메일 형식 테스트
echo "4. 잘못된 이메일 형식 테스트 (유효성 검사):"
curl -X POST ${BASE_URL}/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "phone": "+639123456793",
    "firstName": "Invalid",
    "lastName": "Email",
    "password": "password123"
  }' | jq '.'
echo ""
echo "---"
echo ""

# 5. 짧은 비밀번호 테스트
echo "5. 짧은 비밀번호 테스트 (유효성 검사):"
curl -X POST ${BASE_URL}/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "shortpass@example.com",
    "phone": "+639123456794",
    "firstName": "Short",
    "lastName": "Password",
    "password": "short"
  }' | jq '.'
echo ""
echo "---"
echo ""

# 6. 필수 필드 누락 테스트
echo "6. 필수 필드 누락 테스트 (유효성 검사):"
curl -X POST ${BASE_URL}/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "missing@example.com",
    "phone": "+639123456795"
  }' | jq '.'
echo ""
echo "=========================================="
echo "테스트 완료"
echo "=========================================="

