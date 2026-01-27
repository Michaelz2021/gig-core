#!/bin/bash

# PostgreSQL 사용자 및 데이터베이스 설정 스크립트
# EC2 서버에서 실행: sudo bash /tmp/setup-postgres-user.sh

set -e

echo "=========================================="
echo "PostgreSQL 사용자 및 데이터베이스 설정"
echo "=========================================="

# 비밀번호 입력 받기
read -sp "PostgreSQL trusttrade 사용자 비밀번호를 입력하세요: " DB_PASSWORD
echo ""

if [ -z "$DB_PASSWORD" ]; then
    echo "오류: 비밀번호를 입력해야 합니다."
    exit 1
fi

# PostgreSQL 사용자로 전환하여 설정
sudo -u postgres psql << EOF
-- 기존 사용자가 있으면 삭제 (선택사항)
DROP USER IF EXISTS trusttrade;

-- 사용자 생성
CREATE USER trusttrade WITH PASSWORD '$DB_PASSWORD';

-- 데이터베이스 생성 (이미 있으면 무시)
SELECT 'CREATE DATABASE ai_trusttrade OWNER trusttrade'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ai_trusttrade')\gexec

-- 권한 부여
GRANT ALL PRIVILEGES ON DATABASE ai_trusttrade TO trusttrade;

-- 데이터베이스에 연결하여 스키마 권한 부여
\c ai_trusttrade
GRANT ALL ON SCHEMA public TO trusttrade;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO trusttrade;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO trusttrade;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO trusttrade;

-- 확인
\du
\l
\q
EOF

echo ""
echo "=========================================="
echo "설정 완료!"
echo "=========================================="
echo ""
echo "이제 .env 파일의 DB_PASSWORD를 위에서 입력한 비밀번호로 설정하세요:"
echo "  nano /var/www/gig-core/.env"
echo ""
echo "그리고 애플리케이션을 재시작하세요:"
echo "  pm2 restart gig-core"
echo ""

