# Providers 테이블 구조 변경 영향도 분석

## 현재 구조
- `providers.id` (UUID, Primary Key)
- `providers.user_id` (UUID, Foreign Key to users.id, UNIQUE)

## 변경 목표
- `providers.user_id`를 Primary Key로 사용
- `providers.id` 제거

## 영향받는 테이블 및 외래키

### 1. auction_bids
- 컬럼: `provider_id` → `providers.id` 참조
- 변경: `provider_id` → `providers.user_id` 참조로 변경

### 2. bookings
- 컬럼: `provider_id` → `providers.id` 참조
- 변경: `provider_id` → `providers.user_id` 참조로 변경

### 3. services
- 컬럼: `provider_id` → `providers.id` 참조
- 변경: `provider_id` → `providers.user_id` 참조로 변경

### 4. portfolios
- 컬럼: `provider_id` → `providers.id` 참조
- 변경: `provider_id` → `providers.user_id` 참조로 변경

### 5. transactions
- 컬럼: `provider_id` → `providers.id` 참조
- 변경: `provider_id` → `providers.user_id` 참조로 변경

### 6. escrows
- 컬럼: `provider_id` → `providers.id` 참조
- 변경: `provider_id` → `providers.user_id` 참조로 변경

### 7. disputes
- 컬럼: `provider_id` → `providers.id` 참조
- 변경: `provider_id` → `providers.user_id` 참조로 변경

### 8. quotes
- 컬럼: `providerId` → `providers.id` 참조
- 변경: `providerId` → `providers.user_id` 참조로 변경

### 9. provider_favorites
- 컬럼: `providerId` → `providers.id` 참조
- 변경: `providerId` → `providers.user_id` 참조로 변경

## 영향받는 코드 파일

### Entity 파일
- `src/modules/users/entities/provider.entity.ts` - Primary Key 변경
- `src/modules/matching/entities/auction-bid.entity.ts`
- `src/modules/bookings/entities/booking.entity.ts`
- `src/modules/services/entities/service.entity.ts`
- `src/modules/users/entities/portfolio.entity.ts`
- `src/modules/payments/entities/transaction.entity.ts`
- `src/modules/payments/entities/escrow.entity.ts`
- `src/modules/disputes/entities/dispute.entity.ts`
- `src/modules/quotes/entities/quote.entity.ts`
- `src/modules/users/entities/provider-favorite.entity.ts`

### Service 파일
- `src/modules/matching/matching.service.ts` - provider.id → provider.userId 변경
- `src/modules/users/users.service.ts` - provider.id 사용 부분 변경
- `src/modules/bookings/bookings.service.ts`
- `src/modules/services/services.service.ts`
- `src/modules/payments/payments.service.ts`
- `src/modules/quotes/quotes.service.ts`

## 마이그레이션 단계

1. **데이터 마이그레이션**: 모든 참조 테이블의 provider_id 값을 providers.id → providers.user_id로 변경
2. **외래키 제약조건 제거**: 기존 외래키 제약조건 삭제
3. **테이블 구조 변경**: providers 테이블에서 id 컬럼 제거, user_id를 Primary Key로 설정
4. **외래키 제약조건 재생성**: 새로운 구조에 맞게 외래키 재생성
5. **코드 업데이트**: Entity 및 Service 코드 업데이트

