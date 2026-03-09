# Swagger로 Xendit 시험이 안 되는 이유

## e2e 테스트는 왜 통과하고, Swagger는 왜 실패하나?

| 구분 | e2e 테스트 | Swagger (POST /payment/xenditprocess) |
|------|------------|----------------------------------------|
| **호출 대상** | Xendit API **직접** (`https://api.xendit.co/v3/payment_requests`) | **우리 백엔드** (`/api/v1/payment/xenditprocess`) |
| **필수 조건** | `XENDIT_SECRET_KEY`만 있으면 됨 | ① JWT 로그인 ② **유효한 payment_session** ③ payment_session_id, booking_id, return_url, payment_method (CARD면 card_details) |
| **실패 시점** | Xendit이 4xx 반환할 때만 실패 | **우리 API에서 먼저 검증** → 세션 없음/만료/이미 결제 완료 시 **Xendit 호출 전에** 400 반환 |

즉, **Swagger로 호출하면 우리 API를 먼저 거치고**, 그 과정에서 아래처럼 막힐 수 있습니다.

1. **Payment session not found**  
   - `payment_session_id`를 안 넣었거나, DB에 없는 값으로 넣은 경우.
2. **Payment session expired**  
   - `POST .../bookings/{bookingNumber}/initialize` (또는 contracts/initialize)로 세션을 만든 지 24시간이 지나 만료된 경우.
3. **Payment already completed**  
   - 이미 그 세션으로 결제 완료된 경우.

e2e 테스트는 **세션/예약 없이** Xendit에 바로 같은 형식으로 요청만 보내서, “Xendit 호출 자체”만 검증합니다.  
반대로 Swagger의 xenditprocess는 **반드시 유효한 payment session이 있어야** 그 다음에 Xendit을 호출합니다.

---

## Swagger에서 시험하려면 (두 가지 방법)

### 방법 1: 정식 플로우 (세션 사용)

1. **JWT 발급**  
   - 예약 소비자 계정으로 로그인 → `accessToken` 복사.
2. **결제 세션 생성**  
   - `POST /api/v1/payment/bookings/BOOK-1769413226415-L4RUD26IK/initialize`  
   - (또는 contracts용이면 `POST .../contracts/{contractId}/initialize`)  
   - 응답에서 **`payment_session_id`** 복사.
3. **Xendit 결제 요청**  
   - `POST /api/v1/payment/xenditprocess`  
   - Body: 방금 받은 `payment_session_id`, 해당 `booking_id`, `payment_method`, `return_url`, (CARD면 `card_details`).

세션이 유효해야만 여기서 Xendit까지 도달합니다.

### 방법 2: Xendit만 직접 시험 (테스트용)

- **`POST /api/v1/payment/test-xendit-request`** (개발 환경에서만 노출)  
- e2e 테스트와 **같은 payload**를 우리 서버가 Xendit에 그대로 보내고, 응답을 그대로 반환합니다.  
- **payment_session 없이** “Xendit으로 요청이 잘 가는지”만 Swagger에서 확인할 때 사용합니다.

자세한 사용법은 Swagger 해당 엔드포인트 설명을 참고하면 됩니다.
