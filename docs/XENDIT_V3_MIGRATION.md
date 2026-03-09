# Xendit v3 API 마이그레이션

기존 **xendit-node SDK(v7)** 대신 [Xendit v3 REST API](https://docs.xendit.co/apidocs)를 사용하도록 변경했습니다.

## 변경 요약

| 항목 | 이전 | 이후 |
|------|------|------|
| 호출 방식 | xendit-node SDK `PaymentRequest.createPaymentRequest({ data })` | **직접 HTTP** `POST https://api.xendit.co/v3/payment_requests` |
| 인증 | SDK 내부 (Secret Key) | **Basic Auth**: `Authorization: Basic base64(secretKey + ':')` |
| API 버전 | (SDK 기본) | **Header** `api-version: 2024-11-11` |
| 카드 채널 | `channel_code: 'CARD'` | `channel_code: 'CARDS'` |
| redirect URL 필드 | `success_redirect_url` / `failure_redirect_url` | `success_return_url` / `failure_return_url` |
| 카드 정보 | `card_information` + `cvv` | `card_details` + `cvn`, `expiry_month`, `expiry_year`, `cardholder_*` |
| 응답 URL | `actions[].action === 'AUTH'`, `action.url` | `actions[].type === 'REDIRECT_CUSTOMER'`, `action.value` |

## 수정된 파일

- **`src/modules/payments/services/xendit-api.client.ts`** (신규)  
  - v3 전용 HTTP 클라이언트 (axios, Basic Auth, api-version 헤더)
- **`src/modules/payments/services/xendit-payment.service.ts`**  
  - `XenditApiClient` 주입, `createPaymentRequest` v3 호출, 응답에서 URL/QR 추출 로직 v3 형식 대응
- **`src/modules/rewards/rewards.service.ts`**  
  - `XenditApiClient` 주입, 리워드 결제도 v3 `createPaymentRequest` 사용
- **`src/config/xendit-payment-methods.config.ts`**  
  - v3용 `channel_code`·`channel_properties` (CARDS, success_return_url, card_details.cvn 등)
- **`package.json`**  
  - `xendit-node` 의존성 제거

## 참고

- 공식 문서: [Quick setup](https://docs.xendit.co/apidocs), [Create a payment request](https://docs.xendit.co/apidocs/create-payment-request)
- 인증: Secret API Key를 Basic Auth username으로, password는 빈 문자열 + 콜론(`:`) 후 Base64 인코딩
- 테스트 환경 요청은 실제 은행 연동 없이 동작하며, 요금이 부과되지 않음
