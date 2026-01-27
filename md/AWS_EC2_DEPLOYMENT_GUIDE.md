# AWS EC2 Ubuntu 배포 가이드

이 가이드는 AI TrustTrade Core Service를 AWS EC2 Ubuntu 환경에 배포하는 단계별 가이드입니다.

## 목차

1. [EC2 인스턴스 준비](#1-ec2-인스턴스-준비)
2. [Ubuntu 환경 설정](#2-ubuntu-환경-설정)
3. [데이터베이스 설치 및 설정](#3-데이터베이스-설치-및-설정)
4. [프로젝트 배포](#4-프로젝트-배포)
5. [환경 변수 설정](#5-환경-변수-설정)
6. [프로세스 관리자 설정](#6-프로세스-관리자-설정)
7. [Nginx 리버스 프록시 설정](#7-nginx-리버스-프록시-설정)
8. [보안 설정](#8-보안-설정)
9. [모니터링 및 로그](#9-모니터링-및-로그)
10. [백업 및 복구](#10-백업-및-복구)

---

## 1. EC2 인스턴스 준비

### 1.1 EC2 인스턴스 생성

1. **AWS 콘솔** → **EC2** → **인스턴스 시작**
2. **AMI 선택**: Ubuntu Server 22.04 LTS (또는 최신 LTS 버전)
3. **인스턴스 유형**: 
   - 개발/테스트: `t3.medium` (2 vCPU, 4GB RAM)
   - 프로덕션: `t3.large` 이상 (4 vCPU, 8GB RAM 이상 권장)
4. **키 페어**: 새로 생성하거나 기존 키 페어 선택
5. **네트워크 설정**: 
   - VPC 선택
   - 퍼블릭 IP 자동 할당 활성화
   - 보안 그룹 설정 (아래 참조)

### 1.2 보안 그룹 설정

다음 포트를 열어야 합니다:

| 포트 | 프로토콜 | 소스 | 설명 |
|------|----------|------|------|
| 22 | TCP | 내 IP 주소 | SSH 접속 |
| 80 | TCP | 0.0.0.0/0 | HTTP (Nginx) |
| 443 | TCP | 0.0.0.0/0 | HTTPS (Nginx) |
| 3000 | TCP | 127.0.0.1/32 | NestJS 앱 (내부만) |

**주의**: 프로덕션 환경에서는 포트 3000을 외부에 노출하지 마세요. Nginx를 통해서만 접근하도록 설정합니다.

### 1.3 EC2 인스턴스 접속

```bash
# SSH로 EC2 인스턴스 접속
ssh -i your-key.pem ubuntu@your-ec2-public-ip

# 또는 Elastic IP를 사용하는 경우
ssh -i your-key.pem ubuntu@your-elastic-ip
```

---

## 2. Ubuntu 환경 설정

### 2.1 시스템 업데이트

```bash
# 패키지 목록 업데이트
sudo apt update

# 시스템 업그레이드
sudo apt upgrade -y

# 필수 도구 설치
sudo apt install -y curl wget git build-essential
```

### 2.2 Node.js 20 LTS 설치

```bash
# NodeSource 저장소 추가
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Node.js 설치
sudo apt install -y nodejs

# 설치 확인
node --version  # v20.x.x
npm --version   # 10.x.x
```

### 2.3 PM2 설치 (프로세스 관리자)

```bash
# PM2 전역 설치
sudo npm install -g pm2

# PM2가 시스템 부팅 시 자동 시작되도록 설정
pm2 startup systemd
# 출력된 명령어를 복사하여 실행 (sudo 권한 필요)
```

### 2.4 Nginx 설치

```bash
# Nginx 설치
sudo apt install -y nginx

# Nginx 시작 및 부팅 시 자동 시작 설정
sudo systemctl start nginx
sudo systemctl enable nginx

# 상태 확인
sudo systemctl status nginx
```

---

## 3. 데이터베이스 설치 및 설정

### 3.1 PostgreSQL 설치

```bash
# PostgreSQL 저장소 추가
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# 패키지 목록 업데이트
sudo apt update

# PostgreSQL 15 설치
sudo apt install -y postgresql-15 postgresql-contrib-15

# PostgreSQL 시작 및 부팅 시 자동 시작 설정
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 상태 확인
sudo systemctl status postgresql
```

### 3.2 PostgreSQL 데이터베이스 및 사용자 생성

```bash
# postgres 사용자로 전환
sudo -u postgres psql

# PostgreSQL 셸에서 실행할 명령어들:
```

```sql
-- 데이터베이스 생성
CREATE DATABASE ai_trusttrade;

-- 사용자 생성 및 비밀번호 설정
CREATE USER trusttrade WITH PASSWORD 'your_secure_password_here';

-- 권한 부여
GRANT ALL PRIVILEGES ON DATABASE ai_trusttrade TO trusttrade;

-- PostgreSQL 15 이상에서는 스키마 권한도 부여 필요
\c ai_trusttrade
GRANT ALL ON SCHEMA public TO trusttrade;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO trusttrade;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO trusttrade;

-- 종료
\q
```

### 3.3 PostgreSQL 원격 접속 설정 (선택사항)

로컬에서만 접속하는 경우 이 단계는 건너뛰세요.

```bash
# PostgreSQL 설정 파일 편집
sudo nano /etc/postgresql/15/main/postgresql.conf

# 다음 줄 찾아서 주석 해제 및 수정
# listen_addresses = 'localhost'  →  listen_addresses = '*'
```

```bash
# pg_hba.conf 파일 편집
sudo nano /etc/postgresql/15/main/pg_hba.conf

# 파일 끝에 추가 (보안을 위해 특정 IP만 허용 권장)
host    all             all             0.0.0.0/0               md5
```

```bash
# PostgreSQL 재시작
sudo systemctl restart postgresql
```

### 3.4 Redis 설치

```bash
# Redis 설치
sudo apt install -y redis-server

# Redis 설정 파일 편집
sudo nano /etc/redis/redis.conf

# 다음 설정 변경:
# bind 127.0.0.1 ::1  (기본값 유지 - 로컬만 접속)
# protected-mode yes  (기본값 유지)
# requirepass your_redis_password  (선택사항, 보안 강화)

# Redis 시작 및 부팅 시 자동 시작 설정
sudo systemctl start redis-server
sudo systemctl enable redis-server

# 상태 확인
sudo systemctl status redis-server

# Redis 연결 테스트
redis-cli ping
# 응답: PONG
```

---

## 4. 프로젝트 배포

### 4.1 프로젝트 디렉토리 생성

```bash
# 애플리케이션 디렉토리 생성
sudo mkdir -p /var/www/gig-core
sudo chown -R ubuntu:ubuntu /var/www/gig-core
cd /var/www/gig-core
```

### 4.2 배포 방법 선택

GitHub에 소스가 없는 경우, 다음 방법 중 하나를 선택하세요:

#### 방법 A: 자동 배포 스크립트 사용 (권장)

로컬 컴퓨터에서 프로젝트 디렉토리로 이동한 후:

```bash
# 배포 스크립트 실행 (로컬에서 빌드 후 자동 전송)
./scripts/deploy-to-ec2.sh <EC2_IP> <KEY_FILE>

# 예시
./scripts/deploy-to-ec2.sh 54.123.45.67 ~/.ssh/my-key.pem
```

이 스크립트는:
- 로컬에서 프로덕션 빌드 수행
- rsync를 사용하여 EC2로 파일 전송
- 원격 서버에서 의존성 설치 및 PM2 재시작

#### 방법 B: 압축 파일로 전송

**로컬 컴퓨터에서:**

```bash
# 프로젝트 디렉토리로 이동
cd /path/to/gig-core

# 프로덕션 빌드
npm run build

# 배포용 파일만 압축 (불필요한 파일 제외)
tar -czf gig-core-deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='.env' \
  --exclude='logs' \
  --exclude='*.log' \
  --exclude='coverage' \
  --exclude='.DS_Store' \
  --exclude='dist' \
  package.json package-lock.json \
  tsconfig.json \
  ecosystem.config.js \
  src/ \
  scripts/ \
  *.md \
  *.sql \
  docker-compose.yml \
  Dockerfile* \
  dist/

# 압축 파일을 EC2로 전송
scp -i <KEY_FILE> gig-core-deploy.tar.gz ubuntu@<EC2_IP>:/tmp/
```

**EC2 서버에서:**

```bash
# 압축 파일 압축 해제
cd /var/www/gig-core
tar -xzf /tmp/gig-core-deploy.tar.gz

# 의존성 설치
npm ci --production

# 빌드는 이미 로컬에서 완료되었으므로 dist 디렉토리만 확인
ls -la dist/
```

#### 방법 C: rsync로 직접 전송 (수동)

**로컬 컴퓨터에서:**

```bash
# 프로덕션 빌드
npm run build

# rsync로 파일 전송
rsync -avz --progress \
  -e "ssh -i <KEY_FILE>" \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.env' \
  --exclude 'logs' \
  --exclude '*.log' \
  --exclude 'coverage' \
  --exclude '.DS_Store' \
  ./ ubuntu@<EC2_IP>:/var/www/gig-core/

# dist 디렉토리 전송
rsync -avz --progress \
  -e "ssh -i <KEY_FILE>" \
  dist/ ubuntu@<EC2_IP>:/var/www/gig-core/dist/
```

**EC2 서버에서:**

```bash
cd /var/www/gig-core

# 의존성 설치
npm ci --production
```

#### 방법 D: SCP로 직접 전송

**로컬 컴퓨터에서:**

```bash
# 프로덕션 빌드
npm run build

# 전체 디렉토리를 압축하여 전송
tar -czf - \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='.env' \
  --exclude='logs' \
  --exclude='*.log' \
  --exclude='coverage' \
  --exclude='.DS_Store' \
  . | ssh -i <KEY_FILE> ubuntu@<EC2_IP> "cd /var/www/gig-core && tar -xzf -"
```

**EC2 서버에서:**

```bash
cd /var/www/gig-core

# 의존성 설치
npm ci --production
```

### 4.3 의존성 설치 및 빌드 확인

```bash
# EC2 서버에서 실행
cd /var/www/gig-core

# 의존성 설치 (방법 A를 사용한 경우 이미 완료됨)
npm ci --production

# 빌드 확인 (로컬에서 빌드한 경우)
ls -la dist/

# 빌드가 없는 경우 원격에서 빌드
# npm run build
```

---

## 5. 환경 변수 설정

### 5.1 .env 파일 생성

```bash
# .env 파일 생성
nano /var/www/gig-core/.env
```

### 5.2 환경 변수 설정

```env
# Application Configuration
NODE_ENV=production
PORT=3000
API_PREFIX=api/v1
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=trusttrade
DB_PASSWORD=your_secure_password_here
DB_DATABASE=ai_trusttrade
DB_SYNCHRONIZE=false

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_ENABLED=true
# REDIS_PASSWORD=your_redis_password  # Redis에 비밀번호 설정한 경우

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_minimum_32_characters_long_for_security
JWT_EXPIRATION=30d

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# Payment Gateways (선택사항)
PAYMONGO_SECRET_KEY=sk_live_your_paymongo_secret_key
GCASH_API_KEY=your_gcash_api_key
PAYMAYA_API_KEY=your_paymaya_api_key

# AWS Configuration (선택사항)
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_S3_BUCKET=your_s3_bucket_name

# Twilio SMS (선택사항)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# SendGrid Email (선택사항)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Firebase Push Notifications (선택사항)
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
```

### 5.3 JWT_SECRET 생성

```bash
# 강력한 JWT Secret 생성
openssl rand -base64 32

# 생성된 값을 .env 파일의 JWT_SECRET에 설정
```

### 5.4 파일 권한 설정

```bash
# .env 파일 권한 설정 (소유자만 읽기/쓰기)
chmod 600 /var/www/gig-core/.env
```

---

## 6. 프로세스 관리자 설정

### 6.1 PM2 설정 파일 생성

```bash
# PM2 ecosystem 파일 생성
nano /var/www/gig-core/ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'gig-core',
    script: './dist/main.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    autorestart: true,
    max_memory_restart: '1G',
    watch: false,
    ignore_watch: ['node_modules', 'logs']
  }]
};
```

### 6.2 로그 디렉토리 생성

```bash
# 로그 디렉토리 생성
mkdir -p /var/www/gig-core/logs
```

### 6.3 PM2로 애플리케이션 시작

```bash
# PM2로 애플리케이션 시작
cd /var/www/gig-core
pm2 start ecosystem.config.js

# 상태 확인
pm2 status

# 로그 확인
pm2 logs gig-core

# PM2 저장 (재부팅 후에도 유지)
pm2 save
```

### 6.4 PM2 유용한 명령어

```bash
# 애플리케이션 재시작
pm2 restart gig-core

# 애플리케이션 중지
pm2 stop gig-core

# 애플리케이션 삭제
pm2 delete gig-core

# 모니터링
pm2 monit

# 로그 실시간 확인
pm2 logs gig-core --lines 100
```

---

## 7. Nginx 리버스 프록시 설정

### 7.1 Nginx 설정 파일 생성

```bash
# Nginx 설정 파일 생성
sudo nano /etc/nginx/sites-available/gig-core
```

### 7.2 Nginx 설정 내용

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # 로그 설정
    access_log /var/log/nginx/gig-core-access.log;
    error_log /var/log/nginx/gig-core-error.log;

    # 최대 업로드 크기
    client_max_body_size 10M;

    # API 프록시
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 타임아웃 설정
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Swagger 문서 (선택사항 - 프로덕션에서는 제거 권장)
    location /api-docs {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 7.3 Nginx 설정 활성화

```bash
# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/gig-core /etc/nginx/sites-enabled/

# 기본 설정 제거 (선택사항)
sudo rm /etc/nginx/sites-enabled/default

# Nginx 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx

# 상태 확인
sudo systemctl status nginx
```

### 7.4 SSL 인증서 설정 (Let's Encrypt)

```bash
# Certbot 설치
sudo apt install -y certbot python3-certbot-nginx

# SSL 인증서 발급 및 자동 설정
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 인증서 자동 갱신 테스트
sudo certbot renew --dry-run
```

Certbot이 자동으로 Nginx 설정을 업데이트하여 HTTPS를 활성화합니다.

---

## 8. 보안 설정

### 8.1 방화벽 설정 (UFW)

```bash
# UFW 설치 (이미 설치되어 있을 수 있음)
sudo apt install -y ufw

# 기본 정책 설정
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 필요한 포트 허용
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# 방화벽 활성화
sudo ufw enable

# 상태 확인
sudo ufw status
```

### 8.2 SSH 보안 강화

```bash
# SSH 설정 파일 편집
sudo nano /etc/ssh/sshd_config

# 다음 설정 변경:
# PermitRootLogin no
# PasswordAuthentication no  (키 기반 인증만 허용)
# Port 22  (또는 다른 포트로 변경)

# SSH 재시작
sudo systemctl restart sshd
```

### 8.3 자동 보안 업데이트

```bash
# unattended-upgrades 설치
sudo apt install -y unattended-upgrades

# 자동 업데이트 활성화
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 8.4 환경 변수 보안

```bash
# .env 파일 권한 확인
ls -la /var/www/gig-core/.env
# 출력: -rw------- (소유자만 읽기/쓰기)

# 민감한 정보가 로그에 출력되지 않도록 주의
```

---

## 9. 모니터링 및 로그

### 9.1 애플리케이션 로그 확인

```bash
# PM2 로그
pm2 logs gig-core

# Nginx 로그
sudo tail -f /var/log/nginx/gig-core-access.log
sudo tail -f /var/log/nginx/gig-core-error.log

# PostgreSQL 로그
sudo tail -f /var/log/postgresql/postgresql-15-main.log

# Redis 로그
sudo tail -f /var/log/redis/redis-server.log
```

### 9.2 시스템 리소스 모니터링

```bash
# CPU 및 메모리 사용량
htop

# 디스크 사용량
df -h

# 네트워크 연결 확인
netstat -tulpn | grep :3000
```

### 9.3 Health Check 설정

```bash
# Health Check 엔드포인트 테스트
curl http://localhost:3000/api/v1/health

# 또는 도메인을 통해
curl https://yourdomain.com/api/v1/health
```

### 9.4 PM2 모니터링 대시보드 (선택사항)

```bash
# PM2 Plus 계정 생성 후
pm2 link <secret_key> <public_key>

# 또는 로컬 모니터링
pm2 monit
```

---

## 10. 백업 및 복구

### 10.1 데이터베이스 백업

```bash
# 백업 스크립트 생성
nano /home/ubuntu/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="ai_trusttrade"
DB_USER="trusttrade"

mkdir -p $BACKUP_DIR

# 데이터베이스 백업
PGPASSWORD='your_db_password' pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# 7일 이상 된 백업 삭제
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: db_backup_$DATE.sql.gz"
```

```bash
# 실행 권한 부여
chmod +x /home/ubuntu/backup-db.sh

# 수동 실행 테스트
/home/ubuntu/backup-db.sh
```

### 10.2 자동 백업 설정 (Cron)

```bash
# Crontab 편집
crontab -e

# 매일 새벽 2시에 백업 실행
0 2 * * * /home/ubuntu/backup-db.sh >> /home/ubuntu/backup.log 2>&1
```

### 10.3 데이터베이스 복구

```bash
# 백업 파일 압축 해제
gunzip db_backup_20240101_020000.sql.gz

# 데이터베이스 복구
PGPASSWORD='your_db_password' psql -U trusttrade -h localhost -d ai_trusttrade < db_backup_20240101_020000.sql
```

### 10.4 애플리케이션 코드 백업

```bash
# Git을 사용하는 경우 자동으로 버전 관리됨
# 또는 정기적으로 코드 백업
tar -czf /home/ubuntu/app_backup_$(date +%Y%m%d).tar.gz /var/www/gig-core
```

---

## 11. 배포 후 확인 사항

### 11.1 애플리케이션 동작 확인

```bash
# 1. 애플리케이션 실행 상태 확인
pm2 status

# 2. Health Check
curl http://localhost:3000/api/v1/health

# 3. API 엔드포인트 테스트
curl https://yourdomain.com/api/v1/health

# 4. Swagger 문서 확인 (프로덕션에서는 제거 권장)
curl https://yourdomain.com/api-docs
```

### 11.2 데이터베이스 연결 확인

```bash
# PostgreSQL 연결 테스트
psql -U trusttrade -h localhost -d ai_trusttrade -c "SELECT version();"

# Redis 연결 테스트
redis-cli ping
```

### 11.3 성능 테스트

```bash
# 간단한 부하 테스트 (Apache Bench 설치 필요)
sudo apt install -y apache2-utils

# 100 요청, 동시 10 연결
ab -n 100 -c 10 https://yourdomain.com/api/v1/health
```

---

## 12. 업데이트 및 배포 프로세스

### 12.1 코드 업데이트

```bash
# 프로젝트 디렉토리로 이동
cd /var/www/gig-core

# 최신 코드 가져오기
git pull origin main

# 의존성 업데이트
npm ci --production

# 빌드
npm run build

# PM2 재시작
pm2 restart gig-core

# 로그 확인
pm2 logs gig-core --lines 50
```

### 12.2 롤백 절차

```bash
# 이전 버전으로 되돌리기
cd /var/www/gig-core
git checkout <previous-commit-hash>

# 빌드 및 재시작
npm run build
pm2 restart gig-core
```

---

## 13. 트러블슈팅

### 13.1 애플리케이션이 시작되지 않는 경우

```bash
# PM2 로그 확인
pm2 logs gig-core --err

# 환경 변수 확인
cat /var/www/gig-core/.env

# 포트 사용 확인
sudo lsof -i :3000

# 데이터베이스 연결 확인
psql -U trusttrade -h localhost -d ai_trusttrade
```

### 13.2 Nginx 502 Bad Gateway 오류

```bash
# NestJS 애플리케이션 실행 확인
pm2 status

# 포트 3000에서 응답하는지 확인
curl http://localhost:3000/api/v1/health

# Nginx 에러 로그 확인
sudo tail -f /var/log/nginx/gig-core-error.log
```

### 13.3 데이터베이스 연결 오류

```bash
# PostgreSQL 실행 상태 확인
sudo systemctl status postgresql

# PostgreSQL 로그 확인
sudo tail -f /var/log/postgresql/postgresql-15-main.log

# 연결 테스트
psql -U trusttrade -h localhost -d ai_trusttrade
```

### 13.4 메모리 부족

```bash
# 메모리 사용량 확인
free -h

# PM2 메모리 제한 설정 (ecosystem.config.js)
# max_memory_restart: '1G'

# 스왑 메모리 추가 (필요한 경우)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## 14. 추가 최적화

### 14.1 Node.js 최적화

```bash
# PM2 ecosystem.config.js에 추가
env: {
  NODE_ENV: 'production',
  PORT: 3000,
  NODE_OPTIONS: '--max-old-space-size=2048'  # 메모리 제한
}
```

### 14.2 Nginx 캐싱 (선택사항)

```nginx
# 정적 파일 캐싱
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 14.3 데이터베이스 연결 풀 최적화

TypeORM 설정에서 연결 풀 크기 조정 (이미 app.module.ts에 설정되어 있음)

---

## 15. 체크리스트

배포 전 확인 사항:

- [ ] EC2 인스턴스 생성 및 보안 그룹 설정
- [ ] Node.js 20 LTS 설치
- [ ] PostgreSQL 15 설치 및 데이터베이스 생성
- [ ] Redis 설치 및 실행
- [ ] 프로젝트 코드 배포
- [ ] 환경 변수 설정 (.env 파일)
- [ ] PM2로 애플리케이션 실행
- [ ] Nginx 리버스 프록시 설정
- [ ] SSL 인증서 설정 (Let's Encrypt)
- [ ] 방화벽 설정 (UFW)
- [ ] Health Check 엔드포인트 테스트
- [ ] 데이터베이스 백업 스크립트 설정
- [ ] 모니터링 및 로그 확인

---

## 참고 자료

- [NestJS 공식 문서](https://docs.nestjs.com/)
- [PM2 문서](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx 문서](https://nginx.org/en/docs/)
- [PostgreSQL 문서](https://www.postgresql.org/docs/)
- [AWS EC2 문서](https://docs.aws.amazon.com/ec2/)

---

**작성일**: 2025-01-31  
**버전**: 1.0.0

