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



{
  "success": false,
  "statusCode": 400,
  "timestamp": "2026-02-16T09:03:45.993Z",
  "path": "/api/v1/payment/xenditprocess",
  "method": "POST",
  "message": "Payment session expired"
}

curl --request POST \
  --url https://api.xendit.co/v3/payment_requests \
  --header 'accept: application/json' \
  --header 'api-version: 2024-11-11' \
  --header 'authorization: Basic dW5kZWZpbmVkOnBhc3N3b3Jk' \
  --header 'content-type: application/json' \
  --data '{
  "reference_id": "order_123456_3ds",
  "type": "PAY",
  "country": "PH",
  "currency": "PHP",
  "request_amount": 100,
  "capture_method": "AUTOMATIC",
  "channel_code": "CARDS",
  "channel_properties": {
    "mid_label": "CTV_TEST",
    "card_details": {
      "cvn": "123",
      "card_number": "4000000000001091",
      "expiry_year": "2025",
      "expiry_month": "12",
      "cardholder_first_name": "John",
      "cardholder_last_name": "Doe",
      "cardholder_email": "john.doe@example.com",
      "cardholder_phone_number": "+628123456789"
    },
    "skip_three_ds": false,
    "failure_return_url": "https://xendit.co/failure",
    "success_return_url": "https://xendit.co/success"
  },
  "description": "Payment for Order #123456",
  "metadata": {
    "order_id": "123456",
    "customer_type": "premium"
  }
}'