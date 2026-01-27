# 관리자 대시보드 글로벌 IP 접근 문제 해결

## 문제
글로벌 IP(`http://43.201.114.64:3000/admin`)에서 관리자 로그인 페이지가 표시되지 않는 문제

## 해결 방법

### 1. 서버 재시작 필요
코드 변경 후 서버를 재시작해야 합니다:

```bash
cd /var/www/gig-core

# PM2를 사용하는 경우
pm2 restart gig-core

# 또는 직접 실행하는 경우
npm run start:dev
```

### 2. 변경 사항

#### main.ts 수정
- 정적 파일 서빙을 `global prefix` 설정 **전에** 배치
- `/admin` 루트 경로에서 `index.html` 자동 로드
- Express 정적 파일 미들웨어 사용

#### JavaScript 파일 수정
- `login.js`와 `dashboard.js`의 API_BASE_URL을 동적으로 설정
- `window.location.origin`을 사용하여 현재 호스트 기반으로 API URL 생성

### 3. 접근 방법

#### 로컬
- `http://localhost:3000/admin`
- `http://localhost:3000/admin/index.html`

#### 글로벌 IP
- `http://43.201.114.64:3000/admin`
- `http://43.201.114.64:3000/admin/index.html`

### 4. 확인 사항

1. **서버 실행 상태 확인**
   ```bash
   lsof -ti:3000
   # 또는
   pm2 list
   ```

2. **파일 존재 확인**
   ```bash
   ls -la /var/www/gig-core/admin/
   ```

3. **브라우저 콘솔 확인**
   - F12를 눌러 개발자 도구 열기
   - Console 탭에서 에러 메시지 확인
   - Network 탭에서 파일 로드 상태 확인

4. **직접 파일 접근 테스트**
   ```bash
   curl http://43.201.114.64:3000/admin/index.html
   curl http://43.201.114.64:3000/admin/css/style.css
   ```

### 5. 방화벽 설정

EC2 인스턴스의 보안 그룹에서 포트 3000이 열려있는지 확인:
- 인바운드 규칙에 포트 3000 (TCP) 추가
- 소스: 0.0.0.0/0 (모든 IP 허용) 또는 특정 IP

### 6. 문제 해결 체크리스트

- [ ] 서버가 실행 중인가?
- [ ] 포트 3000이 열려있는가?
- [ ] `/var/www/gig-core/admin/` 폴더에 파일이 있는가?
- [ ] 브라우저 콘솔에 에러가 있는가?
- [ ] API 요청이 올바른 URL로 가는가?

### 7. 추가 디버깅

서버 로그 확인:
```bash
# PM2 로그
pm2 logs gig-core

# 또는 직접 실행 시 터미널 출력 확인
```

---

**마지막 업데이트:** 2025-12-06

