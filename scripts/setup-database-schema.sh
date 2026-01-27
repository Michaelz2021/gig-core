#!/bin/bash

# 데이터베이스 스키마 설정 스크립트
# EC2 서버에서 실행: bash /tmp/setup-database-schema.sh

set -e

APP_DIR="/var/www/gig-core"
DB_NAME="ai_trusttrade"
DB_USER="trusttrade"

echo "=========================================="
echo "데이터베이스 스키마 설정"
echo "=========================================="

cd "$APP_DIR"

# 방법 1: SQL 스키마 파일 실행 (권장)
if [ -f "ai_trusttrade_postgresql_schema.sql" ]; then
    echo ""
    echo "[방법 1] SQL 스키마 파일 실행 중..."
    PGPASSWORD=$(grep DB_PASSWORD .env | cut -d'=' -f2) psql -h localhost -U "$DB_USER" -d "$DB_NAME" -f ai_trusttrade_postgresql_schema.sql
    
    if [ $? -eq 0 ]; then
        echo "✅ SQL 스키마 파일 실행 완료!"
        exit 0
    else
        echo "⚠️  SQL 스키마 파일 실행 실패. 방법 2를 시도합니다..."
    fi
fi

# 방법 2: TypeORM synchronize 사용 (임시)
echo ""
echo "[방법 2] TypeORM synchronize 사용 (임시)"
echo "⚠️  주의: 프로덕션에서는 권장하지 않습니다."

# .env 파일 백업
cp .env .env.backup

# DB_SYNCHRONIZE를 true로 변경
sed -i 's/DB_SYNCHRONIZE=false/DB_SYNCHRONIZE=true/' .env

# 애플리케이션 재시작
echo "애플리케이션 재시작 중..."
pm2 restart gig-core

# 잠시 대기
sleep 5

# 상태 확인
echo ""
echo "데이터베이스 연결 확인 중..."
curl -s http://localhost:3000/api/v1/health | grep -q "up" && echo "✅ 데이터베이스 연결 성공!" || echo "⚠️  데이터베이스 연결 실패"

# synchronize를 다시 false로 변경
echo ""
echo "DB_SYNCHRONIZE를 false로 복원 중..."
sed -i 's/DB_SYNCHRONIZE=true/DB_SYNCHRONIZE=false/' .env

# 애플리케이션 재시작
pm2 restart gig-core

echo ""
echo "=========================================="
echo "설정 완료!"
echo "=========================================="
echo ""
echo "데이터베이스 테이블 확인:"
echo "  psql -U $DB_USER -d $DB_NAME -c \"\\dt\""
echo ""

