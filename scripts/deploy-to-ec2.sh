#!/bin/bash

# AWS EC2 배포 스크립트
# 사용법: ./scripts/deploy-to-ec2.sh [EC2_IP] [KEY_FILE]

set -e  # 에러 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 변수 설정
EC2_IP=${1:-""}
KEY_FILE=${2:-""}
EC2_USER="ubuntu"
APP_DIR="/var/www/gig-core"
REMOTE_USER="ubuntu"

# 함수 정의
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 입력 검증
if [ -z "$EC2_IP" ]; then
    print_error "EC2 IP 주소를 입력하세요."
    echo "사용법: $0 <EC2_IP> <KEY_FILE>"
    exit 1
fi

if [ -z "$KEY_FILE" ]; then
    print_error "SSH 키 파일 경로를 입력하세요."
    echo "사용법: $0 <EC2_IP> <KEY_FILE>"
    exit 1
fi

if [ ! -f "$KEY_FILE" ]; then
    print_error "SSH 키 파일을 찾을 수 없습니다: $KEY_FILE"
    exit 1
fi

# SSH 키 권한 확인 및 설정 (macOS/Linux 호환)
# macOS: stat -f %A, Linux: stat -c %a
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    KEY_PERM=$(stat -f %A "$KEY_FILE" 2>/dev/null || echo "000")
else
    # Linux
    KEY_PERM=$(stat -c %a "$KEY_FILE" 2>/dev/null || echo "000")
fi

if [ "$KEY_PERM" != "600" ] && [ "$KEY_PERM" != "0600" ]; then
    print_warn "SSH 키 파일 권한을 600으로 변경합니다."
    chmod 600 "$KEY_FILE"
fi

print_info "EC2 인스턴스에 배포를 시작합니다..."
print_info "EC2 IP: $EC2_IP"
print_info "애플리케이션 디렉토리: $APP_DIR"

