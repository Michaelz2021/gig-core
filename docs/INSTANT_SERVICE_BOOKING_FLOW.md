# Instant Service Booking 요청 처리 과정 정리

앱에서 **instant service booking** 요청이 생성되어 서버로 올라온 뒤, 서버가 처리하는 과정을 정리한 문서입니다.

---

## 1. 전체 흐름 요약

```
[앱] Consumer가 즉시 예약 요청 생성
        ↓
    POST /api/v1/instant-bookings
        ↓
[서버] instant_bookings 테이블에 행 INSERT (status=PENDING)
        ↓
    응답: { booking_id, status: "PENDING", created_at }
        ↓
[앱] (선택) GET /api/v1/instant-bookings/:id 로 상태/상세 조회
[앱] Provider에게 대기열 노출 등 (앱/별도 채널)
        ↓
[앱] Provider가 수락
        ↓
    POST /api/v1/booking-queue/:id/accept
        ↓
[서버] 해당 instant_booking의 ack_item_list에 ACCEPTED 항목 추가
        ↓
[앱] (Order Now 시) POST /api/v1/instant-invoices (instant_booking_id 포함) → 결제 플로우
```

---

## 2. 단계별 처리 내용

### 2.1 앱 → 서버: 즉시 예약 요청 생성

| 항목 | 내용 |
|------|------|
| **API** | `POST /api/v1/instant-bookings` |
| **인증** | 없음 (`@Public()`) |
| **Body** | `CreateInstantBookingDto`: `userId`, `serviceCategoryId`, `timeSlot`, `location`, `priceRange` |
| **Body 정규화** | `main.ts` 미들웨어에서 snake_case → camelCase 변환: `user_id`→`userId`, `service_category`→`serviceCategoryId`, `time_slot`→`timeSlot`, `price_range`/`prince_range`→`priceRange` |

**서버 처리 (`InstantBookingsService.create`):**

1. DTO를 `InstantBooking` 엔티티로 변환  
   - `userId`, `serviceCategoryId`, `timeSlot`, `location`, `priceRange` 설정  
   - `status = 'PENDING'`  
   - `ackItemList` 는 비움 (아직 수락 없음)
2. `instant_bookings` 테이블에 INSERT
3. **푸시 알림 (비동기)**  
   - 요청된 `serviceCategoryId` 로 `service_listings` 테이블에서 `category_id`·`is_active = true` 인 항목 조회  
   - 해당 리스팅들의 **provider_id** 를 수집(중복 제거)  
   - **providers** 테이블에서 각 provider_id에 해당하는 **user_id** 조회  
   - **user_device_tokens** 테이블에서 위 user_id들 중 **provider 앱(app_mode = provider)** 의 활성 FCM 토큰 조회  
   - 수집한 토큰으로 FCM 푸시 발송 (제목/내용 + data: type, booking_id, service_category_id, time_slot)  
   - 푸시 실패 시에도 예약 생성 응답은 그대로 반환
4. 응답 반환: `{ booking_id: saved.id, status: saved.status, created_at: saved.createdAt }`

**DB 저장 내용 (`instant_bookings`):**

- `id` (UUID)
- `user_id` (consumer)
- `service_category_id`
- `time_slot` (timestamptz)
- `location` (jsonb: address, lat, lng)
- `price_range` (jsonb: min, max)
- `ack_item_list` (jsonb, 초기에는 null)
- `status` ('PENDING')
- `created_at`, `updated_at`

---

### 2.2 앱 → 서버: 예약 한 건 조회 (상태/상세)

| 항목 | 내용 |
|------|------|
| **API** | `GET /api/v1/instant-bookings/:id` |
| **인증** | 없음 (`@Public()`) |

**서버 처리 (`InstantBookingsService.findOne`):**

- `instant_bookings` 에서 `id` 로 한 건 조회
- 없으면 404
- 있으면 해당 행 그대로 반환 (ack_item_list, status 등 포함)

---

### 2.3 앱 → 서버: Provider가 대기열 항목 수락

| 항목 | 내용 |
|------|------|
| **API** | `POST /api/v1/booking-queue/:id/accept` |
| **인증** | 없음 (`@Public()`) |
| **Path** | `:id` = instant_booking id (body의 `booking_id` 와 동일하게 넣음) |
| **Body** | `booking_id`, `provider_id`, `item_id` (item_id = service_listings.id) |

**서버 처리 (`InstantBookingsService.acceptQueueItem`):**

1. **item_id 검증**  
   - `service_listings` 에서 `id = item_id` 인 리스팅 조회  
   - 없으면 404  
   - 해당 리스팅의 `provider_id` 가 body의 `provider_id` 와 일치하는지 확인 → 아니면 400 (Provider does not own this listing)
2. **instant_booking 조회**  
   - `instant_bookings` 에서 `id = booking_id` 조회  
   - 없으면 404
