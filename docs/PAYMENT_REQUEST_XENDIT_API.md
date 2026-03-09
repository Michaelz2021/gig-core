# Payment Request → Xendit API 정리

결제 요청을 받아 **Xendit**으로 전달하는 API와 내부 흐름입니다.

---

## 1. 노출되는 API (앱/클라이언트가 호출)

Base URL: `{HOST}/api/v1`  
인증: `Authorization: Bearer <JWT>`

### 1) POST `/payment/xenditprocess`

| 항목 | 내용 |
|------|------|
| **Controller** | `PaymentsController` (`src/modules/payments/payments.controller.ts`) |
| **메서드** | POST |
| **경로** | `/api/v1/payment/xenditprocess` |
| **역할** | 결제 세션 + 결제 수단 정보를 받아 Xendit 결제 요청 생성 후, 결제 URL 또는 QR 코드 반환 |

### 2) POST `/payment/xendit/process`

| 항목 | 내용 |
|------|------|
| **Controller** | `PaymentXenditController` (`src/modules/payments/payment-xendit.controller.ts`) |
| **메서드** | POST |
| **경로** | `/api/v1/payment/xendit/process` |
| **역할** | 위와 동일 (같은 `PaymentsService.xenditProcess()` 호출) |

둘 다 **같은 서비스**를 타므로, 앱에서는 둘 중 하나만 사용하면 됩니다.

---

## 2. Request Body (XenditProcessDto)

```json
{
  "payment_session_id": "PSESS-2025-001",
  "booking_id": "16ce453c-428a-4b1f-b685-1d336e4d339d",
  "payment_method": "CARD",
  "return_url": "gigmarket://payment/callback",
  "card_details": {
    "card_number": "4000000000000002",
    "exp_month": "12",
    "exp_year": "2028",
    "cvv": "123"
  }
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `payment_session_id` | string | O | 결제 세션 ID (initialize 단계에서 발급) |
| `booking_id` | string | O | 예약(booking) ID |
| `payment_method` | enum | O | `CARD` \| `GCASH` \| `PAYMAYA` \| `QRPH` \| `INSTAPAY` |
| `return_url` | string | O | 결제 완료/실패 후 리다이렉트 URL (앱 딥링크 또는 웹 URL) |
| `card_details` | object | CARD일 때만 | 카드 번호, 만료월/년, CVV |

---

## 3. 내부 흐름 (Payment Request → Xendit)

1. **PaymentsController** 또는 **PaymentXenditController**  
   - `POST .../xenditprocess` 또는 `POST .../payment/xendit/process`  
   - Body: `XenditProcessDto`

2. **PaymentsService.xenditProcess(userId, dto)**  
   - `XenditPaymentService.processPayment(dto)` 호출

3. **XenditPaymentService** (`src/modules/payments/services/xendit-payment.service.ts`)
   - `validatePaymentSession(dto.payment_session_id)`  
     - 세션 존재·미완료·미만료 검사
   - `XENDIT_PAYMENT_METHODS[dto.payment_method]`  
     - 채널 설정 로드 (`config/xendit-payment-methods.config.ts`)
   - Booking·User 조회 → `bookingNumber`, `consumerEmail`, `consumerPhone`, `consumerName` 구성
   - **buildXenditRequest(...)**  
     - Xendit API에 보낼 payload 생성 (아래 4번 참고)
   - **Xendit API 호출**
     - `this.xendit.PaymentRequest.createPaymentRequest({ data: xenditRequest })`
     - 실제 요청 대상: **https://api.xendit.co** (xendit-node SDK 사용)
   - 응답에서 `payment_url`, `qr_code`, `expires_at` 등 추출
   - PaymentSession DB 업데이트 후 클라이언트용 응답 반환

4. **Xendit에 전달되는 요청 형식 (buildXenditRequest 결과)**

```typescript
// xendit-payment.service.ts - buildXenditRequest() 결과
{
  reference_id: bookingNumber,        // 예약 번호
  type: 'PAY',
  country: 'PH',
  currency: 'PHP',
  channel_code: methodConfig.channel_code,  // GCASH, PAYMAYA, QRPH, PH_INSTAPAY, CARD
  request_amount: session.total_amount,
  capture_method: 'AUTOMATIC',

  customer: {
    type: 'INDIVIDUAL',
    reference_id: bookingNumber,
    email: consumerEmail,
    mobile_number: consumerPhone,
  },

  metadata: {
    payment_session_id: dto.payment_session_id,
    contract_id: session.contract_id,
    booking_id: bookingNumber,
    platform: 'gig-market',
    environment: process.env.NODE_ENV,
  },

  description: `Gig-Market service payment - ${bookingNumber}`,

  channel_properties: {
    // GCASH/PAYMAYA/INSTAPAY/CARD: success_redirect_url, failure_redirect_url, cancel_redirect_url
    // CARD: + card_information (card_number, exp_month, exp_year, cvv, cardholder_name)
  },
}
```

---

## 4. Xendit API 호출 위치 (코드)

**파일:** `src/modules/payments/services/xendit-payment.service.ts`

```typescript
// 6. Call Xendit API (https://api.xendit.co)
const xenditCall = this.xendit.PaymentRequest.createPaymentRequest({
  data: xenditRequest,
});
xenditResponse = await Promise.race([xenditCall, xenditTimeoutPromise]);
```

- **SDK:** `xendit-node` → `PaymentRequest.createPaymentRequest({ data })`
- **실제 엔드포인트:** Xendit 서버 `https://api.xendit.co` (SDK가 내부적으로 호출)
- **타임아웃:** 18초 (초과 시 504 Gateway Timeout)

---

## 5. 지원 결제 수단 (channel_code)

| payment_method | channel_code | redirect | card_details |
|----------------|--------------|----------|--------------|
| CARD | CARD | O | O |
| GCASH | GCASH | O | X |
| PAYMAYA | PAYMAYA | O | X |
| QRPH | QRPH | X (QR 표시) | X |
| INSTAPAY | PH_INSTAPAY | O | X |

설정: `src/config/xendit-payment-methods.config.ts`

---

## 6. Response (클라이언트에 반환)

```json
{
  "xendit_payment_id": "xnd_...",
  "payment_url": "https://checkout.xendit.co/web/...",
  "qr_code": "data:image/png;base64,...",
  "redirect_required": true,
  "expires_at": "2025-12-25T15:00:00.000Z"
}
```

- **redirect_required:** true면 `payment_url`로 리다이렉트, false면 `qr_code` 표시(QRPH 등).

---

## 요약

| 구분 | 내용 |
|------|------|
| **클라이언트가 부르는 API** | `POST /api/v1/payment/xenditprocess` 또는 `POST /api/v1/payment/xendit/process` |
| **Body** | `XenditProcessDto` (payment_session_id, booking_id, payment_method, return_url, card_details?) |
| **백엔드에서 Xendit 호출** | `XenditPaymentService` → `xendit.PaymentRequest.createPaymentRequest({ data: xenditRequest })` |
| **Xendit 요청 구성** | `xendit-payment.service.ts`의 `buildXenditRequest()` |
| **Xendit 서버** | https://api.xendit.co (xendit-node SDK 사용) |
