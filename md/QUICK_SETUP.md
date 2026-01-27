# EC2 서버 빠른 초기 설정 가이드

EC2 서버에 Node.js, PM2, Nginx, PostgreSQL, Redis를 자동으로 설치하는 방법입니다.

## 방법 1: 배포 스크립트가 자동으로 실행 (권장)

배포 스크립트를 실행하면 자동으로 초기 설정이 필요한지 확인하고 실행합니다:

```bash
./scripts/deploy-to-ec2.sh 43.201.114.64 ~/.ssh/OJT.pem
```

## 방법 2: 수동으로 초기 설정 실행

### 1단계: 초기 설정 스크립트를 EC2로 전송

```bash
scp -i ~/.ssh/OJT.pem scripts/setup-ec2-server.sh ubuntu@43.201.114.64:/tmp/
```

### 2단계: EC2에 SSH 접속

```bash
ssh -i ~/.ssh/OJT.pem ubuntu@43.201.114.64
```

### 3단계: 초기 설정 스크립트 실행

```bash
chmod +x /tmp/setup-ec2-server.sh
sudo /tmp/setup-ec2-server.sh
```

이 스크립트는 다음을 자동으로 설치합니다:
- Node.js 20 LTS
- PM2 (프로세스 관리자)
- Nginx (웹 서버)
- PostgreSQL 15 (데이터베이스)
- Redis (캐시)
- UFW 방화벽

### 4단계: 데이터베이스 설정

```bash
sudo -u postgres psql
```

PostgreSQL 셸에서:

```sql
CREATE DATABASE ai_trusttrade;
CREATE USER trusttrade WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE ai_trusttrade TO trusttrade;
\c ai_trusttrade
GRANT ALL ON SCHEMA public TO trusttrade;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO trusttrade;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO trusttrade;
\q
```

### 5단계: 배포 실행

초기 설정이 완료되면 배포 스크립트를 실행하세요:

```bash
./scripts/deploy-to-ec2.sh 43.201.114.64 ~/.ssh/OJT.pem
```

## 설치 확인

EC2 서버에서 다음 명령어로 설치를 확인할 수 있습니다:

```bash
# Node.js 버전 확인
node --version

# npm 버전 확인
npm --version

# PM2 버전 확인
pm2 --version

# PostgreSQL 버전 확인
psql --version

# Redis 버전 확인
redis-cli --version
```

## 문제 해결

### 초기 설정 스크립트 실행 실패

```bash
# 스크립트에 실행 권한 부여
chmod +x /tmp/setup-ec2-server.sh

# sudo 권한으로 실행
sudo /tmp/setup-ec2-server.sh
```

### Node.js 설치 확인

```bash
# Node.js가 설치되어 있는지 확인
which node

# 설치되어 있지 않으면 수동 설치
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

