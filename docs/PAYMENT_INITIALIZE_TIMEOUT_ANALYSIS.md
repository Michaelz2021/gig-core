# Payment Initialize 타임아웃 분석

## 앱 로그 요약

| 항목 | 값 |
|------|-----|
| **URI** | `POST http://13.125.20.235:3000/api/v1/payment/contracts/BOOK-1770436511571-SKNP2R5QV/initialize` |
| **Method** | POST |
| **Path 파라미터** | `BOOK-1770436511571-SKNP2R5QV` (booking_number 형식) |
| **Body** | `{ bookingId: BOOK-1770436511571-SKNP2R5QV, amount: 470.8, currency: PHP }` |
| **인증** | Bearer JWT (sub: `41ea62f4-8329-42ef-a9e3-b38360c76626`, consumer) |
| **에러** | `DioException [receive timeout]` — 30초 동안 응답 없음 |

---

## 분석

### 1. 요청 자체

- 앱은 **booking_number**를 path에 넣어 `contracts/BOOK-xxx/initialize` 형태로 호출하고 있음.
- 서버 스펙상 이 엔드포인트는 **contractId 또는 booking_number** 모두 받도록 수정되어 있음 (`BOOK-` 접두어 시 booking_number로 처리).

### 2. 타임아웃이 나는 이유 (서버 관점)

- **수정된 코드가 배포·재시작되지 않은 경우**  
  - 서버는 path 파라미터를 **contractId(UUID)** 로만 해석함.  
  - `initializePaymentSession(contractId, user.id)` → `findOneSmartContract('BOOK-1770436511571-SKNP2R5QV')` 호출.  
  - Contract는 보통 **id = UUID** 로 조회하는데, `BOOK-...` 는 UUID가 아니어서:
    - DB/ORM에 따라 조회가 실패하거나,
    - 예외 처리 전에 오래 걸리거나,
    - 드라이버/쿼리 동작으로 인해 응답이 30초 안에 오지 않을 수 있음.  
  → **결과: receive timeout.**

- **수정된 코드가 적용된 경우**  
  - `BOOK-` 로 시작하므로 `initializePaymentSessionByBookingNumber(bookingNumber, user.id)` 가 호출됨.  
  - booking_number로 booking만 조회하므로 일반적으로 수백 ms 이내에 응답해야 함.  
  - 이때 30초 타임아웃이 난다면 DB 지연, 해당 booking 없음, 또는 다른 예외(5xx 등) 가능성 확인 필요.

### 3. 결론

| 상황 | 원인 | 대응 |
|------|------|------|
| **배포/재시작 안 함** | 예전 코드가 `BOOK-xxx` 를 contract UUID로 조회해 지연 또는 실패 | **최신 코드 배포 후 API 서버 재시작** |
| **배포/재시작 함** | DB 지연, booking 없음, 4xx/5xx 응답이 느리게 옴 등 | DB/로그 확인, 필요 시 클라이언트 타임아웃 상향 또는 재시도 |

---

## 서버 측 확인 방법

1. **배포된 코드 확인**  
   - `src/modules/payments/payments.controller.ts` 의 `initializePaymentSession` 안에  
     `contractIdOrBookingNumber.startsWith('BOOK-')` 분기 및  
     `initializePaymentSessionByBookingNumber` 호출이 있는지 확인.

2. **동일 요청으로 직접 호출**  
   ```bash
   curl -X POST "http://13.125.20.235:3000/api/v1/payment/contracts/BOOK-1770436511571-SKNP2R5QV/initialize" \
     -H "Authorization: Bearer <동일_JWT>" \
     -H "Content-Type: application/json"
   ```  
   - 몇 초 안에 200 + JSON 이 오면 새 로직 적용된 것.  
   - 30초 넘게 걸리거나 타임아웃이면 아직 예전 로직이 동작 중이거나 서버/DB 이슈 가능.

3. **API 프로세스 재시작**  
   - pm2/systemd 등으로 Nest(Node) 프로세스 재시작 후 위 curl 다시 시도.

---

## 참고: 클라이언트 Body

- 현재 API는 **body 없이** 동작하도록 구현되어 있음.  
- 앱에서 보내는 `{ bookingId, amount, currency }` 는 서버에서 사용하지 않으며, **path 의 `BOOK-xxx` 만 사용**함.  
- Body 는 무시되므로, 타임아웃 원인은 위 서버/배포 쪽 가능성이 큼.
