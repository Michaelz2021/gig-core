#!/bin/bash

# 데이터베이스 Export 스크립트
# 사용법: ./scripts/export-database.sh [format]
# format: sql (기본값), custom, tar, directory

set -e

# .env 파일에서 데이터베이스 정보 로드
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -f "$PROJECT_DIR/.env" ]; then
  export $(cat "$PROJECT_DIR/.env" | grep -v '^#' | xargs)
fi

# 기본값 설정
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USERNAME=${DB_USERNAME:-trusttrade}
DB_DATABASE=${DB_DATABASE:-ai_trusttrade}
EXPORT_FORMAT=${1:-sql}

# 백업 디렉토리 생성
BACKUP_DIR="$PROJECT_DIR/backups"
mkdir -p "$BACKUP_DIR"
chmod 755 "$BACKUP_DIR"

# 타임스탬프 생성
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/ai_trusttrade_backup_${TIMESTAMP}"

echo "=========================================="
echo "데이터베이스 Export 시작"
echo "=========================================="
echo "데이터베이스: $DB_DATABASE"
echo "호스트: $DB_HOST:$DB_PORT"
echo "사용자: $DB_USERNAME"
echo "형식: $EXPORT_FORMAT"
echo "출력 파일: ${BACKUP_FILE}.${EXPORT_FORMAT}"
echo "=========================================="
echo ""

# 비밀번호 확인
if [ -z "$DB_PASSWORD" ]; then
  echo "❌ 오류: DB_PASSWORD가 설정되지 않았습니다."
  echo ".env 파일에 DB_PASSWORD를 확인하세요."
  exit 1
fi

export PGPASSWORD="$DB_PASSWORD"

# 형식에 따라 export 실행
case $EXPORT_FORMAT in
  sql)
    echo "📦 SQL 스크립트 형식으로 export 중..."
    pg_dump \
      -h "$DB_HOST" \
      -p "$DB_PORT" \
      -U "$DB_USERNAME" \
      -d "$DB_DATABASE" \
      --verbose \
      --clean \
      --if-exists \
      --create \
      --format=plain \
      --file="${BACKUP_FILE}.sql"
    echo "✅ SQL export 완료: ${BACKUP_FILE}.sql"
    ;;
    
  custom)
    echo "📦 Custom 형식으로 export 중..."
    pg_dump \
      -h "$DB_HOST" \
      -p "$DB_PORT" \
      -U "$DB_USERNAME" \
      -d "$DB_DATABASE" \
      --verbose \
      --format=custom \
      --file="${BACKUP_FILE}.dump"
    echo "✅ Custom export 완료: ${BACKUP_FILE}.dump"
    echo "💡 복원 방법: pg_restore -h <host> -p <port> -U <user> -d <database> ${BACKUP_FILE}.dump"
    ;;
    
  tar)
    echo "📦 Tar 형식으로 export 중..."
    pg_dump \
      -h "$DB_HOST" \
      -p "$DB_PORT" \
      -U "$DB_USERNAME" \
      -d "$DB_DATABASE" \
      --verbose \
      --format=tar \
      --file="${BACKUP_FILE}.tar"
    echo "✅ Tar export 완료: ${BACKUP_FILE}.tar"
    ;;
    
  directory)
    echo "📦 Directory 형식으로 export 중..."
    pg_dump \
      -h "$DB_HOST" \
      -p "$DB_PORT" \
      -U "$DB_USERNAME" \
      -d "$DB_DATABASE" \
      --verbose \
      --format=directory \
      --file="${BACKUP_FILE}"
    echo "✅ Directory export 완료: ${BACKUP_FILE}/"
    ;;
    
  *)
    echo "❌ 오류: 지원하지 않는 형식입니다: $EXPORT_FORMAT"
    echo "지원 형식: sql, custom, tar, directory"
    exit 1
    ;;
esac

# 파일 크기 확인
if [ -f "${BACKUP_FILE}.${EXPORT_FORMAT}" ] || [ -d "${BACKUP_FILE}" ]; then
  if [ -f "${BACKUP_FILE}.${EXPORT_FORMAT}" ]; then
    FILE_SIZE=$(du -h "${BACKUP_FILE}.${EXPORT_FORMAT}" | cut -f1)
    echo ""
    echo "📊 파일 크기: $FILE_SIZE"
  fi
fi

echo ""
echo "=========================================="
echo "✅ Export 완료!"
echo "=========================================="
echo ""
echo "📋 Export 파일 정보:"
if [ "$EXPORT_FORMAT" = "directory" ]; then
  echo "   디렉토리: ${BACKUP_FILE}/"
else
  echo "   파일: ${BACKUP_FILE}.${EXPORT_FORMAT}"
fi
echo ""
echo "💡 다른 서버로 복원하는 방법:"
echo ""
if [ "$EXPORT_FORMAT" = "sql" ]; then
  echo "   psql -h <새_호스트> -p <포트> -U <사용자> -d <데이터베이스> < ${BACKUP_FILE}.sql"
elif [ "$EXPORT_FORMAT" = "custom" ]; then
  echo "   pg_restore -h <새_호스트> -p <포트> -U <사용자> -d <데이터베이스> ${BACKUP_FILE}.dump"
elif [ "$EXPORT_FORMAT" = "tar" ]; then
  echo "   pg_restore -h <새_호스트> -p <포트> -U <사용자> -d <데이터베이스> ${BACKUP_FILE}.tar"
else
  echo "   pg_restore -h <새_호스트> -p <포트> -U <사용자> -d <데이터베이이스> ${BACKUP_FILE}"
fi
echo ""

# 비밀번호 변수 정리
unset PGPASSWORD
