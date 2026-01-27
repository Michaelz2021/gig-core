#!/bin/bash

# SSH 키 파일 권한 및 위치 수정 스크립트
# 사용법: ./scripts/fix-ssh-key.sh <KEY_FILE_PATH>

set -e

KEY_FILE=${1:-""}

if [ -z "$KEY_FILE" ]; then
    echo "사용법: $0 <KEY_FILE_PATH>"
    echo "예시: $0 /Users/michaeljang/Downloads/OJT.pem"
    exit 1
fi

if [ ! -f "$KEY_FILE" ]; then
    echo "오류: 키 파일을 찾을 수 없습니다: $KEY_FILE"
    exit 1
fi

echo "SSH 키 파일을 ~/.ssh/ 디렉토리로 이동합니다..."

# .ssh 디렉토리 생성
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# 키 파일 이름 추출
KEY_NAME=$(basename "$KEY_FILE")

# 키 파일을 .ssh로 이동
echo "키 파일 복사 중: $KEY_FILE -> ~/.ssh/$KEY_NAME"
cp "$KEY_FILE" ~/.ssh/$KEY_NAME

# 권한 설정
chmod 600 ~/.ssh/$KEY_NAME

# 확장 속성 제거 (macOS)
if command -v xattr &> /dev/null; then
    xattr -c ~/.ssh/$KEY_NAME 2>/dev/null || true
fi

echo ""
echo "✅ 완료!"
echo ""
echo "새 키 파일 경로: ~/.ssh/$KEY_NAME"
echo ""
echo "이제 다음 명령어로 SSH 연결을 테스트하세요:"
echo "  ssh -i ~/.ssh/$KEY_NAME ubuntu@<EC2_IP>"
echo ""
echo "또는 배포 스크립트를 실행하세요:"
echo "  ./scripts/deploy-to-ec2.sh <EC2_IP> ~/.ssh/$KEY_NAME"

