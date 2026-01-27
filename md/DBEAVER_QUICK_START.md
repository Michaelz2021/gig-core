# DBeaver 빠른 시작 가이드 (Mac)

## 1단계: DBeaver 설치

```bash
# Homebrew로 설치 (가장 간단)
brew install --cask dbeaver-community
```

또는 [공식 웹사이트](https://dbeaver.io/download/)에서 다운로드

## 2단계: 서버 연결 정보 확인

서버에서 다음 스크립트를 실행하여 연결 정보를 확인하세요:

```bash
cd /var/www/gig-core
./scripts/check-postgres-connection.sh
```

## 3단계: DBeaver에서 연결

### SSH 터널 사용 (권장)

1. DBeaver 실행
2. **Database** → **New Database Connection** → **PostgreSQL** 선택
3. **SSH 탭**:
   - ✅ **Use SSH Tunnel** 체크
   - **Host**: `172.31.44.14` (또는 서버 IP)
   - **Port**: `22`
   - **User Name**: SSH 사용자명 (예: `ubuntu`, `ec2-user`)
   - **Authentication**: **Public Key** 선택
   - **Key Path**: Mac의 SSH 키 파일 선택 (예: `~/.ssh/id_rsa` 또는 `~/.ssh/your-key.pem`)

4. **Main 탭**:
   - **Host**: `localhost`
   - **Port**: `5432`
   - **Database**: `ai_trusttrade`
   - **Username**: `trusttrade`
   - **Password**: `secure_password_123`

5. **Test Connection** 클릭 → 성공 시 **Finish**

### 직접 연결 (포트가 열려있는 경우)

1. DBeaver 실행
2. **Database** → **New Database Connection** → **PostgreSQL** 선택
3. **Main 탭**:
   - **Host**: `172.31.44.14` (또는 서버 IP)
   - **Port**: `5432`
   - **Database**: `ai_trusttrade`
   - **Username**: `trusttrade`
   - **Password**: `secure_password_123`

4. **Test Connection** 클릭 → 성공 시 **Finish**

## 4단계: 연결 테스트

1. 생성한 연결을 더블클릭하여 연결
2. 왼쪽 탐색기에서 **Schemas** → **public** → **Tables** 확인
3. 테이블을 우클릭하여 **View Data** 선택

## 문제 해결

- 연결 실패 시: `md/DBEAVER_SETUP_GUIDE.md`의 "문제 해결" 섹션 참조
- 서버 상태 확인: `./scripts/check-postgres-connection.sh` 실행

## 현재 서버 정보

- **서버 IP**: 172.31.44.14
- **데이터베이스**: ai_trusttrade
- **사용자명**: trusttrade
- **비밀번호**: secure_password_123

