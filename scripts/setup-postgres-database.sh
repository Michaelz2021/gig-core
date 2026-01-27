#!/bin/bash

# PostgreSQL 데이터베이스 스키마 설정 스크립트
# 사용법: ./scripts/setup-postgres-database.sh

set -e

echo "=========================================="
echo "AI TrustTrade PostgreSQL 데이터베이스 설정"
echo "=========================================="

# 환경 변수 설정 (필요시 수정)
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USERNAME=${DB_USERNAME:-trusttrade}
DB_PASSWORD=${DB_PASSWORD:-secure_password_123}
DB_NAME=${DB_DATABASE:-ai_trusttrade}

echo "데이터베이스 정보:"
echo "  호스트: $DB_HOST"
echo "  포트: $DB_PORT"
echo "  사용자: $DB_USERNAME"
echo "  데이터베이스: $DB_NAME"
echo ""

# PGPASSWORD 환경 변수 설정 (비밀번호 입력 안 받도록)
export PGPASSWORD=$DB_PASSWORD

# PostgreSQL 서버에 연결 가능한지 확인
echo "PostgreSQL 서버 연결 확인 중..."
if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ PostgreSQL 서버에 연결할 수 없습니다."
    echo ""
    echo "Docker를 사용하는 경우:"
    echo "  docker-compose up -d postgres"
    echo ""
    echo "로컬 PostgreSQL을 사용하는 경우:"
    echo "  1. PostgreSQL이 실행 중인지 확인하세요"
    echo "  2. 데이터베이스와 사용자를 생성하세요:"
    echo "     CREATE DATABASE $DB_NAME;"
    echo "     CREATE USER $DB_USERNAME WITH PASSWORD '$DB_PASSWORD';"
    echo "     GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USERNAME;"
    exit 1
fi

echo "✅ PostgreSQL 서버 연결 성공"
echo ""

# 데이터베이스가 존재하는지 확인
echo "데이터베이스 확인 중..."
DB_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME';" || echo "0")

if [ "$DB_EXISTS" != "1" ]; then
    echo "데이터베이스 생성 중..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d postgres -c "CREATE DATABASE $DB_NAME;"
    echo "✅ 데이터베이스 생성 완료"
else
    echo "✅ 데이터베이스가 이미 존재합니다"
fi

echo ""

# 스키마 파일 경로
SCHEMA_FILE="$(dirname "$0")/../ai_trusttrade_postgresql_schema.sql"

if [ ! -f "$SCHEMA_FILE" ]; then
    echo "❌ 스키마 파일을 찾을 수 없습니다: $SCHEMA_FILE"
    exit 1
fi

echo "스키마 적용 중..."
echo "파일: $SCHEMA_FILE"
echo ""

# 스키마 실행
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_NAME" -f "$SCHEMA_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ 데이터베이스 스키마 설정 완료!"
    echo "=========================================="
    echo ""
    echo "데이터베이스 연결 정보:"
    echo "  Host: $DB_HOST"
    echo "  Port: $DB_PORT"
    echo "  Database: $DB_NAME"
    echo "  Username: $DB_USERNAME"
    echo ""
else
    echo ""
    echo "❌ 스키마 적용 중 오류가 발생했습니다."
    exit 1
fi

