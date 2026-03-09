# Phase 2 & Phase 3 검증 결과

## Phase 2: Escrow & Disbursement (High Priority)

| 항목 | 상태 | 설명 |
|------|------|------|
| **Escrow Tracking 테이블 수정** | ✅ | `escrow_accounts` 테이블 및 `EscrowAccount` 엔티티 (migration 002_). 기존 `escrows` 테이블(Escrow)과 별도로 Xendit 흐름용 에스크로 추적. |
| **Disbursements 테이블 생성** | ✅ | `disbursements` 테이블 및 `Disbursement` 엔티티 (migration 002_), `disbursement.entity.ts` |
| **Release Escrow API** | ✅ | `POST /payment/escrows/:id/release` (JWT) → `PaymentsService.releaseEscrow(escrowId, userId)`. 기존 `escrows` 테이블 기준으로 보류 해제 및 provider 지갑 입금. (참고: `escrow_accounts` 해제는 Xendit Disbursement Webhook 완료 시 상태 갱신으로 처리됨) |
| **Xendit Disbursement Webhook** | ✅ | `POST /api/v1/webhooks/xendit/disbursement` → `XenditWebhookService.handleDisbursementWebhook`. COMPLETED 시 `processCompletedDisbursement`(disbursement + escrow_account 상태 갱신, provider 알림), FAILED 시 `processFailedDisbursement` |

### Phase 2 상세

- **Escrow 두 종류**
  - **escrows** (기존): `Escrow` 엔티티. `POST /payment/escrows/:id/release` 로 수동 해제.
  - **escrow_accounts** (Xendit): `EscrowAccount` 엔티티. 결제·디스버스먼트 웹훅으로 상태 갱신.
- **Disbursements**: migration으로 테이블 생성, `Disbursement` 엔티티로 매핑. 웹훅에서 `xendit_disbursement_id` 기준으로 COMPLETED/FAILED 반영.

---

## Phase 3: 부가 기능 (Medium Priority)

| 항목 | 상태 | 설명 |
|------|------|------|
| **Payment Status Polling** | ✅ | `GET /payment/status/:sessionId` (JWT) → `getPaymentStatus(sessionId, userId)`. 클라이언트가 주기적으로 호출해 `payment_session_id`, `status`, `amount`, `paid_at`, `expires_at` 등 조회. |
| **Error Handling & Logging** | ✅ | `XenditExceptionFilter` 가 `PaymentsController` 에 적용됨. `exception.name === 'XenditError'` 일 때 `console.error('[Xendit Error]', { code, message, details })` 로깅 후 400 + "Payment processing failed" 반환. 그 외 예외는 재throw하여 전역 필터 처리. |
| **Notification Integration** | ✅ | `XenditWebhookService` 에서 `NotificationsService` 주입 및 사용. 결제 성공 시 `processSuccessfulPayment` 에서 구매자(buyer_id)에게 PAYMENT 알림("Payment successful"). 디스버스먼트 완료 시 `processCompletedDisbursement` 에서 제공자(provider_id)에게 PAYMENT 알림("Payout completed"). 알림 실패 시 웹훅 처리 자체는 실패하지 않도록 try/catch. |

### Phase 3 상세

- **Payment Status Polling**: 세션 존재·본인 여부 검사 후 7개 필드만 반환. 클라이언트는 `status === 'PAID'` 등으로 폴링 종료 가능.
- **Error Handling**: payment 라우트에서 Xendit SDK 에러 시 400으로 통일, 로그로 상세 보존.
- **Notification**: DB 저장 + FCM 푸시(NotificationsService.send). `relatedEntityType` / `relatedEntityId` 로 결제·디스버스먼트 연결.

---

## API 정리 (Phase 2·3 관련)

| Method | Path | 용도 |
|--------|------|------|
| GET | /payment/status/:sessionId | Payment Status Polling |
| GET | /payment/escrows | 에스크로 목록 (기존 escrows) |
| GET | /payment/escrows/:id | 에스크로 상세 |
| POST | /payment/escrows/:id/release | Release Escrow (기존 escrows) |
| POST | /api/v1/webhooks/xendit/payment | Xendit Payment Webhook |
| POST | /api/v1/webhooks/xendit/disbursement | Xendit Disbursement Webhook |

---

## 요약

- **Phase 2**: Escrow/Disbursement 테이블·엔티티, Release Escrow API(기존 escrows), Xendit Disbursement Webhook(escrow_accounts + disbursements 상태 및 알림) 모두 구현·연동됨.
- **Phase 3**: Payment Status Polling, Xendit Error Handling & Logging, Notification Integration(결제 성공·디스버스먼트 완료 시 알림) 모두 반영됨.
