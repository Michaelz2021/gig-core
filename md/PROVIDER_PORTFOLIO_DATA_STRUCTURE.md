# Provider 포트폴리오 데이터 구조

## 📋 테이블 정보

**테이블명:** `providers`  
**포트폴리오 컬럼:** `portfolio_photos` (JSONB 타입)

---

## ✅ 확인 결과

1. **테이블 존재:** ✅ `providers` 테이블이 데이터베이스에 존재합니다
2. **포트폴리오 컬럼 존재:** ✅ `portfolio_photos` 컬럼이 존재합니다
3. **데이터 타입:** JSONB (PostgreSQL JSON Binary 타입)
4. **Nullable:** YES (선택적 필드)

---

## 📊 데이터 구조

### TypeScript 엔티티 정의

```typescript
// src/modules/users/entities/provider.entity.ts

@Column({ type: 'jsonb', nullable: true })
portfolioPhotos: Array<{
  url: string;           // 이미지 URL
  caption: string;        // 사진 설명/캡션
  uploadedAt: string;     // 업로드 날짜 (ISO 8601 형식)
}>;
```

### JSON 데이터 형태

```json
[
  {
    "url": "https://example.com/portfolio/image1.jpg",
    "caption": "Kitchen renovation project",
    "uploadedAt": "2024-05-10T10:30:00Z"
  },
  {
    "url": "https://example.com/portfolio/image2.jpg",
    "caption": "Bathroom remodeling work",
    "uploadedAt": "2024-05-15T14:20:00Z"
  },
  {
    "url": "https://example.com/portfolio/image3.jpg",
    "caption": "Living room design",
    "uploadedAt": "2024-05-20T09:15:00Z"
  }
]
```

---

## 📝 필드 상세 설명

### `url` (string, 필수)
- **설명:** 포트폴리오 이미지의 URL
- **형식:** HTTP/HTTPS URL
- **예시:** `"https://storage.example.com/portfolio/abc123.jpg"`

### `caption` (string, 필수)
- **설명:** 포트폴리오 사진에 대한 설명 또는 제목
- **용도:** 작업 내용, 프로젝트 설명 등
- **예시:** `"Kitchen renovation project"`, `"전기 공사 작업"`

### `uploadedAt` (string, 필수)
- **설명:** 이미지 업로드 날짜 및 시간
- **형식:** ISO 8601 형식 (예: `"2024-05-10T10:30:00Z"`)
- **예시:** `"2024-05-10T10:30:00Z"`, `"2024-12-13T04:15:44.619Z"`

---

## 🔍 데이터베이스 스키마

```sql
-- providers 테이블의 portfolio_photos 컬럼
portfolio_photos JSONB NULL

-- 예시 데이터
UPDATE providers 
SET portfolio_photos = '[
  {
    "url": "https://example.com/img1.jpg",
    "caption": "Project 1",
    "uploadedAt": "2024-05-10T10:30:00Z"
  },
  {
    "url": "https://example.com/img2.jpg",
    "caption": "Project 2",
    "uploadedAt": "2024-05-15T14:20:00Z"
  }
]'::jsonb
WHERE user_id = 'a98a4eb5-4b1e-4851-99c6-f92806ae5f61';
```

---

## 💡 사용 예시

### 1. 포트폴리오 데이터 읽기

```typescript
const provider = await providerRepository.findOne({
  where: { userId: user.id },
});

if (provider && provider.portfolioPhotos) {
  provider.portfolioPhotos.forEach((photo) => {
    console.log(`이미지: ${photo.url}`);
    console.log(`설명: ${photo.caption}`);
    console.log(`업로드일: ${photo.uploadedAt}`);
  });
}
```

### 2. 포트폴리오 데이터 추가

```typescript
const newPhoto = {
  url: "https://example.com/new-image.jpg",
  caption: "New project",
  uploadedAt: new Date().toISOString(),
};

provider.portfolioPhotos = provider.portfolioPhotos || [];
provider.portfolioPhotos.push(newPhoto);
await providerRepository.save(provider);
```

### 3. 포트폴리오 데이터 업데이트

```typescript
provider.portfolioPhotos = [
  {
    url: "https://example.com/img1.jpg",
    caption: "Updated caption",
    uploadedAt: "2024-05-10T10:30:00Z",
  },
  {
    url: "https://example.com/img2.jpg",
    caption: "New project",
    uploadedAt: new Date().toISOString(),
  },
];

await providerRepository.save(provider);
```

---

## 📋 현재 상태

**provider@example.com 사용자:**
- ✅ Provider 레코드 존재
- ⚠️  포트폴리오 데이터 없음 (`portfolio_photos` = `null`)

---

## 🎯 권장사항

1. **최소 3장 권장:** 엔티티 주석에 "최소 3장"이라고 명시되어 있음
2. **이미지 URL 검증:** 업로드 전 URL 유효성 검사 권장
3. **캡션 필수:** 각 이미지에 대한 설명 제공 권장
4. **날짜 형식:** ISO 8601 형식 사용 권장

---

## 📚 관련 파일

- **엔티티:** `/var/www/gig-core/src/modules/users/entities/provider.entity.ts`
- **서비스:** `/var/www/gig-core/src/modules/users/users.service.ts`
- **스키마 문서:** `/var/www/gig-core/md/02_Database_Schema.md`
