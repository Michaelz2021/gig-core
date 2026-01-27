#!/bin/bash

# EC2 서버 초기 설정 스크립트
# 이 스크립트는 EC2 Ubuntu 서버에서 한 번만 실행하면 됩니다.

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info "EC2 서버 초기 설정을 시작합니다..."

# 1. 시스템 업데이트
print_info "시스템 업데이트 중..."
sudo apt update
sudo apt upgrade -y

# 2. 필수 도구 설치
print_info "필수 도구 설치 중..."
sudo apt install -y curl wget git build-essential

# 3. Node.js 20 LTS 설치
print_info "Node.js 20 LTS 설치 중..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    print_warn "Node.js가 이미 설치되어 있습니다: $(node --version)"
fi

# 4. PM2 설치
print_info "PM2 설치 중..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    pm2 startup systemd | grep "sudo" | bash || true
else
    print_warn "PM2가 이미 설치되어 있습니다"
fi

# 5. Nginx 설치
print_info "Nginx 설치 중..."
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
else
    print_warn "Nginx가 이미 설치되어 있습니다"
fi

# 6. PostgreSQL 설치
print_info "PostgreSQL 15 설치 중..."
if ! command -v psql &> /dev/null; then
    sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
    sudo apt update
    sudo apt install -y postgresql-15 postgresql-contrib-15
    sudo systemctl enable postgresql
    sudo systemctl start postgresql
else
    print_warn "PostgreSQL이 이미 설치되어 있습니다"
fi

# 7. Redis 설치
print_info "Redis 설치 중..."
if ! command -v redis-cli &> /dev/null; then
    sudo apt install -y redis-server
    sudo systemctl enable redis-server
    sudo systemctl start redis-server
else
    print_warn "Redis가 이미 설치되어 있습니다"
fi

# 8. UFW 방화벽 설정
print_info "방화벽 설정 중..."
if command -v ufw &> /dev/null; then
    sudo ufw --force enable
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    sudo ufw allow 22/tcp
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    print_info "방화벽 규칙:"
    sudo ufw status
else
    print_warn "UFW가 설치되어 있지 않습니다"
fi

# 9. 애플리케이션 디렉토리 생성
print_info "애플리케이션 디렉토리 생성 중..."
sudo mkdir -p /var/www/gig-core
sudo chown -R $USER:$USER /var/www/gig-core

# 10. 설치 확인
print_info "설치 확인 중..."
echo ""
echo "=== 설치된 소프트웨어 버전 ==="
echo "Node.js: $(node --version 2>/dev/null || echo '미설치')"
echo "npm: $(npm --version 2>/dev/null || echo '미설치')"
echo "PM2: $(pm2 --version 2>/dev/null || echo '미설치')"
echo "Nginx: $(nginx -v 2>&1 | head -n1 || echo '미설치')"
echo "PostgreSQL: $(psql --version 2>/dev/null || echo '미설치')"
echo "Redis: $(redis-cli --version 2>/dev/null || echo '미설치')"
echo ""

print_info "초기 설정이 완료되었습니다!"
print_warn "다음 단계:"
echo "1. PostgreSQL 데이터베이스 및 사용자 생성"
echo "2. 프로젝트 코드 배포"
echo "3. .env 파일 설정"
echo "4. PM2로 애플리케이션 시작"
echo "5. Nginx 설정"
echo ""
print_info "자세한 내용은 AWS_EC2_DEPLOYMENT_GUIDE.md를 참조하세요."

