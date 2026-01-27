#!/bin/bash

# PostgreSQL 연결 설정 확인 스크립트
# Mac에서 DBeaver로 연결하기 전에 서버에서 실행하여 확인

set -e

echo "=========================================="
echo "PostgreSQL 연결 설정 확인"
echo "=========================================="
echo ""

# 서버 IP 주소 확인
echo "📡 서버 IP 주소:"
SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || ip addr show | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}' | cut -d/ -f1)
if [ -z "$SERVER_IP" ]; then
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "확인 불가")
fi
echo "  $SERVER_IP"
echo ""

# Docker 컨테이너 상태 확인
echo "🐳 Docker 컨테이너 상태:"
if command -v docker-compose &> /dev/null; then
    cd "$(dirname "$0")/.." 2>/dev/null || cd /var/www/gig-core
    docker-compose ps postgres 2>/dev/null || echo "  PostgreSQL 컨테이너가 실행 중이지 않습니다."
    echo ""
    
    # PostgreSQL 포트 확인
    echo "🔌 포트 상태:"
    if docker-compose ps postgres | grep -q "Up"; then
        echo "  ✅ PostgreSQL 컨테이너가 실행 중입니다."
        docker-compose port postgres 5432 2>/dev/null || echo "  포트 매핑 확인 중..."
    else
        echo "  ❌ PostgreSQL 컨테이너가 실행 중이지 않습니다."
        echo "  실행하려면: docker-compose up -d postgres"
    fi
else
    echo "  Docker Compose가 설치되어 있지 않습니다."
fi
echo ""

# 포트 5432 리스닝 확인
echo "🔍 포트 5432 리스닝 확인:"
if command -v netstat &> /dev/null; then
    if sudo netstat -tlnp 2>/dev/null | grep -q ":5432"; then
        echo "  ✅ 포트 5432가 리스닝 중입니다."
        sudo netstat -tlnp 2>/dev/null | grep ":5432" || true
    else
        echo "  ⚠️  포트 5432가 리스닝 중이지 않습니다."
    fi
elif command -v ss &> /dev/null; then
    if sudo ss -tlnp 2>/dev/null | grep -q ":5432"; then
        echo "  ✅ 포트 5432가 리스닝 중입니다."
        sudo ss -tlnp 2>/dev/null | grep ":5432" || true
    else
        echo "  ⚠️  포트 5432가 리스닝 중이지 않습니다."
    fi
else
    echo "  netstat 또는 ss 명령어를 사용할 수 없습니다."
fi
echo ""

# 방화벽 상태 확인
echo "🔥 방화벽 상태:"
if command -v ufw &> /dev/null; then
    echo "  UFW 방화벽:"
    sudo ufw status | grep -E "5432|Status" || echo "    확인 불가"
elif command -v firewall-cmd &> /dev/null; then
    echo "  firewalld 방화벽:"
    sudo firewall-cmd --list-ports 2>/dev/null | grep -q "5432" && echo "    ✅ 포트 5432가 열려있습니다." || echo "    ⚠️  포트 5432가 열려있지 않습니다."
else
    echo "  방화벽 도구를 찾을 수 없습니다."
fi
echo ""

# PostgreSQL 연결 정보
echo "📋 DBeaver 연결 정보:"
echo ""
echo "  방법 1: 직접 연결 (포트가 열려있는 경우)"
echo "    호스트: $SERVER_IP"
echo "    포트: 5432"
echo "    데이터베이스: ai_trusttrade"
echo "    사용자명: trusttrade"
echo "    비밀번호: secure_password_123"
echo ""
echo "  방법 2: SSH 터널 사용 (권장)"
echo "    SSH 호스트: $SERVER_IP"
echo "    SSH 포트: 22"
echo "    SSH 사용자: [SSH 사용자명]"
echo "    SSH 키: [Mac의 SSH 키 파일 경로]"
echo ""
echo "    Main 탭:"
echo "      호스트: localhost"
echo "      포트: 5432"
echo "      데이터베이스: ai_trusttrade"
echo "      사용자명: trusttrade"
echo "      비밀번호: secure_password_123"
echo ""

# 연결 테스트
echo "🧪 로컬 연결 테스트:"
if command -v psql &> /dev/null; then
    if PGPASSWORD=secure_password_123 psql -h localhost -U trusttrade -d ai_trusttrade -c "SELECT version();" &> /dev/null; then
        echo "  ✅ 로컬 연결 성공"
        PGPASSWORD=secure_password_123 psql -h localhost -U trusttrade -d ai_trusttrade -c "SELECT current_database(), current_user;" 2>/dev/null || true
    else
        echo "  ❌ 로컬 연결 실패"
    fi
elif docker-compose ps postgres 2>/dev/null | grep -q "Up"; then
    cd "$(dirname "$0")/.." 2>/dev/null || cd /var/www/gig-core
    if docker-compose exec -T postgres psql -U trusttrade -d ai_trusttrade -c "SELECT version();" &> /dev/null; then
        echo "  ✅ Docker 컨테이너 연결 성공"
        docker-compose exec -T postgres psql -U trusttrade -d ai_trusttrade -c "SELECT current_database(), current_user;" 2>/dev/null || true
    else
        echo "  ❌ Docker 컨테이너 연결 실패"
    fi
else
    echo "  ⚠️  연결 테스트를 수행할 수 없습니다."
fi
echo ""

echo "=========================================="
echo "확인 완료"
echo "=========================================="
echo ""
echo "💡 팁:"
echo "  - 외부에서 연결하려면 SSH 터널 사용을 권장합니다."
echo "  - 자세한 설치 가이드는 md/DBEAVER_SETUP_GUIDE.md를 참조하세요."

