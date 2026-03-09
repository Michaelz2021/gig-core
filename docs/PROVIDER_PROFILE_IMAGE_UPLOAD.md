# Provider 테이블용 이미지 업로드 – API 선택 가이드

앱에서 Provider 테이블(포트폴리오 사진 등)에 넣을 이미지를 업로드하고, 받은 URL을 JSON에 넣는 방법을 정리했습니다.

---

## 현재 광고(Provider Ad) 이미지 업로드 방식

두 가지가 있습니다.

| 방식 | API | 흐름 | 특징 |
|------|-----|------|------|
| **1) 직접 업로드** | `POST /api/v1/upload/provider-ad/image` | 앱이 multipart로 파일 전송 → 서버가 S3 `portfolio/image/`에 업로드 → `{ url }` 반환 | 구현 단순, 서버가 파일 받음 |
| **2) Presigned URL** | `POST /api/v1/provider-ads/upload-url` | 앱이 JSON `{ filename, contentType }` 전송 → 서버가 `{ uploadUrl, url }` 반환 → 앱이 **uploadUrl**로 파일 PUT → **url**을 DB/API에 저장 | 서버 부하 적음, 대용량/모바일에 유리 |

저장 위치는 둘 다 S3 `portfolio/image/` (이미지), `portfolio/video/` (비디오) 이고, 반환되는 **url**을 그대로 provider_ads 또는 provider 테이블 JSON에 넣으면 됩니다.

---

## Provider 테이블에 이미지 URL 넣는 용도

- **portfolioPhotos**: `[{ url, caption, uploadedAt }]` → **이미지** URL 필요
- **certifications[].certificateUrl**: 자격증 파일 URL → 이미지 또는 PDF

즉, “광고용 이미지”와 “프로필 포트폴리오 이미지”는 **같은 종류의 이미지(JPEG/PNG 등)**이고, **같은 S3 prefix(`portfolio/image/`)**를 써도 무방합니다.

---

## 제안: 그대로 쓸지, 새 API를 둘지

### 옵션 A – **기존 API 그대로 사용 (권장)**

- **결론:** Provider 테이블용 이미지도 **광고 이미지 쓸 때와 동일한 API**를 쓰면 됩니다.
- **이유**
  - 저장 위치·파일 타입·응답 형식이 동일함.
  - 앱에서 “이미지 업로드 → url 받기” 흐름을 한 번만 구현하면 됨.
  - 유지보수·테스트가 단순함.

**절차 (직접 업로드 사용 시)**

1. `POST /api/v1/upload/provider-ad/image` 에 **multipart/form-data**로 이미지 전송.
2. 응답의 **url** 수신.
3. `POST /api/v1/users/providers_profile/:id` body의 **portfolioPhotos**에 해당 url 포함해서 전송.
   - 예: `"portfolioPhotos": [{ "url": "<받은 url>", "caption": "설명", "uploadedAt": "2026-02-14T00:00:00Z" }]`

**절차 (Presigned URL 사용 시)**

1. `POST /api/v1/provider-ads/upload-url` 에 **JSON** `{ "filename": "photo.jpg", "contentType": "image/jpeg" }` 전송.
2. 응답의 **uploadUrl**, **url** 수신.
3. **uploadUrl**로 이미지 파일 **PUT** 업로드.
4. **url**을 `POST /api/v1/users/providers_profile/:id` 의 **portfolioPhotos[].url** 등에 넣어서 전송.

---

### 옵션 B – **Provider 프로필 전용 업로드 API 추가**

- **언제 고려하면 좋은지**
  - “광고용”과 “프로필용”을 **문서/스펙에서 명확히 나누고 싶을 때**
  - 나중에 **프로필용만** 용량·해상도·허용 타입을 다르게 두고 싶을 때
- **구현:**  
  - 내부는 지금 `uploadProviderAdImage` / S3 `portfolio/image/` 와 **동일**하게 두고,
  - 경로/이름만 “provider profile용”으로 추가하는 방식이면 됨.  
  - 예: `POST /api/v1/upload/provider-profile/image` 또는 `POST /api/v1/users/providers_profile/upload-url`

---

## 정리

| 질문 | 답변 |
|------|------|
| 광고 이미지 보낼 때 쓰던 방식을 **그대로** 써도 되나요? | **예.** 같은 API·같은 절차로 업로드한 뒤 받은 **url**만 provider 테이블 JSON(예: portfolioPhotos)에 넣으면 됩니다. |
| 별도 API를 추가하는 게 나은가요? | **기능적으로는 필수는 아님.** 코드/앱 단순화를 위해 **옵션 A(기존 API 재사용)**를 권장하고, 의도 구분이나 정책 분리가 필요해지면 **옵션 B(프로필 전용 API)**를 추가하면 됩니다. |

원하시면 옵션 B용 엔드포인트 경로와 Swagger 설명문만 정해드릴 수 있습니다.
