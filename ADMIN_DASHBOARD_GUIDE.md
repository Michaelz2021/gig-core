# Gig-Core 관리자 대시보드 가이드

## 개요

Gig-Core 관리자 대시보드는 `/admin` 경로에서 접근할 수 있는 웹 기반 관리자 인터페이스입니다.

## 접근 방법

### 1. 로그인 페이지

**URL:** `http://localhost:3000/admin/index.html` 또는 `http://localhost:3000/admin/`

**기본 계정:**
- 이메일: `admin@example.com`
- 비밀번호: `Test1234!`

### 2. 대시보드

로그인 성공 후 자동으로 `/admin/dashboard.html`로 이동합니다.

## 기능

### 1. 대시보드 개요
- 총 사용자 수 (전체, 제공자, 소비자)
- 입찰 대기 중인 프로젝트 수
- 계약 완료된 프로젝트 수
- 진행 중인 프로젝트 수
- 완료된 프로젝트 수

### 2. 입찰 대기 프로젝트
- 입찰을 기다리는 프로젝트 목록
- 각 프로젝트의 상세 정보 (제목, 설명, 위치, 예산, 입찰 수 등)

### 3. 계약 완료 프로젝트
- 계약이 완료된 프로젝트 목록
- 고객 및 제공자 정보
- 계약 금액

### 4. 진행 중인 프로젝트
- 현재 진행 중인 프로젝트 목록
- 시작 일시
- 상태 정보

### 5. 완료된 프로젝트
- 완료된 프로젝트 목록
- 완료 일시
- 최종 금액

## 파일 구조

```
gig-core/
├── admin/
│   ├── index.html          # 로그인 페이지
│   ├── dashboard.html       # 대시보드 페이지
│   ├── css/
│   │   └── style.css        # 스타일시트
│   └── js/
│       ├── login.js         # 로그인 로직
│       └── dashboard.js     # 대시보드 로직
└── src/
    └── main.ts              # 정적 파일 서빙 설정
```

## API 엔드포인트

모든 관리자 API는 JWT 토큰이 필요합니다:

### 대시보드 통계
```
GET /api/v1/admin/dashboard
Authorization: Bearer {accessToken}
```

### 입찰 대기 프로젝트
```
GET /api/v1/admin/projects/pending-bids
Authorization: Bearer {accessToken}
```

### 계약된 프로젝트
```
GET /api/v1/admin/projects/contracted
Authorization: Bearer {accessToken}
```

### 진행 중인 프로젝트
```
GET /api/v1/admin/projects/in-progress
Authorization: Bearer {accessToken}
```

### 완료된 프로젝트
```
GET /api/v1/admin/projects/completed
Authorization: Bearer {accessToken}
```

## 설정

### 정적 파일 서빙

`src/main.ts`에서 정적 파일 서빙이 설정되어 있습니다:

```typescript
app.useStaticAssets(join(__dirname, '..', 'admin'), {
  prefix: '/admin',
});
```

이 설정으로 `/admin/*` 경로의 모든 파일이 `admin/` 폴더에서 제공됩니다.

## 개발 및 배포

### 로컬 개발

1. 백엔드 서버 실행:
   ```bash
   cd /var/www/gig-core
   npm run start:dev
   ```

2. 브라우저에서 접속:
   - `http://localhost:3000/admin/`

### 프로덕션 배포

관리자 대시보드는 백엔드 서버와 함께 배포됩니다. 별도의 프론트엔드 빌드 과정이 필요 없습니다.

## 보안

- 모든 관리자 API는 JWT 인증이 필요합니다
- `AdminGuard`가 관리자 권한을 확인합니다
- 로그인 토큰은 `localStorage`에 저장됩니다
- 토큰 만료 시 자동으로 로그인 페이지로 리다이렉트됩니다

## 문제 해결

### 로그인이 안 될 때

1. 관리자 계정이 존재하는지 확인:
   ```bash
   cd /var/www/gig-core
   npx ts-node scripts/create-admin-user.ts
   ```

2. 백엔드 서버가 실행 중인지 확인:
   ```bash
   cd /var/www/gig-core
   npm run start:dev
   ```

3. 브라우저 콘솔에서 에러 확인

### 정적 파일이 로드되지 않을 때

1. `admin/` 폴더가 `gig-core/` 루트에 있는지 확인
2. `src/main.ts`에서 정적 파일 서빙 설정 확인
3. 서버 재시작

---

**마지막 업데이트:** 2025-12-06