3. **중복 수락 방지**  
   - `ack_item_list` 에 이미 동일 `itemid` 가 있으면 400 (This item has already been accepted)
4. **ack_item_list 업데이트**  
   - 새 항목 추가: `{ itemid: itemId, provider_response: 'ACCEPTED', provider_response_at: ISO 문자열 }`  
   - `instant_bookings` UPDATE 후 저장
5. 응답: `{ booking_id, ack_item_list }`

**정리:**  
Provider가 자신의 리스팅(`service_listings.id`)으로 해당 instant_booking을 수락하면, 해당 예약의 `ack_item_list` 에만 ACCEPTED가 쌓입니다. 서버는 “어떤 provider에게 대기열을 보여줄지”를 계산하지 않고, 앱이 보낸 `booking_id` / `provider_id` / `item_id` 만 검증해 반영합니다.

---

### 2.4 (참고) Order Now → 결제까지

- Consumer가 Provider를 선택하고 “Order” 등을 누르면, 앱에서 **`POST /api/v1/instant-invoices`** 호출 (JWT 필요).
- Body에 **`instant_booking_id`** 를 넣어 인보이스를 생성하고, 반환된 id로 결제 플로우(초기화·결제·웹훅 등)를 진행합니다.
- 즉시 예약 “요청 생성 → 수락” 까지가 **instant-bookings + booking-queue** 이고, “수락된 예약을 주문/결제로 만드는 것”이 **instant-invoices + payments** 입니다.

---

## 3. 관련 테이블 / 엔티티

| 테이블 | 용도 |
|--------|------|
| `instant_bookings` | 즉시 예약 요청 1건 (consumer, 카테고리, 시간, 장소, 가격대, 수락 목록, 상태) |
| `service_listings` | Provider의 서비스 리스팅; `item_id` 로 수락 시 소유권 검증에 사용 |
| `instant_invoices` | Order Now 시 생성되는 인보이스; `instant_booking_id` 로 instant_booking과 연결 |

---

## 4. API 목록 (엔드포인트 기준)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/v1/instant-bookings` | 즉시 예약 요청 생성 (앱에서 요청 올라옴) |
| GET | `/api/v1/instant-bookings/:id` | 해당 즉시 예약 한 건 조회 |
| POST | `/api/v1/booking-queue/:id/accept` | Provider가 대기열 항목(해당 예약+리스팅) 수락 |

---

## 5. 푸시가 안 나갈 때 진단

POST instant-bookings 후 서버 로그에 `[InstantBooking]` / `[InstantBooking Push]` 가 전혀 없으면:

1. **배포/재시작 확인**  
   최신 코드가 반영된 뒤 `pm2 restart` 등으로 재시작했는지 확인.  
   정상이면 **POST 201 직후** `[InstantBooking] created bookingId=... - triggering provider push` 가 한 줄 찍힘.

2. **단계별 로그**  
   푸시 루틴은 다음 순서로 로그를 남김.  
   - `step 1: finding listings...` → `step 1 done: listings=N uniqueProviders=M`  
   - `step 2: loading providers...` → `step 2 done: userIds=N`  
   - `step 3: loading provider FCM tokens...` → `step 3 done: tokens=N`  
   - `step 4: sending FCM...` → `step 4 done: success=... failure=...`  
   중간에 **no service_listings** / **no user_id** / **no provider app device tokens** 로 끝나면 해당 단계에서 푸시 대상이 없는 것.

3. **DB 진단 스크립트**  
   특정 `service_category_id` 로 어디서 끊기는지 DB에서 확인:
   ```bash
   npm run script:diagnose-instant-push -- <service_category_id>
   ```
   예: `npm run script:diagnose-instant-push -- a98a4eb5-4b1e-4851-99c6-f92806ae5f61`  
   - Step 1: 해당 카테고리의 `service_listings` (is_active=true) 개수  
   - Step 2: 그 provider들의 `user_id` 개수  
   - Step 3: 그 user들의 `user_device_tokens` (app_mode=provider, is_active=true) 개수  
   Step 3에서 0이면 프로바이더가 **provider 앱**에서 FCM 토큰을 등록해야 푸시가 나감.

4. **예외 발생 시**  
   `[InstantBooking Push] Failed bookingId=...` 또는 `[InstantBooking Push] bookingId=... error` 로그에 스택이 남음.

---

## 6. 서버에서 하지 않는 것

- **Provider 매칭/추천**: 서버는 “이 예약에 어떤 provider를 보여줄지”를 계산하지 않음. 앱이 결정하고, 수락 시 `provider_id`/`item_id` 를 넘김.
- **상태 자동 변경**: `status` 를 PENDING 외에 서버가 자동으로 바꾸는 로직 없음. (필요 시 앱/다른 API에서 업데이트하거나, 추후 확장)

이 문서는 현재 서버 코드 기준으로 정리한 instant service booking 요청 처리 과정입니다.
