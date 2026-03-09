# Quick Order Now 화면 — Order 실행 절차 (상세)

Quick Order Now 화면에는 **Order**가 두 가지 의미로 사용됩니다.

1. **1단계 Order** — 날짜/시간/장소 입력 후 **폼 하단의 "Order" 버튼** (인스턴트 예약 요청 생성)
2. **2단계 Order** — 응답한 프로바이더 카드마다 있는 **"Order" 버튼** (해당 프로바이더로 결제 화면 이동)

아래는 각각의 **단계별 실행 절차**입니다.

---

## 1단계: 폼에서 Order 버튼을 누를 때

**위치**: 서비스 선택 → 날짜/시간 선택 → 위치 입력 후, 화면 하단의 **Order** 버튼  
**핸들러**: `_submitOrder()`

### 1-1. 유효성 검사 (순서대로)

| 순서 | 검사 항목 | 실패 시 동작 |
|------|-----------|--------------|
| 1 | `_selectedDate`, `_selectedTime` 존재 | SnackBar: "Please select date and time." |
| 2 | `_locationController.text` (주소) 비어 있지 않음 | SnackBar: "Please enter or select a location." |
| 3 | `_selectedIndex` 유효 (서비스 카테고리 선택됨) | SnackBar: "Please select a service category." |
| 4 | `AuthState().getUserId()` 로그인 여부 | SnackBar: "Please log in to place an order." |

하나라도 실패하면 여기서 종료되고 API 호출은 하지 않음.

### 1-2. 요청 데이터 구성

- **서비스 카테고리**: `_instantServices[_selectedIndex!].id` (instant_service_list API의 서비스 id)
- **시간**: `_selectedDate` + `_selectedTime` → UTC ISO8601 문자열 (`timeSlot`)
- **위치**: `address`(텍스트), `lat`/`lng` (`_locationLat`, `_locationLng`, 없으면 0.0)

### 1-3. API 호출

- **메서드**: `InstantBookingsRemoteDataSource.createInstantBooking(...)`
- **HTTP**: `POST /api/v1/instant-bookings`
- **Body** (요약):
  - `user_id`: 로그인 사용자 ID
  - `service_category`: 선택한 서비스 id
  - `time_slot`: 위에서 만든 ISO8601 문자열
  - `location`: `{ address, lat, lng }`
  - `price_range`: `{ min: 50, max: 150 }` (현재 고정)

### 1-4. 성공 시 후속 처리

1. **로딩 해제**: `_isSubmittingOrder = false`
2. **다이얼로그**: "Order submitted" + Booking ID, Status, Created at
3. **카운트다운·폴링 시작**: `_startOrderCountdown(bookingId, orderAddress: address)` 호출

### 1-5. 실패 시

- `_isSubmittingOrder = false`
- SnackBar에 예외 메시지 표시

---

## 2단계: _startOrderCountdown(bookingId, orderAddress) — 카운트다운·폴링

**호출 시점**: 1단계 Order 성공 후

### 2-1. 정리 및 상태 설정

- 기존 타이머·폴링 전부 취소:
  - `_orderCountdownTimer`
  - `_instantBookingPollTimer`
- 저장:
  - `_lastBookingId = bookingId`
  - `_lastOrderAddress = orderAddress` (있을 때)
- 리셋:
  - `_instantBookingItems = []`
  - `_respondingCardSelections.clear()`

### 2-2. 카운트다운 타이머 (10분)

- `_orderCountdownSeconds = 600` (10분)
- 모래시계 애니메이션 시작 (`_hourglassController.repeat()`)
- **1초마다** `_orderCountdownSeconds` 1 감소
- 0이 되면:
  - 카운트다운·폴링 타이머 정지
  - **카드 목록은 그대로 유지** (리셋은 홈 이동 또는 새 Order 요청 시에만)

### 2-3. 폴링 시작

- **즉시 1회**: `_pollInstantBookingOnce()` 호출
- **이후 5초마다**: `_orderCountdownSeconds != null` 인 동안 `_pollInstantBookingOnce()` 반복 호출

---

## 3단계: _pollInstantBookingOnce() — 응답 프로바이더 목록 갱신

**호출**: 2단계에서 즉시 1회 + 5초 간격

### 3-1. API 호출

- **메서드**: `InstantBookingsRemoteDataSource.getInstantBooking(id)`
- **HTTP**: `GET /api/v1/instant-bookings/:id` (`id` = `_lastBookingId`)

### 3-2. 응답 처리

- 응답에서 `ackItemList` 또는 `items` 리스트 추출
- 리스트가 없거나 비면 아무것도 하지 않음

### 3-3. 카드용 데이터 구성 (ack 항목별)

