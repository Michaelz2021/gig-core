# 001_xendit_contracts_and_payment_tables.sql

## 실행 방법

```bash
psql -U <user> -d <database> -f migrations/001_xendit_contracts_and_payment_tables.sql
```

또는 `\i migrations/001_xendit_contracts_and_payment_tables.sql` (psql 내부)

## FK 정리 (기존 스키마 기준)

| 테이블 / 컬럼 | 참조 | 비고 |
|---------------|------|------|
| contracts.booking_id | bookings(id) | UUID |
| contracts.consumer_id | users(id) | UUID |
| contracts.provider_id | providers(id) | UUID |
| payment_sessions.contract_id | contracts(contract_id) | VARCHAR(50) |
| payment_sessions.booking_id | bookings(id) | UUID |
| payment_sessions.buyer_id | users(id) | UUID |
| escrow_accounts.* | contracts, bookings, users, providers, payment_sessions | 위와 동일 |
| disbursements.escrow_id | escrow_accounts(escrow_id) | VARCHAR(50) |
| disbursements.provider_id | providers(id) | UUID |

## payment_sessions 가 이미 있는 경우

TypeORM 등으로 이미 `payment_sessions` 테이블이 있고, `booking_id`/`buyer_id`가 VARCHAR(50)인 경우:

- 이 스크립트는 `CREATE TABLE IF NOT EXISTS` 이므로 **기존 테이블은 수정하지 않습니다**.
- 새 스키마(FK + UUID)로 맞추려면:
  - 데이터가 없다면: `DROP TABLE IF EXISTS payment_sessions;` 후 이 스크립트 다시 실행.
  - 데이터가 있다면: `booking_id`, `buyer_id`를 UUID로 변경하고 FK 추가하는 별도 ALTER 마이그레이션 작성 후 실행.

## 앱과의 관계

- 현재 `PaymentSession` 엔티티는 `contract_id`, `booking_id`, `buyer_id`를 **VARCHAR(50)** 로 매핑하고 있습니다.
- DB에서 이 컬럼들을 **UUID**로 만들어도 TypeORM에서는 문자열로 읽으므로 그대로 사용 가능합니다.
- `contracts` 테이블은 새로 추가된 것이며, 기존 `smart_contracts` 테이블과는 별도입니다. 앱에서 `contracts`를 사용하려면 서비스/레포지토리에서 이 테이블을 참조하도록 수정이 필요할 수 있습니다.
