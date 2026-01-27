# 관리자 로그인 가이드

## 관리자 계정 정보

**이메일:** `admin@example.com`  
**비밀번호:** `Test1234!`

---

## 관리자 로그인 방법

### 방법 1: 프론트엔드에서 로그인 (권장)

1. 프론트엔드 애플리케이션 실행:
   ```bash
   cd /var/www/frontend
   npm run dev
   ```

2. 브라우저에서 접속:
   - URL: `http://localhost:5173` (또는 Vite가 제공하는 포트)
   - 일반 로그인 화면이 표시됩니다

3. 관리자 로그인 화면으로 이동:
   - 로그인 화면 하단의 "Admin Access" 섹션에서 **"Go to Admin Login →"** 버튼 클릭
   - 또는 직접 관리자 로그인 화면으로 이동

4. 관리자 계정으로 로그인:
   - **이메일:** `admin@example.com`
   - **비밀번호:** `Test1234!`
   - 로그인 화면에 테스트 계정 정보가 표시됩니다

5. 로그인 성공 시 자동으로 관리자 대시보드로 이동합니다.

---

### 방법 2: API를 통한 직접 로그인

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Test1234!"
  }'
```

**응답 예시:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "email": "admin@example.com",
    "firstName": "Admin",
    "lastName": "User",
    "userType": "consumer"
  }
}
```

---

## 관리자 대시보드 기능

로그인 후 다음 정보를 확인할 수 있습니다:

### 1. Overview (개요)
- 총 프로젝트 수
- 입찰 대기 중인 프로젝트
- 계약된 프로젝트
- 진행 중인 프로젝트
- 완료된 프로젝트
- 최근 옥션 및 예약 목록

### 2. Pending Bids (입찰 대기)
- 입찰을 기다리는 프로젝트 목록
- 각 프로젝트의 상세 정보
- 입찰 수, 조회 수 등

### 3. Contracted (계약 완료)
- 계약이 완료된 프로젝트
- 고객 및 제공자 정보
- 계약 금액

### 4. In Progress (진행 중)
- 현재 진행 중인 프로젝트
- 시작 일시
- 상태 정보

### 5. Completed (완료)
- 완료된 프로젝트 목록
- 완료 일시
- 최종 금액

---

## 관리자 계정 생성/업데이트

관리자 계정이 없거나 비밀번호를 변경하려면:

```bash
cd /var/www/gig-core
npx ts-node scripts/create-admin-user.ts
```

이 스크립트는:
- 관리자 계정이 없으면 생성
- 이미 있으면 비밀번호를 `Test1234!`로 업데이트

---

## 관리자 API 엔드포인트

모든 관리자 API는 JWT 토큰이 필요합니다:

### 대시보드 통계
```bash
GET /api/v1/admin/dashboard
Authorization: Bearer {accessToken}
```

### 입찰 대기 프로젝트
```bash
GET /api/v1/admin/projects/pending-bids
Authorization: Bearer {accessToken}
```

### 계약된 프로젝트
```bash
GET /api/v1/admin/projects/contracted
Authorization: Bearer {accessToken}
```

### 진행 중인 프로젝트
```bash
GET /api/v1/admin/projects/in-progress
Authorization: Bearer {accessToken}
```

### 완료된 프로젝트
```bash
GET /api/v1/admin/projects/completed
Authorization: Bearer {accessToken}
```

---

## 문제 해결

### 로그인이 안 될 때

1. **관리자 계정이 존재하는지 확인:**
   ```bash
   cd /var/www/gig-core
   npx ts-node scripts/create-admin-user.ts
   ```

2. **백엔드 서버가 실행 중인지 확인:**
   ```bash
   cd /var/www/gig-core
   npm run start:dev
   ```

3. **프론트엔드 서버가 실행 중인지 확인:**
   ```bash
   cd /var/www/frontend
   npm run dev
   ```

4. **API URL 확인:**
   - 프론트엔드의 `.env` 파일에 `VITE_API_BASE_URL` 설정 확인
   - 기본값: `http://localhost:3000/api/v1`

### CORS 에러 발생 시

백엔드의 `main.ts`에서 CORS 설정 확인:
```typescript
app.enableCors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
});
```

---

## 보안 참고사항

⚠️ **프로덕션 환경에서는:**
1. 더 강력한 비밀번호 사용
2. 관리자 권한을 별도 필드로 관리 (`isAdmin` 필드 추가 권장)
3. 이메일 기반 인증 대신 역할 기반 접근 제어(RBAC) 구현
4. 2FA(2단계 인증) 활성화

---

**마지막 업데이트:** 2025-12-06

