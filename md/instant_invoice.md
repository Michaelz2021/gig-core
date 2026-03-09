1. Instant Invoice 저장용 API
1.1 인보이스 생성 (Order 버튼 시 호출)
POST /api/v1/instant-invoices
역할: Order Now에서 프로바이더 선택 후 Order 눌렀을 때, instant_invoice 한 건 생성하고 결제 플로우에 쓸 id를 반환.
인증: Bearer JWT (consumer).
Request body 예시 (테이블 컬럼과 1:1 맞춤):
{
  "listing_id": "uuid",
  "consumer_id": "uuid",
  "provider_id": "uuid",
  "instant_booking_id": "uuid",
  "service_date": "2025-02-01",
  "service_time": "14:00:00",
  "service_address": "123 Main St, Manila",
  "service_lat": 14.5995,
  "service_lng": 120.9842,

  "price_type": "VARIANT",
  "variant_id": "uuid",
  "addon_item_ids": ["uuid1", "uuid2"],
  "extra_person_count": 1,
  "base_price": 500.00,
  "addons_total": 100.00,
  "person_fee": 50.00,
  "travel_fee": 80.00,
  "final_price": 730.00,

  "service_amount": 730.00,
  "platform_fee": 51.10,
  "vatable_amount": 678.90,
  "vat_amount": 81.47,
  "total_amount": 811.37,

  "consumer_notes": "optional notes"
}

서버 처리:
consumer_id는 JWT에서 채우거나, body로 받아서 검증.
listing_id / provider_id / instant_booking_id 등으로 서비스/프로바이더/인스턴트 예약과 매칭.
DB에 instant_invoice 한 행 INSERT.
booking_status: 'confirmed', payment_status / settlement_status: 'pending'.
Response 예시:
{
  "success": true,
  "data": {
    "id": "invoice-uuid",
    "total_amount": 811.37,
    "payment_status": "pending",
    "booking_status": "confirmed",
    "created_at": "2025-01-31T10:00:00Z"
  }
}

결제 세션 초기화 (지불 요청 시작)
POST /api/v1/payment/contracts/:id/initialize
(기존 엔드포인트를 그대로 쓸 수 있음)
역할: id가 instant_invoice.id일 때도 처리하도록 서버를 확장.
Request body (현재 앱과 동일):
{  "bookingId": "instant-invoice-uuid",  "amount": 811.37,  "currency": "PHP"}
서버 처리:
bookingId가 instant_invoice.id인지 조회.
있으면: 해당 row의 total_amount와 요청의 amount 일치 여부 검사 (보안).
결제 세션 생성 (Xendit 등 연동).
Response는 기존과 동일하게 payment_session_id, expires_at, 결제 수단 목록 등 반환.
즉, instant_invoice 테이블에 저장한 뒤, 그 id를 bookingId로 넘겨 기존 “지불 요청” API를 그대로 쓰면 됩니다.

2.2 결제 실행 (기존 유지)
POST /api/v1/payment/xenditprocess
앱이 이미 호출 중인 그대로 두고, bookingId에 instant_invoice.id를 넣어서 호출.
2.3 결제 완료 시 인보이스 갱신 (웹훅/백엔드 내부)
Xendit(또는 사용 중인 PG) 웹훅에서 “결제 완료” 수신 시:
payment_ref에 PG 결제 참조 번호 저장.
payment_status = 'paid'.
필요하면 settlement_status 업데이트.
“취소/실패” 시: payment_status = 'failed', cancellation_reason 등 처리.