각 ack 항목에 대해:

1. `itemid` 또는 `item_id`로 listing ID 확보
2. **GET /api/v1/listings/:id** 호출 (`ListingsRemoteDataSource.getListingById`)
3. listing 결과에 ack의 `provider_response`, `provider_response_at` 병합
4. 이 맵을 `_instantBookingItems`에 넣을 목록에 추가  
   (listing 조회 실패 시에는 ack 정보만으로 항목 추가)

### 3-4. UI 갱신

- `mounted && _orderCountdownSeconds != null` 이면  
  `setState(() => _instantBookingItems = listingMaps)` 로 **Responding providers** 카드 목록 갱신

---

## 4단계: 카드의 Order 버튼을 누를 때 (결제로 이동)

**위치**: "Responding providers" 섹션의 각 프로바이더 카드 하단 **Order** 버튼  
**핸들러**: `onOrderPressed` (해당 카드의 item, index가 클로저로 묶여 있음)

### 4-1. 타이머·폴링 중지

- `_stopInstantBookingTimers()` 호출:
  - `_orderCountdownTimer` 취소
  - `_instantBookingPollTimer` 취소
  - 모래시계 정지·리셋
  - `_orderCountdownSeconds = null`

### 4-2. 인보이스 breakdown 계산

- `_getInvoiceBreakdown(item, index)` 호출
- 반환값: `base_price`, `addons_total`, `person_fee`, `travel_fee`, `total_price`, `price_type`, `variant_option`, `addon_names`, `qty`

### 4-3. 결제 화면으로 넘길 데이터 수집

- **bookingId**: `_lastBookingId ?? listingId ?? ''`
- **providerName**: `item['provider']` 또는 `item['provider_name']` 등에서 추출
- **consumerName**: `SharedPreferences`의 `cached_user`에서 name/display_name/email 추출 (실패 시 "Consumer")
- **serviceDate**: `_selectedDate` → `YYYY-MM-DD`
- **serviceTime**: `_selectedTime` → `HH:mm:00`
- **serviceAddress**: `_lastOrderAddress`
- 위 breakdown 필드 전부

### 4-4. 화면 전환

- **라우트**: `context.push('/payment', extra: { ... })`
- **extra**에 들어가는 키 (요약):  
  `id`, `bookingNumber`, `totalAmount`, `amount`, `consumerName`, `providerName`, `serviceDate`, `serviceTime`, `serviceAddress`, `price_type`, `variant_option`, `addon_names`, `qty`, `base_price`, `addons_total`, `person_fee`, `travel_fee`, `total_price`

### 4-5. Payment 화면에서의 동작

- **PaymentScreen**은 `extra`를 `booking`으로 받아 인보이스 영역에 표시
- 진입 시 `_loadSession()` → `POST /payment/contracts/:bookingId/initialize` 호출 (결제 세션 초기화)
- 세션 성공 시: 결제 수단 목록 표시 + 하단 **Payment** 버튼으로 실제 결제 플로우 진행

---

## 흐름 요약 다이어그램

```
[Quick Order Now 화면]

  (1) 서비스 선택 → (2) 날짜/시간 → (3) 위치 입력
           ↓
  [Order] 버튼 클릭
           ↓
  _submitOrder(): 검증 → POST /instant-bookings
           ↓
  _startOrderCountdown(): 10분 타이머 + 5초마다 GET /instant-bookings/:id
           ↓
  _pollInstantBookingOnce(): ackItemList → 각 itemid로 GET /listings/:id → _instantBookingItems 갱신
           ↓
  [Responding providers] 카드 목록 표시 (옵션/애드온 선택 가능)
           ↓
  카드의 [Order] 버튼 클릭
           ↓
  _stopInstantBookingTimers() + _getInvoiceBreakdown() + context.push('/payment', extra: {...})
           ↓
  [Payment 화면]: 인보이스 표시 → 결제 수단 선택 → Payment 버튼으로 결제
```

---

## 관련 파일

| 역할 | 파일 |
|------|------|
| 화면·Order 버튼·타이머·폴링 | `lib/features/home/presentation/screens/quick_order_now_screen.dart` |
| POST/GET instant-bookings | `lib/features/home/data/datasources/instant_bookings_remote_datasource.dart` |
| GET listings/:id | `lib/features/home/data/datasources/listings_remote_datasource.dart` |
| 결제 화면 | `lib/features/home/presentation/screens/payment_screen.dart` |
| 결제 세션 초기화 | `lib/features/home/data/datasources/project_remote_datasource.dart` (`initializePayment`) |

이 문서는 Quick Order Now 화면에서 Order를 누를 때 **단계적으로 실행되는 절차**를 코드 기준으로 정리한 것입니다.
