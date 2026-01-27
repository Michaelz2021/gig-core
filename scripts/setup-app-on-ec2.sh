#!/bin/bash

# EC2 서버에서 애플리케이션 설정 및 시작 스크립트
# EC2 서버에서 실행: bash /tmp/setup-app-on-ec2.sh

set -e

APP_DIR="/var/www/gig-core"

echo "=========================================="
echo "애플리케이션 설정 및 시작"
echo "=========================================="

cd "$APP_DIR"

# 1. 의존성 설치
echo ""
echo "[1/4] 의존성 설치 중..."
npm ci --production

# 2. 로그 디렉토리 생성
echo ""
echo "[2/4] 로그 디렉토리 생성 중..."
mkdir -p logs

# 3. .env 파일 확인
echo ""
echo "[3/4] .env 파일 확인 중..."
if [ ! -f ".env" ]; then
    echo "⚠️  .env 파일이 없습니다!"
    echo ""
    echo "다음 명령어로 .env 파일을 생성하세요:"
    echo "  nano $APP_DIR/.env"
    echo ""
    echo "필수 환경 변수:"
    echo "  NODE_ENV=production"
    echo "  PORT=3000"
    echo "  DB_HOST=localhost"
    echo "  DB_PORT=5432"
    echo "  DB_USERNAME=trusttrade"
    echo "  DB_PASSWORD=your_password"
    echo "  DB_DATABASE=ai_trusttrade"
    echo "  REDIS_HOST=localhost"
    echo "  REDIS_PORT=6379"
    echo "  JWT_SECRET=your_jwt_secret"
    echo ""
    read -p ".env 파일을 생성한 후 Enter를 누르세요..."
fi

# 4. PM2로 애플리케이션 시작
echo ""
echo "[4/4] PM2로 애플리케이션 시작 중..."

# 기존 프로세스가 있으면 중지
if pm2 list | grep -q "gig-core"; then
    echo "기존 애플리케이션 중지 중..."
    pm2 delete gig-core || true
fi

# 애플리케이션 시작
if [ -f ecosystem.config.js ]; then
    echo "ecosystem.config.js를 사용하여 시작..."
    pm2 start ecosystem.config.js
else
    echo "dist/main.js를 직접 시작..."
    pm2 start dist/main.js --name gig-core
fi

# PM2 저장
pm2 save

# 상태 확인
echo ""
echo "=========================================="
echo "애플리케이션 상태"
echo "=========================================="
pm2 status

echo ""
echo "=========================================="
echo "완료!"
echo "=========================================="
echo ""
echo "유용한 명령어:"
echo "  pm2 logs gig-core          # 로그 확인"
echo "  pm2 restart gig-core       # 재시작"
echo "  pm2 stop gig-core          # 중지"
echo "  pm2 monit                  # 모니터링"
echo ""