flutter: [DIO]
flutter: [TopTierCard] Category found for Juan Dela Cruz Home Services: Plumbing
flutter: [TopTierCard] Category found for Maria Santos: Tutoring
flutter: [TopTierCard] Category found for Garcia Events Management: Event Planning
flutter: [TopTierCard] Category found for Anna Rodriguez: Web Development
flutter: [TopTierCard] Category found for Fernandez Home Solutions: HVAC
flutter: [DIO] *** Request ***
flutter: [DIO] uri: http://13.125.20.235:3000/api/v1/payment/contracts/6efe22d2-068e-4214-8c68-f4779c85d972/initialize
flutter: [DIO] method: POST
flutter: [DIO] responseType: ResponseType.json
flutter: [DIO] followRedirects: true
flutter: [DIO] persistentConnection: true
flutter: [DIO] connectTimeout: 0:00:30.000000
flutter: [DIO] sendTimeout: null
flutter: [DIO] receiveTimeout: 0:00:30.000000
flutter: [DIO] receiveDataWhenStatusError: true
flutter: [DIO] extra: {}
flutter: [DIO] headers:
flutter: [DIO]  Content-Type: application/json
flutter: [DIO]  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJzdWIiOiI0MWVhNjJmNC04MzI5LTQyZWYtYTllMy1iMzgzNjBjNzY2MjYiLCJ1c2VyVHlwZSI6ImNvbnN1bWVyIiwibG9naW5BcyI6ImNvbnN1bWVyIiwiaWF0IjoxNzcyMjQ1OTc1LCJleHAiOjE3NzQ4Mzc5NzV9.9K9OxtW2axi_TVXimB0i_icaImqO3ZPzmyAr_38PgYM
flutter: [DIO] data:
flutter: [DIO] {bookingId: 6efe22d2-068e-4214-8c68-f4779c85d972, amount: 1500, currency: PHP}
flutter: [DIO]
flutter: [DIO] *** DioException ***:
flutter: [DIO] uri: http://13.125.20.235:3000/api/v1/payment/contracts/6efe22d2-068e-4214-8c68-f4779c85d972/initialize
flutter: [DIO] DioException [bad response]: This exception was thrown because the response has a status code of 500 and RequestOptions.validateStatus was configured to throw for this status code.
The status code of 500 has the following meaning: "Server error - the server failed to fulfil an apparently valid request"
Read more about status codes at https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
In order to resolve this exception you typically have either to verify and fix your request code or you have to fix the server code.
flutter: [DIO] *** Response ***
flutter: [DIO] uri: http://13.125.20.235:3000/api/v1/payment/contracts/6efe22d2-068e-4214-8c68-f4779c85d972/initialize
flutter: [DIO] Response Text:
flutter: [DIO] {"success":false,"statusCode":500,"message":"relation \"smart_contracts\" does not exist"}
flutter: [DIO]
flutter: [DIO]
flutter: [DIO] *** Request ***
flutter: [DIO] uri: http://13.125.20.235:3000/api/v1/payment/contracts/6efe22d2-068e-4214-8c68-f4779c85d972/initialize
flutter: [DIO] method: POST
flutter: [DIO] responseType: ResponseType.json
flutter: [DIO] followRedirects: true
flutter: [DIO] persistentConnection: true
flutter: [DIO] connectTimeout: 0:00:30.000000
flutter: [DIO] sendTimeout: null
flutter: [DIO] receiveTimeout: 0:00:30.000000
flutter: [DIO] receiveDataWhenStatusError: true
flutter: [DIO] extra: {}
flutter: [DIO] headers:
flutter: [DIO]  Content-Type: application/json
flutter: [DIO]  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJzdWIiOiI0MWVhNjJmNC04MzI5LTQyZWYtYTllMy1iMzgzNjBjNzY2MjYiLCJ1c2VyVHlwZSI6ImNvbnN1bWVyIiwibG9naW5BcyI6ImNvbnN1bWVyIiwiaWF0IjoxNzcyMjQ1OTc1LCJleHAiOjE3NzQ4Mzc5NzV9.9K9OxtW2axi_TVXimB0i_icaImqO3ZPzmyAr_38PgYM
flutter: [DIO] data:
flutter: [DIO] {bookingId: 6efe22d2-068e-4214-8c68-f4779c85d972, amount: 1500, currency: PHP}
flutter: [DIO]
flutter: [DIO] *** DioException ***:
flutter: [DIO] uri: http://13.125.20.235:3000/api/v1/payment/contracts/6efe22d2-068e-4214-8c68-f4779c85d972/initialize
flutter: [DIO] DioException [bad response]: This exception was thrown because the response has a status code of 500 and RequestOptions.validateStatus was configured to throw for this status code.
The status code of 500 has the following meaning: "Server error - the server failed to fulfil an apparently valid request"
Read more about status codes at https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
In order to resolve this exception you typically have either to verify and fix your request code or you have to fix the server code.
flutter: [DIO] *** Response ***
flutter: [DIO] uri: http://13.125.20.235:3000/api/v1/payment/contracts/6efe22d2-068e-4214-8c68-f4779c85d972/initialize
flutter: [DIO] Response Text:
flutter: [DIO] {"success":false,"statusCode":500,"message":"relation \"smart_contracts\" does not exist"}
flutter: [DIO]
flutter: [DIO]
flutter: [DIO] *** Request ***
flutter: [DIO] uri: http://13.125.20.235:3000/api/v1/payment/contracts/6efe22d2-068e-4214-8c68-f4779c85d972/initialize
flutter: [DIO] method: POST
flutter: [DIO] responseType: ResponseType.json
flutter: [DIO] followRedirects: true
flutter: [DIO] persistentConnection: true
flutter: [DIO] connectTimeout: 0:00:30.000000
flutter: [DIO] sendTimeout: null
flutter: [DIO] receiveTimeout: 0:00:30.000000
flutter: [DIO] receiveDataWhenStatusError: true
flutter: [DIO] extra: {}
flutter: [DIO] headers:
flutter: [DIO]  Content-Type: application/json
flutter: [DIO]  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJzdWIiOiI0MWVhNjJmNC04MzI5LTQyZWYtYTllMy1iMzgzNjBjNzY2MjYiLCJ1c2VyVHlwZSI6ImNvbnN1bWVyIiwibG9naW5BcyI6ImNvbnN1bWVyIiwiaWF0IjoxNzcyMjQ1OTc1LCJleHAiOjE3NzQ4Mzc5NzV9.9K9OxtW2axi_TVXimB0i_icaImqO3ZPzmyAr_38PgYM
flutter: [DIO] data:
flutter: [DIO] {bookingId: 6efe22d2-068e-4214-8c68-f4779c85d972, amount: 1500, currency: PHP}
flutter: [DIO]
flutter: [DIO] *** DioException ***:
flutter: [DIO] uri: http://13.125.20.235:3000/api/v1/payment/contracts/6efe22d2-068e-4214-8c68-f4779c85d972/initialize
flutter: [DIO] DioException [bad response]: This exception was thrown because the response has a status code of 500 and RequestOptions.validateStatus was configured to throw for this status code.
The status code of 500 has the following meaning: "Server error - the server failed to fulfil an apparently valid request"
Read more about status codes at https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
In order to resolve this exception you typically have either to verify and fix your request code or you have to fix the server code.
flutter: [DIO] *** Response ***
flutter: [DIO] uri: http://13.125.20.235:3000/api/v1/payment/contracts/6efe22d2-068e-4214-8c68-f4779c85d972/initialize
flutter: [DIO] Response Text:
flutter: [DIO] {"success":false,"statusCode":500,"message":"relation \"smart_contracts\" does not exist"}
flutter: [DIO]
flutter: [DIO]