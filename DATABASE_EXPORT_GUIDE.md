# 데이터베이스 Export/Import 가이드

## 📦 현재 생성된 백업 파일

최신 백업 파일:
- **SQL 형식**: `backups/ai_trusttrade_backup_20251213_104053.sql` (241KB)
- **Custom 형식**: `backups/ai_trusttrade_backup_20251213_104056.dump` (184KB)

---

## 🚀 Export 방법

### 방법 1: 스크립트 사용 (권장)

```bash
cd /var/www/gig-core

# SQL 형식으로 export (기본값)
./scripts/export-database.sh sql

# Custom 형식으로 export (압축됨, 더 작은 크기)
./scripts/export-database.sh custom

# Tar 형식으로 export
./scripts/export-database.sh tar

# Directory 형식으로 export
./scripts/export-database.sh directory
```

### 방법 2: 직접 pg_dump 사용

```bash
# SQL 형식
PGPASSWORD='your_password' pg_dump \
  -h localhost \
  -p 5432 \
  -U trusttrade \
  -d ai_trusttrade \
  --clean \
  --if-exists \
  --create \
  --format=plain \
  --file=backups/ai_trusttrade_backup_$(date +%Y%m%d_%H%M%S).sql

# Custom 형식 (압축됨)
PGPASSWORD='your_password' pg_dump \
  -h localhost \
  -p 5432 \
  -U trusttrade \
  -d ai_trusttrade \
  --format=custom \
  --file=backups/ai_trusttrade_backup_$(date +%Y%m%d_%H%M%S).dump
```

---

## 📥 Import 방법 (다른 서버로 복원)

### 방법 1: 스크립트 사용 (권장)

```bash
cd /var/www/gig-core

# SQL 형식 백업 복원
./scripts/import-database.sh backups/ai_trusttrade_backup_20251213_104053.sql

# 다른 서버로 복원
./scripts/import-database.sh \
  backups/ai_trusttrade_backup_20251213_104056.dump \
  new_database_name \
  new_host \
  5432 \
  new_user
```

### 방법 2: 직접 psql/pg_restore 사용

#### SQL 형식 백업 복원

```bash
# 1. 새 데이터베이스 생성 (필요한 경우)
psql -h new_host -p 5432 -U new_user -d postgres -c "CREATE DATABASE ai_trusttrade;"

# 2. 백업 파일 복원
psql -h new_host -p 5432 -U new_user -d ai_trusttrade < backups/ai_trusttrade_backup_20251213_104053.sql
```

#### Custom 형식 백업 복원

```bash
# 1. 새 데이터베이스 생성 (필요한 경우)
psql -h new_host -p 5432 -U new_user -d postgres -c "CREATE DATABASE ai_trusttrade;"

# 2. 백업 파일 복원
pg_restore \
  -h new_host \
  -p 5432 \
  -U new_user \
  -d ai_trusttrade \
  --verbose \
  --clean \
  --if-exists \
  backups/ai_trusttrade_backup_20251213_104056.dump
```

---

## 📋 백업 형식 비교

| 형식 | 확장자 | 장점 | 단점 | 용도 |
|------|--------|------|------|------|
| **SQL** | `.sql` | 호환성 좋음, 텍스트 편집 가능 | 파일 크기 큼 | 일반적인 백업, 다른 DB로 이전 |
| **Custom** | `.dump` | 압축됨, 빠른 복원 | PostgreSQL 전용 | PostgreSQL 간 이전 |
| **Tar** | `.tar` | 압축됨 | PostgreSQL 전용 | PostgreSQL 간 이전 |
| **Directory** | 디렉토리 | 선택적 복원 가능 | PostgreSQL 전용 | 대용량 DB, 선택적 복원 |

---

## ⚠️ 주의사항

1. **데이터베이스 생성**: SQL 형식은 `--create` 옵션으로 데이터베이스를 자동 생성하지만, Custom/Tar/Directory 형식은 먼저 데이터베이스를 생성해야 합니다.

2. **권한 확인**: 대상 서버의 사용자가 데이터베이스 생성 권한이 있는지 확인하세요.

3. **연결 확인**: 대상 서버에 네트워크 접근이 가능한지 확인하세요.

4. **버전 호환성**: PostgreSQL 버전이 호환되는지 확인하세요 (일반적으로 같은 major 버전 권장).

---

## 🔄 전체 마이그레이션 프로세스

### 1. Export (현재 서버)

```bash
cd /var/www/gig-core
./scripts/export-database.sh custom
```

### 2. 백업 파일 전송

```bash
# SCP를 사용한 전송 예시
scp backups/ai_trusttrade_backup_*.dump user@new_server:/path/to/backups/
```

### 3. Import (새 서버)

```bash
# 새 서버에서
cd /path/to/project
./scripts/import-database.sh backups/ai_trusttrade_backup_*.dump
```

---

## 📊 백업 파일 위치

모든 백업 파일은 `/var/www/gig-core/backups/` 디렉토리에 저장됩니다.

```bash
# 백업 파일 목록 확인
ls -lh /var/www/gig-core/backups/

# 최신 백업 파일 확인
ls -t /var/www/gig-core/backups/ | head -1
```

---

## 🛠️ 문제 해결

### 백업 실패 시

1. 데이터베이스 연결 확인:
   ```bash
   psql -h localhost -p 5432 -U trusttrade -d ai_trusttrade -c "SELECT 1;"
   ```

2. 디스크 공간 확인:
   ```bash
   df -h
   ```

3. 권한 확인:
   ```bash
   ls -la backups/
   ```

### 복원 실패 시

1. 데이터베이스가 존재하는지 확인
2. 사용자 권한 확인
3. PostgreSQL 버전 확인
4. 로그 확인 (--verbose 옵션 사용)

---

## 📞 추가 도움말

더 자세한 정보는 PostgreSQL 공식 문서를 참조하세요:
- [pg_dump 문서](https://www.postgresql.org/docs/current/app-pgdump.html)
- [pg_restore 문서](https://www.postgresql.org/docs/current/app-pgrestore.html)
