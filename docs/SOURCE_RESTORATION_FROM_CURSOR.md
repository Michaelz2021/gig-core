# Cursor 기반 소스 복원 가이드

이 문서는 **Cursor 로컬 히스토리(Timeline)** 와 **채팅 기록(Agent transcripts)** 을 이용한 소스 복원 방법을 정리합니다.

---

## 1. Cursor / VS Code 파일 타임라인(로컬 히스토리)으로 복구

### 1.1 에디터에서 수동 복구

- **방법 A**: 왼쪽 Explorer에서 복구하고 싶은 파일 **우클릭** → **"Open Timeline"** 또는 **"Timeline"**
- **방법 B**: 하단 패널에서 **"Timeline"** 탭 선택

목록에 예전 버전이 있으면 해당 항목 선택 후 **Restore** 또는 **Compare**로 내용 확인·복구할 수 있습니다.  
한 번에 전체가 아니라 **파일 하나씩** 예전 버전을 확인하는 방식입니다.

### 1.2 서버에 저장된 History 경로

Cursor/VS Code 로컬 히스토리는 다음 경로에 저장됩니다.

- **경로**: `~/.cursor-server/data/User/History/`
- 각 하위 폴더는 **해시값**이며, 폴더 안의 `entries.json`에 **원본 파일 경로**(`resource`)와 **버전 목록**(`entries`)이 있습니다.
- 실제 내용은 같은 폴더 안의 `*.ts`, `*.json` 등 **entry id 파일**에 들어 있습니다.

### 1.3 History가 확인된 gig-core `src/` 파일 목록

아래 파일들은 이 환경에서 **로컬 히스토리 항목이 있는 것**으로 확인되었습니다.  
Explorer에서 해당 파일을 연 뒤 **Timeline**에서 이전 버전이 있는지 확인해 보세요.

```
src/app.module.ts
src/main.ts
src/common/filters/http-exception.filter.ts
src/common/guards/admin.guard.ts
src/common/guards/jwt-auth.guard.ts
src/common/utils/phone-validator.ts
src/modules/admin/admin.module.ts
src/modules/admin/admin.controller.ts
src/modules/admin/admin.service.ts
src/modules/auth/auth.controller.ts
src/modules/auth/auth.service.ts
src/modules/auth/auth.module.ts
src/modules/auth/dto/login.dto.ts
src/modules/auth/dto/verify-email.dto.ts
src/modules/auth/email.service.ts
src/modules/auth/sms.service.ts
src/modules/bookings/bookings.controller.ts
src/modules/bookings/bookings.service.ts
src/modules/bookings/bookings.module.ts
src/modules/notifications/notifications.controller.ts
src/modules/notifications/notifications.service.ts
src/modules/notifications/notifications.module.ts
src/modules/users/users.controller.ts
src/modules/users/users.service.ts
src/modules/users/users.module.ts
src/modules/users/entities/provider.entity.ts
... (그 외 다수 - 위 목록은 일부만 표기)
```

전체 목록은 터미널에서 다음으로 확인할 수 있습니다.

```bash
for f in ~/.cursor-server/data/User/History/*/entries.json; do
  p=$(grep -o '"resource":"[^"]*gig-core/src/[^"]*"' "$f" 2>/dev/null | head -1)
  [ -n "$p" ] && echo "$p" | sed 's/.*gig-core\/src\/\(.*\)".*/\1/'
done 2>/dev/null | sort -u
```

---

## 2. 채팅 기록(Agent transcripts)에서 파악된 “과거에 구현된 기능”

과거 Cursor 채팅 기록을 복기했을 때, 아래 기능들이 **구현된 것으로 언급**되어 있습니다.  
현재 코드베이스에는 **없거나 일부만** 있을 수 있으므로, 필요 시 해당 기능을 다시 요청하면 **재구현**할 수 있습니다.

