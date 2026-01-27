#!/bin/bash

# 데이터베이스 Import 스크립트
# 사용법: ./scripts/import-database.sh <backup_file> [target_database] [target_host] [target_port] [target_user]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -f "$PROJECT_DIR/.env" ]; then
  export $(cat "$PROJECT_DIR/.env" | grep -v '^#' | xargs)
fi

# 파라미터 확인
if [ -z "$1" ]; then
  echo "❌ 오류: 백업 파일을 지정해주세요."
  echo ""
  echo "사용법: $0 <backup_file> [target_database] [target_host] [target_port] [target_user]"
  echo ""
  echo "예시:"
  echo "  $0 backups/ai_trusttrade_backup_20251213_104053.sql"
  echo "  $0 backups/ai_trusttrade_backup_20251213_104056.dump new_db new_host 5432 new_user"
  exit 1
fi

BACKUP_FILE="$1"
TARGET_DB=${2:-${DB_DATABASE:-ai_trusttrade}}
TARGET_HOST=${3:-${DB_HOST:-localhost}}
TARGET_PORT=${4:-${DB_PORT:-5432}}
TARGET_USER=${5:-${DB_USERNAME:-trusttrade}}

# 백업 파일 확인
if [ ! -f "$BACKUP_FILE" ] && [ ! -d "$BACKUP_FILE" ]; then
  echo "❌ 오류: 백업 파일을 찾을 수 없습니다: $BACKUP_FILE"
  exit 1
fi

# 비밀번호 확인
if [ -z "$DB_PASSWORD" ]; then
  echo "⚠️  경고: DB_PASSWORD가 설정되지 않았습니다."
  echo "비밀번호를 입력하세요:"
  read -s TARGET_PASSWORD
  export PGPASSWORD="$TARGET_PASSWORD"
else
  export PGPASSWORD="$DB_PASSWORD"
fi

echo "=========================================="
echo "데이터베이스 Import 시작"
echo "=========================================="
echo "백업 파일: $BACKUP_FILE"
echo "대상 데이터베이스: $TARGET_DB"
echo "대상 호스트: $TARGET_HOST:$TARGET_PORT"
echo "대상 사용자: $TARGET_USER"
echo "=========================================="
echo ""

# 파일 확장자 확인
FILE_EXT="${BACKUP_FILE##*.}"
FILE_NAME="${BACKUP_FILE%.*}"

case $FILE_EXT in
  sql)
    echo "📦 SQL 스크립트 형식으로 import 중..."
    psql \
      -h "$TARGET_HOST" \
      -p "$TARGET_PORT" \
      -U "$TARGET_USER" \
      -d postgres \
      -f "$BACKUP_FILE"
    echo "✅ SQL import 완료!"
    ;;
    
  dump)
    echo "📦 Custom 형식으로 import 중..."
    pg_restore \
      -h "$TARGET_HOST" \
      -p "$TARGET_PORT" \
      -U "$TARGET_USER" \
      -d "$TARGET_DB" \
      --verbose \
      --clean \
      --if-exists \
      "$BACKUP_FILE"
    echo "✅ Custom import 완료!"
    ;;
    
  tar)
    echo "📦 Tar 형식으로 import 중..."
    pg_restore \
      -h "$TARGET_HOST" \
      -p "$TARGET_PORT" \
      -U "$TARGET_USER" \
      -d "$TARGET_DB" \
      --verbose \
      --clean \
      --if-exists \
      "$BACKUP_FILE"
    echo "✅ Tar import 완료!"
    ;;
    
  *)
    # 디렉토리 형식인지 확인
    if [ -d "$BACKUP_FILE" ]; then
      echo "📦 Directory 형식으로 import 중..."
      pg_restore \
        -h "$TARGET_HOST" \
        -p "$TARGET_PORT" \
        -U "$TARGET_USER" \
        -d "$TARGET_DB" \
        --verbose \
        --clean \
        --if-exists \
        "$BACKUP_FILE"
      echo "✅ Directory import 완료!"
    else
      echo "❌ 오류: 지원하지 않는 백업 형식입니다: $FILE_EXT"
      exit 1
    fi
    ;;
esac

unset PGPASSWORD

echo ""
echo "=========================================="
echo "✅ Import 완료!"
echo "=========================================="
