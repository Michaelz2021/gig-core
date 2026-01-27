# Firebase Cloud Messaging API 활성화 확인 방법

## 프로젝트 정보
- **프로젝트 ID**: `gig-market-85c5e`
- **서비스 계정**: `firebase-adminsdk-fbsvc@gig-market-85c5e.iam.gserviceaccount.com`

## 확인 방법

### 1. Google Cloud Console (웹 브라우저)

#### 방법 A: API 라이브러리에서 확인
1. 다음 URL로 직접 이동:
   ```
   https://console.cloud.google.com/apis/library/fcm.googleapis.com?project=gig-market-85c5e
   ```

2. 또는 수동으로:
   - https://console.cloud.google.com 접속
   - 프로젝트 선택: `gig-market-85c5e`
   - 왼쪽 메뉴: "API 및 서비스" → "라이브러리"
   - 검색창에 "Firebase Cloud Messaging API" 또는 "fcm.googleapis.com" 입력
   - 결과에서 "Firebase Cloud Messaging API" 클릭
   - 상태 확인:
     - ✅ "사용 설정됨" → API가 활성화되어 있음
     - ⚠️ "사용 설정" 버튼이 보이면 → API가 비활성화되어 있음 (버튼 클릭하여 활성화)

#### 방법 B: API 대시보드에서 확인
1. 다음 URL로 이동:
   ```
   https://console.cloud.google.com/apis/dashboard?project=gig-market-85c5e
   ```

2. "사용 설정된 API" 목록에서 "Firebase Cloud Messaging API" 또는 "Cloud Messaging API" 확인
   - 목록에 있으면 → 활성화됨
   - 목록에 없으면 → 비활성화됨

### 2. Firebase Console에서 확인
1. https://console.firebase.google.com 접속
2. 프로젝트 `gig-market-85c5e` 선택
3. 왼쪽 메뉴: "프로젝트 설정" (톱니바퀴 아이콘)
4. "Cloud Messaging" 탭 확인
   - 여기서도 API 상태를 확인할 수 있습니다

### 3. gcloud CLI로 확인 (서버에 설치되어 있는 경우)

```bash
# API 활성화 여부 확인
gcloud services list --enabled --project=gig-market-85c5e | grep fcm

# 또는 특정 API 확인
gcloud services list --enabled --project=gig-market-85c5e --filter="name:fcm.googleapis.com"
```

### 4. API 활성화하기 (비활성화되어 있는 경우)

#### Google Cloud Console에서:
1. https://console.cloud.google.com/apis/library/fcm.googleapis.com?project=gig-market-85c5e 접속
2. "사용 설정" 버튼 클릭
3. 활성화 완료 대기 (몇 초 소요)

#### gcloud CLI로:
```bash
gcloud services enable fcm.googleapis.com --project=gig-market-85c5e
```

## 추가 확인 사항

### 서비스 계정 권한 확인
1. https://console.cloud.google.com/iam-admin/iam?project=gig-market-85c5e 접속
2. 서비스 계정 `firebase-adminsdk-fbsvc@gig-market-85c5e.iam.gserviceaccount.com` 찾기
3. 역할 확인:
   - `Firebase Admin SDK Administrator Service Agent` 또는
   - `Firebase Cloud Messaging Admin` 또는
   - `Editor` 역할이 있어야 함

### 문제 해결
만약 API가 활성화되어 있는데도 "third-party-auth-error"가 발생한다면:
1. 서비스 계정에 적절한 권한이 있는지 확인
2. Firebase 프로젝트에서 Cloud Messaging이 활성화되어 있는지 확인
3. 서비스 계정 키가 최신인지 확인 (만료되지 않았는지)
