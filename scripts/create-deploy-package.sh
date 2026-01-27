#!/bin/bash

# 배포 패키지 생성 스크립트
# 사용법: ./scripts/create-deploy-package.sh

set -e

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# 프로젝트 루트 디렉토리 확인
if [ ! -f "package.json" ]; then
    echo "오류: package.json 파일을 찾을 수 없습니다."
    echo "프로젝트 루트 디렉토리에서 실행하세요."
    exit 1
fi

print_info "배포 패키지를 생성합니다..."

# 프로덕션 빌드
print_info "프로덕션 빌드 중..."
npm run build

if [ ! -d "dist" ]; then
    echo "오류: 빌드 실패 - dist 디렉토리가 생성되지 않았습니다."
    exit 1
fi

# 패키지 파일명
PACKAGE_NAME="gig-core-deploy-$(date +%Y%m%d-%H%M%S).tar.gz"

print_info "배포 패키지 압축 중: $PACKAGE_NAME"

# 배포용 파일만 압축
tar -czf "$PACKAGE_NAME" \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='.env' \
  --exclude='.env.*' \
  --exclude='logs' \
  --exclude='*.log' \
  --exclude='coverage' \
  --exclude='.DS_Store' \
  --exclude='.vscode' \
  --exclude='.idea' \
  --exclude='*.swp' \
  --exclude='*.swo' \
  --exclude='*~' \
  package.json \
  package-lock.json \
  tsconfig.json \
  ecosystem.config.js \
  src/ \
  scripts/ \
  *.md \
  *.sql \
  docker-compose.yml \
  Dockerfile* \
  dist/

if [ -f "$PACKAGE_NAME" ]; then
    FILE_SIZE=$(du -h "$PACKAGE_NAME" | cut -f1)
    print_info "배포 패키지 생성 완료!"
    print_info "파일명: $PACKAGE_NAME"
    print_info "크기: $FILE_SIZE"
    print_info ""
    print_info "다음 명령어로 EC2에 전송하세요:"
    echo "  scp -i <KEY_FILE> $PACKAGE_NAME ubuntu@<EC2_IP>:/tmp/"
    echo ""
    print_info "EC2에서 압축 해제:"
    echo "  cd /var/www/gig-core"
    echo "  tar -xzf /tmp/$PACKAGE_NAME"
else
    echo "오류: 패키지 생성 실패"
    exit 1
fi

