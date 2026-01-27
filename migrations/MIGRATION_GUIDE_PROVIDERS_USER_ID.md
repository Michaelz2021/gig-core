# Providers 테이블 구조 변경 마이그레이션 가이드

## 개요

`providers` 테이블의 구조를 변경하여 `providers.id`를 제거하고 `providers.user_id`를 Primary Key로 사용합니다.

## 변경 사항

### Before (이전)
- `providers.id` (UUID, Primary Key)
- `providers.user_id` (UUID, Foreign Key to users.id, UNIQUE)

### After (이후)
- `providers.user_id` (UUID, Primary Key, Foreign Key to users.id)

## 마이그레이션 단계

### 1. 데이터베이스 백업

**중요**: 마이그레이션 전에 반드시 데이터베이스를 백업하세요!

```bash
# PostgreSQL 백업
pg_dump -h localhost -U trusttrade -d ai_trusttrade > backup_before_migration_$(date +%Y%m%d_%H%M%S).sql
```

### 2. SQL 마이그레이션 실행

```bash
cd /var/www/gig-core
psql -h localhost -U trusttrade -d ai_trusttrade -f migrations/migrate-providers-to-user-id-pk.sql
```

또는 직접 psql에 접속하여:

```sql
\i migrations/migrate-providers-to-user-id-pk.sql
```

### 3. 코드 변경 확인

다음 파일들이 이미 업데이트되었습니다:

- ✅ `src/modules/users/entities/provider.entity.ts` - Primary Key 변경
- ✅ `src/modules/matching/matching.service.ts` - provider.id → provider.userId
- ✅ `src/modules/users/users.service.ts` - provider.id → provider.userId

### 4. 추가로 확인해야 할 파일들

다음 파일들도 확인하고 필요시 수정해야 합니다:

- `src/modules/bookings/bookings.service.ts`
- `src/modules/services/services.service.ts`
- `src/modules/payments/payments.service.ts`
- `src/modules/quotes/quotes.service.ts`
- `src/modules/admin/admin.service.ts`

### 5. 애플리케이션 재시작

```bash
# 개발 환경
npm run start:dev

# 프로덕션 환경
pm2 restart all
```

## 검증

마이그레이션 후 다음 쿼리로 검증하세요:

```sql
-- providers 테이블 구조 확인
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'providers'
ORDER BY ordinal_position;

-- 외래키 제약조건 확인
SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND ccu.table_name = 'providers';

-- 데이터 무결성 확인
SELECT 
  'auction_bids' as table_name,
  COUNT(*) as total_rows,
  COUNT(DISTINCT provider_id) as unique_providers,
  COUNT(*) - COUNT(DISTINCT provider_id) as orphaned_rows
FROM auction_bids
WHERE provider_id NOT IN (SELECT user_id FROM providers)
UNION ALL
SELECT 
  'bookings' as table_name,
  COUNT(*) as total_rows,
  COUNT(DISTINCT provider_id) as unique_providers,
  COUNT(*) - COUNT(DISTINCT provider_id) as orphaned_rows
FROM bookings
WHERE provider_id NOT IN (SELECT user_id FROM providers);
```

## 롤백 방법

문제가 발생한 경우:

```sql
-- 1. 백업에서 복원
psql -h localhost -U trusttrade -d ai_trusttrade < backup_before_migration_YYYYMMDD_HHMMSS.sql

-- 또는 2. 수동 롤백 (복잡하므로 권장하지 않음)
-- 마이그레이션 스크립트를 역순으로 실행
```

## 주의사항

1. **다운타임**: 마이그레이션 중에는 애플리케이션을 중지해야 합니다.
2. **외래키 제약조건**: 모든 외래키 제약조건이 올바르게 재생성되었는지 확인하세요.
3. **인덱스**: 인덱스는 자동으로 유지되지만, 성능 테스트를 권장합니다.
4. **API 호환성**: API 엔드포인트에서 `providerId`를 받는 경우, 이제 `users.id`를 직접 사용할 수 있습니다.

## 장점

1. **단순화**: 불필요한 `providers.id` 컬럼 제거
2. **명확성**: `providerId`가 항상 `users.id`와 동일하므로 혼란 제거
3. **일관성**: 다른 테이블에서도 `user_id`를 직접 참조 가능

## 문제 해결

### 문제: 외래키 제약조건 오류
```sql
-- 제약조건 이름 확인
SELECT constraint_name, table_name 
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' 
  AND table_name IN ('auction_bids', 'bookings', 'services');
```

### 문제: 데이터 불일치
```sql
-- providers.user_id와 일치하지 않는 provider_id 찾기
SELECT DISTINCT ab.provider_id 
FROM auction_bids ab
WHERE ab.provider_id NOT IN (SELECT user_id FROM providers);
```