# SSH 연결 테스트
print_info "SSH 연결 테스트 중..."
SSH_TEST_OUTPUT=$(ssh -i "$KEY_FILE" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$EC2_USER@$EC2_IP" "echo 'SSH 연결 성공'" 2>&1)
SSH_EXIT_CODE=$?

if [ $SSH_EXIT_CODE -ne 0 ]; then
    print_error "SSH 연결에 실패했습니다."
    echo ""
    echo "가능한 원인:"
    echo "1. EC2 인스턴스가 실행 중인지 확인하세요"
    echo "2. 보안 그룹에서 SSH(포트 22)가 허용되어 있는지 확인하세요"
    echo "3. 키 파일 경로와 권한을 확인하세요"
    echo "4. EC2 IP 주소가 올바른지 확인하세요"
    echo ""
    echo "SSH 연결 시도 결과:"
    echo "$SSH_TEST_OUTPUT"
    echo ""
    print_info "수동 연결 테스트:"
    echo "  ssh -i $KEY_FILE $EC2_USER@$EC2_IP"
    exit 1
fi

print_info "SSH 연결 성공!"

# 로컬 빌드
print_info "로컬에서 프로덕션 빌드 중..."
npm run build

if [ ! -d "dist" ]; then
    print_error "빌드 실패: dist 디렉토리가 생성되지 않았습니다."
    exit 1
fi

# .env 파일 확인
if [ ! -f ".env" ]; then
    print_warn ".env 파일이 없습니다. EC2 서버에 .env 파일이 있는지 확인하세요."
fi

# 원격 디렉토리 생성
print_info "원격 디렉토리 생성 중..."
ssh -i "$KEY_FILE" "$EC2_USER@$EC2_IP" "sudo mkdir -p $APP_DIR && sudo chown -R $REMOTE_USER:$REMOTE_USER $APP_DIR"

# 파일 전송 (rsync 사용)
print_info "파일 전송 중..."
rsync -avz --delete \
    -e "ssh -i $KEY_FILE" \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'dist' \
    --exclude '.env' \
    --exclude 'logs' \
    --exclude '*.log' \
    --exclude 'coverage' \
    --exclude '.DS_Store' \
    ./ "$EC2_USER@$EC2_IP:$APP_DIR/"

# dist 디렉토리 전송
print_info "빌드된 파일 전송 중..."
rsync -avz \
    -e "ssh -i $KEY_FILE" \
    dist/ "$EC2_USER@$EC2_IP:$APP_DIR/dist/"

# 원격 서버 사전 요구사항 확인
print_info "원격 서버 사전 요구사항 확인 중..."
REQUIREMENTS_CHECK=$(ssh -i "$KEY_FILE" "$EC2_USER@$EC2_IP" << 'ENDSSH'
NODE_CHECK=$(command -v node 2>/dev/null || echo "not_found")
NPM_CHECK=$(command -v npm 2>/dev/null || echo "not_found")
PM2_CHECK=$(command -v pm2 2>/dev/null || echo "not_found")

echo "NODE:$NODE_CHECK"
echo "NPM:$NPM_CHECK"
echo "PM2:$PM2_CHECK"
ENDSSH
)

NODE_STATUS=$(echo "$REQUIREMENTS_CHECK" | grep "NODE:" | cut -d: -f2)
NPM_STATUS=$(echo "$REQUIREMENTS_CHECK" | grep "NPM:" | cut -d: -f2)
PM2_STATUS=$(echo "$REQUIREMENTS_CHECK" | grep "PM2:" | cut -d: -f2)

if [ "$NODE_STATUS" = "not_found" ] || [ "$NPM_STATUS" = "not_found" ] || [ "$PM2_STATUS" = "not_found" ]; then
    print_warn "필수 소프트웨어가 설치되어 있지 않습니다!"
    print_info "자동으로 초기 설정을 실행합니다..."
    
    # 초기 설정 스크립트를 EC2로 전송
    print_info "초기 설정 스크립트를 EC2로 전송 중..."
    scp -i "$KEY_FILE" scripts/setup-ec2-server.sh "$EC2_USER@$EC2_IP:/tmp/" > /dev/null 2>&1
    
    if [ $? -ne 0 ]; then
        print_error "초기 설정 스크립트 전송 실패"
        print_error "수동으로 초기 설정을 실행하세요:"
        echo ""
        echo "1. 초기 설정 스크립트를 EC2로 전송:"
        echo "   scp -i $KEY_FILE scripts/setup-ec2-server.sh $EC2_USER@$EC2_IP:/tmp/"
        echo ""
        echo "2. EC2에 SSH 접속 후 스크립트 실행:"
        echo "   ssh -i $KEY_FILE $EC2_USER@$EC2_IP"
        echo "   chmod +x /tmp/setup-ec2-server.sh"
        echo "   sudo /tmp/setup-ec2-server.sh"
        exit 1
    fi
    
    # EC2 서버에서 초기 설정 실행
    print_info "EC2 서버에서 초기 설정 실행 중... (몇 분 소요될 수 있습니다)"
    ssh -i "$KEY_FILE" "$EC2_USER@$EC2_IP" "chmod +x /tmp/setup-ec2-server.sh && sudo /tmp/setup-ec2-server.sh"
    
    if [ $? -ne 0 ]; then
        print_error "초기 설정 실행 실패"
        exit 1
    fi
    
    print_info "초기 설정 완료. 배포를 계속합니다..."
    sleep 2
fi

# 원격에서 의존성 설치 및 재시작
print_info "원격 서버에서 의존성 설치 중..."
ssh -i "$KEY_FILE" "$EC2_USER@$EC2_IP" << 'ENDSSH'
cd /var/www/gig-core

# 의존성 설치
npm ci --production

# 로그 디렉토리 생성
mkdir -p logs

# PM2 재시작
if pm2 list | grep -q "gig-core"; then
    echo "PM2 애플리케이션 재시작 중..."
    pm2 restart gig-core
else
    echo "PM2 애플리케이션 시작 중..."
    if [ -f ecosystem.config.js ]; then
        pm2 start ecosystem.config.js
    else
        pm2 start dist/main.js --name gig-core
    fi
    pm2 save
fi

# 상태 확인
pm2 status
ENDSSH

print_info "배포가 완료되었습니다!"
print_info "애플리케이션 상태 확인: ssh -i $KEY_FILE $EC2_USER@$EC2_IP 'pm2 status'"
print_info "로그 확인: ssh -i $KEY_FILE $EC2_USER@$EC2_IP 'pm2 logs gig-core'"

