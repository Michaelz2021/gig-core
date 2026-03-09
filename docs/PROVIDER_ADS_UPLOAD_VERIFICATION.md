# Provider Ads 이미지/비디오 업로드 API 검증

이 문서는 Provider 광고용 이미지·비디오 S3 업로드 API 구현을 정리하고,  
**PROVIDER_ADS_UPLOAD_URL_API.md**(GigProvider 쪽 문서)와 대조할 때 확인할 항목을 정리한 것입니다.

---

## 1. 구현 요약

| 항목 | 이미지 | 비디오 |
|------|--------|--------|
| **메서드** | POST | POST |
| **경로** | `/api/v1/upload/provider-ad/image` | `/api/v1/upload/provider-ad/video` |
| **인증** | JWT Bearer (JwtAuthGuard) | 동일 |
| **Content-Type** | multipart/form-data | 동일 |
| **필드명** | `file` | `file` |
| **S3 prefix** | `portfolio/image/` | `portfolio/video/` |
| **S3 base URL** | `https://gigmarket.s3.ap-northeast-2.amazonaws.com/portfolio/image/` | `https://gigmarket.s3.ap-northeast-2.amazonaws.com/portfolio/video/` |
| **응답** | `{ "url": "https://..." }` | 동일 |

---

## 2. 허용 파일 타입

- **이미지**: JPEG, PNG, GIF, WebP  
  (MIME: image/jpeg, image/png, image/gif, image/webp)
- **비디오**: MP4, MOV, AVI, WebM  
  (MIME: video/mp4, video/quicktime, video/x-msvideo, video/webm)

---

## 3. 문서와 대조 시 확인할 것

1. **URL 경로**  
   문서의 path가 `upload/provider-ad/image`, `upload/provider-ad/video` 또는 동일 의미인지 (prefix `api/v1` 포함 여부는 프레임워크 규칙에 따름).

2. **요청 형식**  
   - method: POST  
   - body: multipart/form-data, 파일 필드명 `file`  
   - 헤더: `Authorization: Bearer <access_token>`

3. **응답 형식**  
   - 성공 시: `{ "url": "https://gigmarket.s3.ap-northeast-2.amazonaws.com/portfolio/image|video/..." }`  
   - 문서에 `url` 외 필드(fileName, key, size 등)가 있으면, 필요 시 동일하게 추가 가능.

4. **에러 응답**  
   - 파일 없음: 400 + "No file uploaded"  
   - 잘못된 타입: 400 + "Invalid image type..." / "Invalid video type..."  
   - 인증 실패: 401

5. **S3 저장 위치**  
   - 이미지: `portfolio/image/`  
   - 비디오: `portfolio/video/`  
   (문서에 다른 prefix가 있으면 환경 변수 또는 상수로 맞출 수 있음)

---

## 4. 구현 위치 (gig-core)

- **컨트롤러**: `src/modules/upload/upload.controller.ts`  
  - `POST provider-ad/image`  
  - `POST provider-ad/video`
- **서비스**: `src/modules/upload/upload.service.ts`  
  - `uploadProviderAdImage()`  
  - `uploadProviderAdVideo()`
- **S3**: `src/modules/upload/s3.service.ts`  
  - `uploadMulterFile(file, folderPath)` → public URL 반환

---

## 5. 환경 변수

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET=gigmarket`
- `AWS_REGION=ap-northeast-2`

문서에 다른 버킷/리전이 명시되어 있으면 `.env`와 S3 설정을 문서에 맞춰 조정하면 됩니다.
