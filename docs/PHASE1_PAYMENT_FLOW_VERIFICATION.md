# Phase 1: 기본 결제 흐름 (Critical) 검증 결과

## ✅ 검증 요약

| 항목 | 상태 | 비고 |
|------|------|------|
| Xendit SDK 설치 및 설정 | ✅ | `xendit-node` in package.json, ConfigService로 `XENDIT_SECRET_KEY` 사용 |
| Payment Sessions 테이블 & 엔티티 | ✅ | `payment_sessions` (migration 002_), `PaymentSession` entity |
| Payment Method Configuration | ✅ | `config/xendit-payment-methods.config.ts` (GCASH, PAYMAYA, QRPH, INSTAPAY, CARD) |
| XenditPaymentService 구현 완성 | ✅ | processPayment, validatePaymentSession, updatePaymentSession, buildXenditRequest (repo 주입 완료) |
| Initialize Payment Session API | ✅ | `POST /payment/contracts/:contractId/initialize` (body 없음), DB 세션 생성 |
| Xendit Payment Webhook | ✅ | XenditWebhookService + XenditWebhookController, PaymentsModule에 등록 |

---

## 1. Xendit SDK 설치 및 설정

- **package.json**: `"xendit-node": "^7.0.0"`
- **XenditPaymentService**: `new Xendit({ secretKey: configService.get('XENDIT_SECRET_KEY') })`
- **.env**: `XENDIT_SECRET_KEY`, `XENDIT_WEBHOOK_VERIFY_TOKEN` 설정 필요

---

## 2. Payment Sessions 테이블 & 엔티티

- **테이블**: `migrations/002_escrow_accounts_and_disbursements.sql` 에서 `payment_sessions` 생성 (contract_id, booking_id, buyer_id, total_amount, service_amount, platform_fee, xendit_*, status, expires_at 등)
- **엔티티**: `src/modules/payments/entities/payment-session.entity.ts` — 위 컬럼과 매핑

---

## 3. Payment Method Configuration

- **파일**: `src/config/xendit-payment-methods.config.ts`
- **포함 메서드**: GCASH, PAYMAYA, QRPH, INSTAPAY, CARD (channel_code, requires_redirect, requires_card_details, channel_properties)

---

## 4. XenditPaymentService 구현 완성

- **위치**: `src/modules/payments/services/xendit-payment.service.ts`
- **구성**:
  - `InjectRepository(PaymentSession)` + `paymentSessionRepository` 주입
  - `processPayment(dto)`: 세션 검증 → 메서드 설정 → Xendit API 호출 → 세션 업데이트 → 응답 반환
  - `validatePaymentSession(sessionId)`: 존재/PAID/만료 검사
  - `updatePaymentSession(sessionId, data)`: 세션 부분 업데이트
  - `buildXenditRequest(session, dto, methodConfig)`: Xendit 요청 body 생성
- **PaymentsService.xenditProcess** 가 `XenditPaymentService.processPayment(dto)` 로 위임하도록 연결됨
- **PaymentsModule** 에 `XenditPaymentService` provider 등록

---

## 5. Initialize Payment Session API

- **엔드포인트**: `POST /payment/contracts/:contractId/initialize` (Body 없음, JWT)
- **컨트롤러**: `PaymentsController.initializePaymentSession(contractId, user.id)`
- **서비스**: `PaymentsService.initializePaymentSession(contractId, userId)`  
  - `validateContract` → 기존 PENDING/PROCESSING 세션 조회 → 없으면 `payment_sessions` 에 신규 세션 생성 → `formatSessionResponse` 반환

---

## 6. Xendit Payment Webhook

- **컨트롤러**: `XenditWebhookController` — `POST /api/v1/webhooks/xendit/payment`, `POST /api/v1/webhooks/xendit/disbursement`
- **서비스**: `XenditWebhookService`  
  - `verifyWebhook(callbackToken)`  
  - `handlePaymentWebhook`: SUCCEEDED → `processSuccessfulPayment`, FAILED → `processFailedPayment`  
  - `handleDisbursementWebhook`: COMPLETED/FAILED → disbursement 및 escrow_accounts 상태 갱신
- **모듈**: `PaymentsModule` 에 `XenditWebhookController`, `XenditWebhookService` 등록  
  - `TypeOrmModule.forFeature([EscrowAccount, Disbursement])`, `NotificationsModule` import

---

## API 흐름 요약

1. **세션 초기화**: `POST /payment/contracts/:contractId/initialize` → `payment_session_id`, amount, breakdown, available_methods, expires_at
2. **결제 요청**: `POST /payment/xenditprocess` (또는 `POST /payment/xendit/process`) — body: `payment_session_id`, `booking_id`, `payment_method`, `return_url` → Xendit API 호출 후 `payment_url` / `qr_code` 등 반환
3. **상태 조회**: `GET /payment/status/:sessionId` → payment_session_id, status, amount, paid_at 등
4. **웹훅**: Xendit → `POST /api/v1/webhooks/xendit/payment` (또는 disbursement) → 세션/디스버스먼트 상태 반영

---

## 환경 변수

- `XENDIT_SECRET_KEY`: Xendit API 시크릿 키
- `XENDIT_WEBHOOK_VERIFY_TOKEN`: 웹훅 검증용 토큰 (헤더 `x-callback-token` 과 일치해야 함)
