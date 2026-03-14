# Instant order 결제 초기화 API

## 배경

- **정식 오더**: `bookings` 테이블에 저장 → 결제 초기화 시 `POST /api/v1/payment/contracts/{contractId}/initialize` 사용.
- **Instant 오더**: `instant_bookings` 테이블에 저장. 금액/인보이스는 `instant_invoice` 테이블에 `instant_booking_id`로 연결됨.

기존에는 앱이 두 주문 타입 모두 같은 `contracts/{contractId}/initialize`로 호출해, Instant 주문일 때 `bookings`에서 ID를 찾지 못해 실패함.

## 해결: Instant 전용 API

Instant 주문은 **별도 엔드포인트**를 사용한다.

| 주문 타입   | 결제 초기화 API |
|------------|------------------------------------------|
| 정식 오더  | `POST /api/v1/payment/contracts/:contractId/initialize` (또는 `BOOK-xxx`면 booking_number로 처리) |
| Instant 오더 | `POST /api/v1/payment/instant-bookings/:instantBookingId/initialize` |

### Instant API 상세

- **경로**: `POST /api/v1/payment/instant-bookings/:instantBookingId/initialize`
- **인증**: JWT (Bearer)
- **동작**:
  1. `instant_booking_id`로 `instant_invoice` 1건 조회.
  2. 인보이스가 없으면 404 (인보이스는 프로바이더 확정 등 이후 생성된다고 가정).
  3. `invoice.consumerId`와 JWT `user.id`가 다르면 403.
  4. `payment_status`가 `pending`이 아니면 400.
  5. 기존 PENDING/PROCESSING 세션이 있고 만료 전이면 그대로 반환.
  6. 아니면 `payment_sessions`에 새 세션 생성 (금액은 인보이스의 `total_amount`, `service_amount`, `platform_fee` 사용).
- **응답 형식**: 정식 오더의 `contracts/.../initialize`와 동일 (payment_session_id, amount, breakdown, available_methods, expires_at 등).

## DB 변경

`payment_sessions` 테이블에 **Instant 주문 구분**을 위해 nullable 컬럼 추가:

```sql
ALTER TABLE payment_sessions
  ADD COLUMN IF NOT EXISTS instant_booking_id UUID NULL;
```

- 정식 오더: `instant_booking_id = NULL`.
- Instant 오더: `instant_booking_id = 해당 instant_booking UUID`.  
  동시에 `contract_id`, `booking_id`에는 같은 UUID를 넣어 두어 기존 코드와의 호환을 유지.

TypeORM `synchronize: true` 사용 시 엔티티만 반영하면 컬럼이 생성될 수 있음. 프로덕션은 마이그레이션 스크립트로 추가 권장.

## 앱 연동 요약

- 주문 타입이 **정식 오더** → 기존대로 `contracts/{contractId}/initialize` (또는 `BOOK-xxx`).
- 주문 타입이 **Instant 오더** → `instant-bookings/{instantBookingId}/initialize` 호출.
- 응답 형식은 동일하므로 결제 UI는 그대로 사용 가능.

## 이후 작업 (선택)

- Xendit **process** / **webhook**에서 `payment_sessions.instant_booking_id`가 설정된 경우, `instant_invoice`의 `payment_status` 업데이트 및 Instant 주문 완료 처리 로직 추가.
