# Firebase 권한 확인 가이드

## 현재 오류
```
messaging/mismatched-credential - Permission 'cloudmessaging.messages.create' denied
```

이 오류는 서비스 계정에 FCM 메시지 전송 권한이 없다는 의미입니다.

## 확인 방법

### 1. Google Cloud Console에서 서비스 계정 역할 확인

**직접 링크:**
```
https://console.cloud.google.com/iam-admin/iam?project=gig-market-85c5e
```

**확인 사항:**
1. 서비스 계정: `firebase-adminsdk-fbsvc@gig-market-85c5e.iam.gserviceaccount.com` 찾기
2. "역할" 열에서 다음 중 하나가 있는지 확인:
   - ✅ `Firebase Admin SDK Administrator Service Agent` (가장 권장)
   - ✅ `Firebase Cloud Messaging API Admin` ← **cloudmessaging.messages.create** 권한 포함
   - ✅ `Editor` (더 넓은 권한)
   - ✅ `Firebase Cloud Messaging Admin`
   - ✅ `Service Account User` (필수)

### 2. 서비스 계정에 권한 추가하기

**방법 A: Firebase Console에서 (가장 쉬움)**
1. https://console.firebase.google.com/project/gig-market-85c5e/settings/serviceaccounts/adminsdk 접속
2. "새 비공개 키 생성" 클릭
3. 이렇게 하면 자동으로 올바른 권한이 설정됩니다

**방법 B: Google Cloud Console에서 수동 추가 (cloudmessaging.messages.create 부여)**
1. https://console.cloud.google.com/iam-admin/iam?project=gig-market-85c5e 접속
2. 서비스 계정 찾기: `firebase-adminsdk-fbsvc@gig-market-85c5e.iam.gserviceaccount.com`
3. "편집" (연필 아이콘) 클릭
4. "역할 추가" 클릭
5. 검색창에 **`Firebase Cloud Messaging API Admin`** 입력 후 선택 (이 역할에 `cloudmessaging.messages.create` 포함)
6. 또는 다음 역할 추가:
   - `Firebase Admin SDK Administrator Service Agent`
   - `Service Account User` (이미 있을 수 있음)
7. "저장" 클릭

### 3. 권한 전파 대기

권한을 추가한 후 **5-10분** 정도 기다려야 Google Cloud에서 권한이 전파됩니다.

### 4. 추가 확인 사항

#### Firebase 프로젝트에서 Cloud Messaging 활성화 확인
1. https://console.firebase.google.com/project/gig-market-85c5e/settings/general 접속
2. "Cloud Messaging" 섹션 확인
3. "Cloud Messaging API (V1)" 또는 "Cloud Messaging API (레거시)" 활성화 확인

#### 서비스 계정 상태 확인
1. https://console.cloud.google.com/iam-admin/serviceaccounts?project=gig-market-85c5e 접속
2. 서비스 계정 상태가 "활성"인지 확인
3. "비활성화됨"이면 "활성화" 클릭

## 문제 해결 체크리스트

- [ ] 서비스 계정에 `Firebase Admin SDK Administrator Service Agent` 역할이 있는가?
- [ ] 서비스 계정에 `Service Account User` 역할이 있는가?
- [ ] Firebase Cloud Messaging API가 활성화되어 있는가?
- [ ] 서비스 계정이 "활성" 상태인가?
- [ ] 권한 변경 후 5-10분 기다렸는가?

## 권한 추가 후 테스트

1. 서버 재시작: `pm2 restart gig-core`
2. 5-10분 대기
3. 테스트 실행: `npx ts-node scripts/send-sample-notification-to-all-devices.ts`

---

## iOS만 실패할 때: `messaging/third-party-auth-error` (APNs)

Android는 되고 **iOS에서만** 푸시 실패 시, FCM이 Apple APNs로 보낼 때 쓰는 **인증 정보가 Firebase에 없거나 잘못된 상태**입니다.

### 해결: Firebase에 APNs 인증 키 등록

1. **Apple Developer** → Keys → **Apple Push Notifications service (APNs)** 로 **.p8 키 생성** 후 다운로드 (한 번만 제공되므로 보관).
2. **Firebase Console** → 프로젝트 **gig-market-85c5e** → 프로젝트 설정(톱니바퀴) → **Cloud Messaging** 탭
3. **Apple app configuration** / **APNs Authentication Key** 에서 **.p8 업로드**, Key ID·Team ID·Bundle ID 입력 후 저장
4. **프로젝트 설정** → **일반** 탭에서 iOS 앱의 **번들 ID**가 실제 앱과 **완전히 동일**한지 확인

- 설정: https://console.firebase.google.com/project/gig-market-85c5e/settings/cloudmessaging
- 일반: https://console.firebase.google.com/project/gig-market-85c5e/settings/general