| 구분 | 내용 | 비고 |
|------|------|------|
| **Provider Trust Scores** | P1~P6 점수, `provider_trust_scores` 테이블, Admin 재계산/마이그레이션 API | 엔티티·서비스·마이그레이션·Admin API |
| **Consumer-Provider 소셜** | Favorite / Like / Recommend, `consumer_provider_favorites`, `consumer_provider_reactions`, `provider_social_stats` MV | 새 모듈·컨트롤러·서비스·API |
| **FCM 알림 수정** | 경매 생성 시 provider 쪽 알림: `providerId` → `userId`로 전달 | matching.service |
| **FCM 알림 수정** | 출금 완료 시 provider 알림: `provider_id`(providers.id) → `userId` 조회 후 전달 | xendit-webhook.service, UsersService.getUserIdByProviderId |
| **비즈니스 알림 SMS** | `NotificationsService.send()` 시 `users.is_phone_verified === true`일 때만 SMS 발송 | SmsService.sendMessage, NotificationsService |
| **비밀번호 찾기 OTP** | `POST /auth/forgot-otp` (이메일/전화 OTP 발송·검증) | AuthController·AuthService·ForgotOtpDto |
| **Swagger Basic Auth** | `/api-docs` 접근 시 HTTP Basic 인증 (SWAGGER_USER, SWAGGER_PASSWORD) | main.ts |
| **Swagger vs 서버 API** | 실제 라우트 기준으로 Swagger 문서 동기화 | 여러 컨트롤러 |
| **로그인 시 device_tokens** | User 테이블 `device_tokens` 컬럼 제거 후 로그인 경로에서 해당 접근 제거 | user.entity, users.service, auth |

---

## 3. 이번에 적용한 코드 수정 (채팅 기록 반영)

- **ForgotOtpDto**  
  - 앱에서 `otp-type`(kebab-case)으로 보내도 인식하도록 **`@Transform`** 추가.  
  - `otpType`이 비어 있으면 `obj['otp-type']`을 사용합니다.  
  - 파일: `src/modules/auth/dto/forgot-otp.dto.ts`

`POST /api/v1/auth/forgot-otp` 라우트와 `AuthService.forgotOtp()`가 **아직 없다면**, 500 원인은 “라우트/핸들러 없음”일 수 있습니다.  
해당 엔드포인트와 서비스 메서드 추가가 필요하면 “비밀번호 찾기 OTP API 추가해줘”라고 요청하면 됩니다.

---

## 4. 채팅 ID 00752b6d 복구 요청 (최근 10일 작업 복구)

요청하신 **채팅 ID `00752b6d-2f41-4db9-a4a6-c61fa2ecfe9a`** 에 해당하는 트랜스크립트 파일은 이 환경의 `agent-transcripts` 폴더에 **없습니다**.  
대신 **다른 채팅 트랜스크립트**에서 구현된 내용을 기준으로 복구를 진행했습니다.

### 4.1 확인된 트랜스크립트 (gig-core)

| 파일 ID | 내용 요약 |
|--------|-----------|
| 23194542 | Provider 업로드 이미지: 표시용 `data.url`, 업로드용 `data.uploadUrl` 설명, S3 presigned PUT 시 **ACL: 'public-read'** 적용 |
| 589be382 | Service category 3개 선택: `serviceCategoryIds` (JSONB), RegisterDto/AuthService/User 엔티티, 마이그레이션 스크립트 |
| 3ee7ac3c | Xendit 결제: reference_id/customer/metadata에 booking_number, user email/phone, 타임아웃·로깅 등 |

### 4.2 이번 복구에서 적용한 항목

- **S3 이미지 공개 읽기**  
  - `src/modules/upload/s3.service.ts`의 **getPresignedPutUrl** 에 **ACL: 'public-read'** 추가.  
  - 앱에서 `data.url`로 업로드된 이미지를 표시할 수 있도록 했습니다. (버킷에서 퍼블릭 ACL 허용 필요.)

- **서비스 카테고리 마이그레이션 스크립트**  
  - `scripts/migrate-service-category-to-array.ts` 생성.  
  - `package.json`에 `script:migrate-service-category` 추가.  
  - (User 엔티티·RegisterDto·AuthService의 `serviceCategoryIds` 는 이미 코드베이스에 반영된 상태였습니다.)

### 4.3 이미 코드에 반영되어 있던 항목 (추가 수정 없음)

- **Service category 3개**: User.serviceCategoryIds, RegisterDto.serviceCategoryIds, AuthService 검증·저장
- **Xendit 결제**: reference_id=booking_number, customer=booking_number/email/phone, metadata.booking_id=booking_number, 터미널 로그

---

## 5. 요약

- **타임라인 복구**: 복구하고 싶은 **파일을 Cursor에서 열고** → **Timeline**에서 이전 버전 확인 후 Restore.
- **채팅 기록 복구**: 위 표에 있는 기능 중 필요한 것을 말씀해 주시면, **현재 서버 기준으로 다시 구현**해 드릴 수 있습니다.
- **자동 전체 복원**: Cursor에는 “특정 시각의 전체 프로젝트”를 한 번에 되돌리는 기능은 없고, Git 커밋(`git restore .` 또는 `git checkout <commit> -- .`)으로만 전체 트리를 복원할 수 있습니다.
