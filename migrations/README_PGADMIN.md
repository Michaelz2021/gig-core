# pgAdmin4에서 테이블 생성하기

`smart_contracts`와 `contracts`가 DB에 없을 때 아래 순서대로 실행하세요.

## 사전 조건

다음 테이블이 이미 있어야 합니다. (없으면 먼저 앱에서 TypeORM synchronize 또는 기존 마이그레이션으로 생성)

- `bookings`
- `users`
- `providers`

## 1. smart_contracts + contracts 생성

1. pgAdmin4에서 해당 DB 연결 후 **Query Tool** 열기.
2. 메뉴 **File → Open** 또는 **Ctrl+O** 로  
   `migrations/000_create_smart_contracts_and_contracts.sql` 선택.
3. **F5** 또는 재생 버튼으로 **전체 실행**.

이렇게 하면 `smart_contracts`, `contracts` 테이블이 생성됩니다.

## 2. payment_sessions, escrow_accounts, disbursements 생성

**방법 A – 한 번에 모두 생성**

- `migrations/001_xendit_contracts_and_payment_tables.sql` 실행  
  → contracts, payment_sessions, escrow_accounts, disbursements 생성  
- **반드시** `000_…` 실행 후에 실행 (contracts 테이블 필요).

**방법 B – disbursements(또는 escrow_accounts)만 없을 때**

- `migrations/002_escrow_accounts_and_disbursements.sql` 실행  
  → escrow_accounts, disbursements 만 생성  
- **전제:** contracts, payment_sessions 가 이미 있어야 함 (000_, 001_ 먼저 실행된 상태).

## 3. 실행 순서 요약

| 순서 | 파일 | 생성되는 테이블 |
|------|------|----------------|
| 1 | `000_create_smart_contracts_and_contracts.sql` | smart_contracts, contracts |
| 2 | `001_xendit_contracts_and_payment_tables.sql` | payment_sessions, escrow_accounts, disbursements (contracts 포함) |
| (보완) | `002_escrow_accounts_and_disbursements.sql` | escrow_accounts, disbursements 만 (나머지 이미 있을 때) |

**disbursements 테이블이 없을 때:**  
먼저 `001_` 전체를 실행해 보세요. (contracts → payment_sessions → escrow_accounts → disbursements 순으로 생성됩니다.)  
이미 contracts·payment_sessions만 있고 escrow_accounts/disbursements가 없다면 `002_`만 실행하면 됩니다.

## 4. 테이블이 안 보일 때

- 쿼리 실행 후 **테이블 목록 새로고침**: 해당 DB → **Schemas → public → Tables** 에서 우클릭 → **Refresh**.
- 다른 스키마에 있는지 확인: **Schemas → public** 이 맞는지 확인.
