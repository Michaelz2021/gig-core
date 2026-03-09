# Consumer–Provider Social API (Favorite / Like / Recommend)

앱에서 **1️⃣ Favorite Provider**, **2️⃣ I Like Him**, **3️⃣ Recommend Provider** 기능 연동 시 참고용 문서입니다.

---

## 전제

- **providerId**: 모든 API에서 `providers.id` (UUID)를 사용합니다. DB의 `consumer_provider_favorites` / `consumer_provider_reactions`는 내부적으로 provider의 `users.id`로 저장합니다.
- **인증**: 모든 엔드포인트 JWT 필요 (`Authorization: Bearer <token>`). `consumerId`는 JWT의 `user.id`로 처리됩니다.

---

## 1️⃣ Favorite Provider

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/v1/consumer-provider/favorites` | 찜 추가 |
| DELETE | `/api/v1/consumer-provider/favorites/:providerId` | 찜 해제 |
| GET | `/api/v1/consumer-provider/favorites` | 내 찜 목록 |
| GET | `/api/v1/consumer-provider/favorites/check/:providerId` | 해당 provider 찜 여부 |

**POST body (찜 추가)**  
```json
{ "providerId": "uuid-of-providers.id" }
```

**응답 예시 (목록)**  
```json
{
  "items": [
    { "id": "...", "providerId": "uuid-providers-id", "createdAt": "..." }
  ],
  "total": 1
}
```

**check 응답**  
```json
{ "isFavorite": true }
```

---

## 2️⃣ I Like Him (Like)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/v1/consumer-provider/reactions/like` | 좋아요 추가 |
| DELETE | `/api/v1/consumer-provider/reactions/like/:providerId` | 좋아요 해제 |
| GET | `/api/v1/consumer-provider/reactions/like` | 내 좋아요 목록 |

**POST body**  
```json
{ "providerId": "uuid-of-providers.id" }
```

---

## 3️⃣ Recommend Provider

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/v1/consumer-provider/reactions/recommend` | 추천 추가 (한마디·공개 여부 선택) |
| DELETE | `/api/v1/consumer-provider/reactions/recommend/:providerId` | 추천 해제 |
| GET | `/api/v1/consumer-provider/reactions/recommend` | 내 추천 목록 |

**POST body**  
```json
{
  "providerId": "uuid-of-providers.id",
  "note": "optional one-line recommendation",
  "bookingId": "optional-completed-booking-uuid",
  "isPublic": true
}
```

---

## 집계 / 내 상태

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/v1/consumer-provider/stats/:providerId` | 해당 provider의 favorite/like/recommend 집계 |
| GET | `/api/v1/consumer-provider/me/state/:providerId` | 현재 사용자의 해당 provider에 대한 찜·좋아요·추천 여부 |

**stats 응답**  
```json
{
  "favoriteCount": 10,
  "likeCount": 5,
  "recommendCount": 3
}
```

**me/state 응답**  
```json
{
  "isFavorite": false,
  "isLike": true,
  "isRecommend": false
}
```

---

## 에러 / 중복

- **409 Conflict**: 이미 찜/좋아요/추천한 상태에서 다시 추가 요청 시.
- **404 Not Found**: 존재하지 않는 `providerId` (providers.id)로 요청 시.

---

## DB / Materialized View

집계는 `provider_social_stats` materialized view를 참조할 수 있습니다. 최신 집계가 필요하면 주기적으로 또는 이벤트 후 다음 실행:

```sql
REFRESH MATERIALIZED VIEW provider_social_stats;
```

현재 서비스는 MV 대신 실시간 COUNT 쿼리로 집계할 수 있습니다. 구현은 `ConsumerProviderService.getStats()`를 확인하세요.
