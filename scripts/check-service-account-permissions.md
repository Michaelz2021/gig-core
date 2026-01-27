# 서비스 계정 권한 확인 및 수정 가이드

## 문제 상황
- Firebase Cloud Messaging API는 활성화되어 있음
- 하지만 "third-party-auth-error" 오류 발생
- 이는 보통 서비스 계정 권한 문제입니다

## 확인 방법

### 1. Google Cloud Console에서 서비스 계정 권한 확인

#### 직접 링크:
```
https://console.cloud.google.com/iam-admin/iam?project=gig-market-85c5e
```

#### 수동 방법:
1. https://console.cloud.google.com 접속
2. 프로젝트 `gig-market-85c5e` 선택
3. 왼쪽 메뉴: "IAM 및 관리자" → "IAM"
4. 서비스 계정 찾기: `firebase-adminsdk-fbsvc@gig-market-85c5e.iam.gserviceaccount.com`
5. 역할 확인:
   - ✅ **필요한 역할**: 
     - `Firebase Admin SDK Administrator Service Agent` (권장)
     - 또는 `Editor` (더 넓은 권한)
     - 또는 `Firebase Cloud Messaging Admin`

### 2. 서비스 계정에 권한 추가하기

#### 방법 A: Firebase Console에서
1. https://console.firebase.google.com/project/gig-market-85c5e/settings/serviceaccounts/adminsdk 접속
2. "새 비공개 키 생성" 클릭 (필요한 경우)
3. 서비스 계정이 자동으로 올바른 권한을 받습니다

#### 방법 B: Google Cloud Console에서 수동 추가
1. https://console.cloud.google.com/iam-admin/iam?project=gig-market-85c5e 접속
2. 서비스 계정 `firebase-adminsdk-fbsvc@gig-market-85c5e.iam.gserviceaccount.com` 찾기
3. "편집" (연필 아이콘) 클릭
4. "역할 추가" 클릭
5. 다음 역할 중 하나 선택:
   - `Firebase Admin SDK Administrator Service Agent`
   - 또는 `Editor`
6. "저장" 클릭

### 3. 서비스 계정 키 재생성 (최후의 수단)

만약 위 방법으로 해결되지 않으면:

1. https://console.firebase.google.com/project/gig-market-85c5e/settings/serviceaccounts/adminsdk 접속
2. "새 비공개 키 생성" 클릭
3. JSON 파일 다운로드
4. 서버의 `.env` 파일과 JSON 파일 업데이트

## 추가 확인 사항

### Firebase 프로젝트 설정 확인
1. https://console.firebase.google.com/project/gig-market-85c5e/settings/general 접속
2. "Cloud Messaging" 섹션 확인
3. "Cloud Messaging API (레거시)" 또는 "Cloud Messaging API (V1)" 활성화 확인

### 서비스 계정 상태 확인
서비스 계정이 비활성화되어 있지 않은지 확인:
1. https://console.cloud.google.com/iam-admin/serviceaccounts?project=gig-market-85c5e 접속
2. 서비스 계정 상태가 "활성"인지 확인

## 문제 해결 후 테스트

권한을 수정한 후:
1. 서버 재시작: `pm2 restart gig-core`
2. 스크립트 다시 실행: `npx ts-node scripts/send-sample-notification-to-all-devices.ts`

## 참고 링크
- Firebase 서비스 계정 설정: https://console.firebase.google.com/project/gig-market-85c5e/settings/serviceaccounts/adminsdk
- Google Cloud IAM: https://console.cloud.google.com/iam-admin/iam?project=gig-market-85c5e
- 서비스 계정 목록: https://console.cloud.google.com/iam-admin/serviceaccounts?project=gig-market-85c5e
