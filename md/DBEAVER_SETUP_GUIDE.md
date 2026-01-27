# DBeaver 설치 및 PostgreSQL 연결 가이드 (Mac)

이 가이드는 Mac에서 DBeaver를 설치하고 원격 Linux 서버의 PostgreSQL 데이터베이스에 연결하는 방법을 설명합니다.

## 목차
1. [DBeaver 설치](#1-dbeaver-설치)
2. [서버 접근 설정 확인](#2-서버-접근-설정-확인)
3. [DBeaver에서 PostgreSQL 연결](#3-dbeaver에서-postgresql-연결)
4. [연결 테스트](#4-연결-테스트)
5. [문제 해결](#5-문제-해결)

---

## 1. DBeaver 설치

### 방법 1: Homebrew 사용 (권장)

```bash
# Homebrew가 설치되어 있지 않은 경우
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# DBeaver 설치
brew install --cask dbeaver-community
```

### 방법 2: 공식 웹사이트에서 다운로드

1. [DBeaver 공식 웹사이트](https://dbeaver.io/download/) 방문
2. "Mac (Universal)" 버전 다운로드
3. 다운로드한 `.dmg` 파일을 열고 DBeaver를 Applications 폴더로 드래그
4. Applications 폴더에서 DBeaver 실행

### 방법 3: Mac App Store

Mac App Store에서 "DBeaver Community Edition" 검색 후 설치

---

## 2. 서버 접근 설정 확인

Mac에서 원격 Linux 서버의 PostgreSQL에 연결하려면 다음 사항을 확인해야 합니다:

### 2.1 서버 정보 확인

현재 프로젝트의 PostgreSQL 설정:
- **호스트**: 서버 IP 주소 또는 도메인
- **포트**: 5432
- **사용자명**: trusttrade
- **비밀번호**: secure_password_123
- **데이터베이스**: ai_trusttrade

### 2.2 네트워크 접근 확인

#### SSH 터널링 사용 (권장 - 보안)

원격 서버에 직접 PostgreSQL 포트를 열지 않고 SSH 터널을 통해 연결하는 것이 보안상 안전합니다.

#### 포트 포워딩 확인

서버에서 PostgreSQL이 외부 접근을 허용하는지 확인:

```bash
# 서버에서 실행
sudo netstat -tlnp | grep 5432
# 또는
sudo ss -tlnp | grep 5432
```

### 2.3 방화벽 설정 확인

서버의 방화벽에서 PostgreSQL 포트(5432)가 열려있는지 확인:

```bash
# Ubuntu/Debian
sudo ufw status
sudo ufw allow 5432/tcp

# CentOS/RHEL
sudo firewall-cmd --list-ports
sudo firewall-cmd --permanent --add-port=5432/tcp
sudo firewall-cmd --reload
```

**주의**: 프로덕션 환경에서는 직접 포트를 열지 않고 SSH 터널을 사용하는 것을 강력히 권장합니다.

---

## 3. DBeaver에서 PostgreSQL 연결

### 3.1 새 데이터베이스 연결 생성

1. DBeaver 실행
2. 상단 메뉴에서 **Database** → **New Database Connection** 클릭
   - 또는 왼쪽 상단의 **새 연결** 아이콘 클릭
3. 데이터베이스 목록에서 **PostgreSQL** 선택
4. **Next** 클릭

### 3.2 연결 정보 입력

#### 방법 A: 직접 연결 (포트가 열려있는 경우)

**Main 탭:**
- **Host**: 서버 IP 주소 또는 도메인 (예: `your-server-ip` 또는 `your-domain.com`)
- **Port**: `5432`
- **Database**: `ai_trusttrade`
- **Username**: `trusttrade`
- **Password**: `secure_password_123`
- **Show all databases**: 체크 (선택사항)

**SSH 탭 (SSH 터널 사용 시):**
- **Use SSH Tunnel**: 체크
- **Host**: 서버 IP 주소 또는 도메인
- **Port**: `22` (SSH 기본 포트)
- **User Name**: SSH 사용자명 (예: `ubuntu`, `ec2-user`)
- **Authentication**: 
  - **Password**: SSH 비밀번호 (있는 경우)
  - 또는 **Public Key**: SSH 키 파일 경로 선택

#### 방법 B: SSH 터널 사용 (권장)

**SSH 탭:**
1. **Use SSH Tunnel** 체크
2. **Host**: 서버 IP 주소
3. **Port**: `22`
4. **User Name**: SSH 사용자명
5. **Authentication Method**:
   - **Public Key** 선택 (권장)
   - **Key Path**: Mac의 SSH 키 파일 경로 선택 (예: `~/.ssh/id_rsa` 또는 `~/.ssh/your-key.pem`)
   - **Passphrase**: 키에 passphrase가 설정되어 있다면 입력

**Main 탭:**
- **Host**: `localhost` (SSH 터널을 통해 연결하므로)
- **Port**: `5432`
- **Database**: `ai_trusttrade`
- **Username**: `trusttrade`
- **Password**: `secure_password_123`

### 3.3 드라이버 다운로드

처음 연결 시 PostgreSQL 드라이버가 자동으로 다운로드됩니다:
1. **Download** 버튼 클릭
2. 다운로드 완료 후 **Test Connection** 클릭
3. 연결 성공 메시지 확인

### 3.4 연결 저장

1. **Test Connection** 성공 후 **Finish** 클릭
2. 연결 이름 지정 (예: "Gig-Core PostgreSQL")
3. 연결이 왼쪽 데이터베이스 탐색기에 표시됨

---

## 4. 연결 테스트

### 4.1 DBeaver에서 테스트

1. 생성한 연결을 더블클릭하여 연결
2. 왼쪽 탐색기에서 데이터베이스 확장
3. **Schemas** → **public** → **Tables** 확인
4. 테이블을 우클릭하여 **View Data** 선택하여 데이터 확인

### 4.2 SQL 쿼리 실행

1. 상단 메뉴에서 **SQL Editor** → **New SQL Script** 선택
2. 또는 연결을 우클릭하고 **SQL Editor** → **New SQL Script** 선택
3. SQL 쿼리 작성:

```sql
-- 데이터베이스 버전 확인
SELECT version();

-- 테이블 목록 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- 연결 정보 확인
SELECT current_database(), current_user;
```

4. **Execute SQL Script** 버튼 (▶) 클릭하여 실행

---

## 5. 문제 해결

### 5.1 연결 실패: "Connection refused"

**원인**: PostgreSQL이 외부 접근을 허용하지 않거나 방화벽이 차단

**해결 방법**:
1. SSH 터널 사용 (권장)
2. 또는 서버에서 `postgresql.conf` 수정:
   ```bash
   # 서버에서 실행
   sudo nano /etc/postgresql/15/main/postgresql.conf
   # 또는 Docker 사용 시
   docker-compose exec postgres cat /var/lib/postgresql/data/postgresql.conf
   ```
   `listen_addresses = '*'` 설정 확인

3. `pg_hba.conf` 수정:
   ```bash
   sudo nano /etc/postgresql/15/main/pg_hba.conf
   ```
   다음 줄 추가:
   ```
   host    all    all    0.0.0.0/0    md5
   ```

### 5.2 연결 실패: "Authentication failed"

**원인**: 사용자명 또는 비밀번호 오류

**해결 방법**:
1. 연결 정보 재확인
2. 서버에서 사용자 확인:
   ```bash
   docker-compose exec postgres psql -U postgres -c "\du"
   ```

### 5.3 SSH 터널 연결 실패

**원인**: SSH 키 권한, 설정 문제, 또는 AWS 보안 그룹 설정

**해결 방법**:

1. **AWS 보안 그룹 확인 (가장 중요)**:
   - AWS 콘솔 → EC2 → 보안 그룹 → 인바운드 규칙
   - 포트 22 (SSH)가 Mac의 IP 주소에서 허용되어 있는지 확인
   - Mac의 공인 IP 확인: `curl ifconfig.me`

2. **Mac 터미널에서 SSH 연결 직접 테스트**:
   ```bash
   # SSH 키 파일 권한 확인 및 설정
   chmod 600 ~/.ssh/your-key.pem
   
   # SSH 연결 테스트
   ssh -i ~/.ssh/your-key.pem ubuntu@172.31.44.14
   
   # 상세 정보 확인
   ssh -v -i ~/.ssh/your-key.pem ubuntu@172.31.44.14
   ```
   - **성공하면**: DBeaver 설정 문제
   - **실패하면**: 보안 그룹 또는 네트워크 문제

3. **DBeaver SSH 설정 확인**:
   - SSH 키 파일 경로를 **절대 경로**로 변경 (예: `/Users/your-username/.ssh/your-key.pem`)
   - SSH 사용자명 확인 (`ubuntu`)
   - SSH 포트 확인 (`22`)

4. **자세한 문제 해결**: `md/SSH_TUNNEL_TROUBLESHOOTING.md` 참조

### 5.4 드라이버 다운로드 실패

**원인**: 네트워크 문제 또는 프록시 설정

**해결 방법**:
1. DBeaver 설정에서 프록시 확인:
   - **Window** → **Preferences** → **Network**
2. 수동으로 드라이버 다운로드:
   - [PostgreSQL JDBC Driver](https://jdbc.postgresql.org/download/)에서 다운로드
   - **Database** → **Driver Manager** → **PostgreSQL** → **Edit** → **Libraries** 탭에서 추가

### 5.5 Docker 컨테이너가 실행되지 않음

**해결 방법**:
```bash
# 서버에서 실행
cd /var/www/gig-core
docker-compose up -d postgres
docker-compose logs postgres
```

---

## 6. 유용한 DBeaver 기능

### 6.1 데이터 편집

1. 테이블을 더블클릭하여 데이터 보기
2. 데이터를 직접 편집 가능
3. 변경사항 저장: **Ctrl+S** (Mac: **Cmd+S**)

### 6.2 SQL 스크립트 실행

1. **SQL Editor**에서 여러 쿼리 작성
2. 실행할 쿼리 선택 후 **Execute SQL Statement** (▶)
3. 또는 전체 스크립트 실행: **Execute SQL Script** (▶▶)

### 6.3 데이터베이스 구조 확인

1. **Database Navigator**에서 스키마, 테이블, 뷰 등 확인
2. 테이블을 우클릭하여 **View Diagram** 선택하여 ERD 확인

### 6.4 데이터 내보내기/가져오기

1. 테이블 우클릭 → **Export Data**
2. 형식 선택 (CSV, JSON, SQL 등)
3. 파일 경로 지정 후 내보내기

---

## 7. 보안 권장사항

1. **SSH 터널 사용**: 직접 포트 노출보다 SSH 터널 사용 권장
2. **강력한 비밀번호**: 프로덕션 환경에서는 더 강력한 비밀번호 사용
3. **IP 화이트리스트**: 가능하면 특정 IP만 접근 허용
4. **SSL 연결**: 프로덕션에서는 SSL 연결 사용 권장
5. **연결 정보 보호**: DBeaver 연결 설정을 안전하게 관리

---

## 8. 추가 리소스

- [DBeaver 공식 문서](https://dbeaver.com/docs/)
- [PostgreSQL 공식 문서](https://www.postgresql.org/docs/)
- [SSH 터널링 가이드](https://dbeaver.com/docs/wiki/SSH-Tunnels/)

---

## 현재 프로젝트 연결 정보 요약

```
호스트: [서버 IP 주소 또는 도메인]
포트: 5432
사용자명: trusttrade
비밀번호: secure_password_123
데이터베이스: ai_trusttrade
```

**SSH 터널 사용 시:**
```
SSH 호스트: [서버 IP 주소]
SSH 포트: 22
SSH 사용자: [SSH 사용자명]
SSH 키: [Mac의 SSH 키 파일 경로]
```

---

문의사항이나 문제가 발생하면 프로젝트 관리자에게 문의하세요.

