# Xendit 결제 요청 메시지 비교

curl 예시와 현재 코드가 보내는 body 차이 정리.

## 공통 (동일)

| 필드 | curl 예시 | 현재 코드 | 비고 |
|------|-----------|-----------|------|
| reference_id | UUID 또는 주문 ID | bookingNumber (BOOK-xxx 또는 UUID) | 동일 개념 |
| type | PAY | PAY | 동일 |
| country | PH | PH | 동일 |
| currency | PHP | PHP | 동일 |
| request_amount | 1000 | session.total_amount | 결제 세션 금액 |
| capture_method | AUTOMATIC | AUTOMATIC | 동일 |
| channel_code | CARDS | CARDS | 동일 |
| channel_properties.card_details | cvn, card_number, expiry_year, expiry_month, cardholder_* | 동일 필드 사용 | 동일 |
| channel_properties.skip_three_ds | false | false | 동일 |
| channel_properties.success_return_url / failure_return_url | 있음 | 있음 (return_url 기반) | 동일 |
| description | 문자열 | `Gig-Market service payment - ${bookingNumber}` | 동일 구조 |

---

## 차이점 (수정 반영)

### 1. mid_label (CARDS 전용)

- **curl 예시:** `"mid_label": "CTV_TEST"`
- **이전 코드:** 없음
- **현재 코드:** CARDS 채널에 `mid_label: 'CTV_TEST'` 추가됨 (테스트 환경용)

### 2. metadata

- **curl 예시:** `order_id`, `booking_id`, `customer_type` 등
- **현재 코드:** `payment_session_id`, `contract_id`, `booking_id`, `platform`, `environment`
- **비고:** Xendit metadata는 자유 키/값. 우리는 세션·계약 추적용으로 위 필드를 사용. 필요 시 `order_id` 등 추가 가능.

### 3. customer

- **curl 예시:** (예시에 미포함)
- **현재 코드:** `customer` 객체 전송 (type, reference_id, email, mobile_number, individual_detail)
- **비고:** v3 문서상 선택 필드. 소비자 정보 전달용으로 유지.

---

## curl 예시의 JSON 오타

예시에 있던 부분은 아래처럼 수정하면 유효한 JSON입니다.

- `"description": "..."",` → 끝 따옴표 하나 제거
- `"metadata": { "order_id": "  "booking_id": "..."` → `"order_id": "...", "booking_id": "..."` 로 키/값 분리

---

## 현재 코드가 보내는 body 형태 (CARDS 예시)

```json
{
  "reference_id": "BOOK-1769413226415-L4RUD26IK",
  "type": "PAY",
  "country": "PH",
  "currency": "PHP",
  "request_amount": 1000,
  "capture_method": "AUTOMATIC",
  "channel_code": "CARDS",
  "channel_properties": {
    "mid_label": "CTV_TEST",
    "success_return_url": "https://...?status=success",
    "failure_return_url": "https://...?status=failed",
    "card_details": {
      "card_number": "4000000000001091",
      "expiry_month": "12",
      "expiry_year": "2025",
      "cvn": "123",
      "cardholder_first_name": "John",
      "cardholder_last_name": "Doe",
      "cardholder_email": "john.doe@example.com",
      "cardholder_phone_number": "+628123456789"
    },
    "skip_three_ds": false
  },
  "description": "Gig-Market service payment - BOOK-...",
  "metadata": {
    "payment_session_id": "PSESS-...",
    "contract_id": "...",
    "booking_id": "...",
    "platform": "gig-market",
    "environment": "development"
  },
  "customer": {
    "type": "INDIVIDUAL",
    "reference_id": "...",
    "email": "...",
    "mobile_number": "...",
    "individual_detail": { "given_names": "...", "surname": "..." }
  }
}
```
