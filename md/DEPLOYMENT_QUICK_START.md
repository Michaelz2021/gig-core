# AWS EC2 배포 빠른 시작 가이드

이 문서는 AWS EC2 Ubuntu 환경에 빠르게 배포하는 방법을 안내합니다.

## 전제 조건

- AWS EC2 인스턴스 (Ubuntu 22.04 LTS)
- SSH 키 파일 (.pem)
- EC2 인스턴스의 퍼블릭 IP 주소
- 도메인 (선택사항, SSL 인증서 사용 시)

## 빠른 배포 (3단계)

### 1단계: EC2 서버 초기 설정

**로컬 컴퓨터에서:**

```bash
# 초기 설정 스크립트를 EC2로 전송
scp -i <KEY_FILE> scripts/setup-ec2-server.sh ubuntu@<EC2_IP>:/tmp/
```

**EC2 서버에서:**

```bash
# 스크립트 실행 권한 부여 및 실행
chmod +x /tmp/setup-ec2-server.sh
sudo /tmp/setup-ec2-server.sh
```

이 스크립트는 다음을 자동으로 설치합니다:
- Node.js 20 LTS
- PM2
- Nginx
- PostgreSQL 15
- Redis
- UFW 방화벽

### 2단계: 데이터베이스 설정

```bash
# PostgreSQL 사용자로 전환
sudo -u postgres psql

# 데이터베이스 및 사용자 생성
CREATE DATABASE ai_trusttrade;
CREATE USER trusttrade WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE ai_trusttrade TO trusttrade;
\c ai_trusttrade
GRANT ALL ON SCHEMA public TO trusttrade;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO trusttrade;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO trusttrade;
\q
```

### 3단계: 애플리케이션 배포

#### 방법 A: 자동 배포 스크립트 사용 (권장)

로컬 컴퓨터에서:

```bash
# 배포 스크립트 실행 (로컬에서 빌드 후 자동 전송)
./scripts/deploy-to-ec2.sh <EC2_IP> <KEY_FILE>

# 예시
./scripts/deploy-to-ec2.sh 54.123.45.67 ~/.ssh/my-key.pem
```

이 스크립트는 자동으로:
- 로컬에서 프로덕션 빌드 수행
- rsync를 사용하여 EC2로 파일 전송
- 원격 서버에서 의존성 설치 및 PM2 재시작

#### 방법 B: 압축 파일로 전송

**로컬 컴퓨터에서:**

```bash
# 프로젝트 디렉토리로 이동
cd /path/to/gig-core

# 배포 패키지 자동 생성 스크립트 사용 (권장)
./scripts/create-deploy-package.sh

# 또는 수동으로 압축
npm run build
tar -czf gig-core-deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='.env' \
  --exclude='logs' \
  --exclude='*.log' \
  --exclude='coverage' \
  --exclude='.DS_Store' \
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

# EC2로 전송
scp -i <KEY_FILE> gig-core-deploy*.tar.gz ubuntu@<EC2_IP>:/tmp/
```

**EC2 서버에서:**

```bash
# 프로젝트 디렉토리 생성
sudo mkdir -p /var/www/gig-core
sudo chown -R ubuntu:ubuntu /var/www/gig-core
cd /var/www/gig-core

# 압축 해제
tar -xzf /tmp/gig-core-deploy.tar.gz

# 의존성 설치
npm ci --production

# .env 파일 생성
nano .env
# 환경 변수 설정 (아래 참조)

# PM2로 시작
pm2 start ecosystem.config.js
pm2 save
```

#### 방법 C: rsync로 직접 전송

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
npm ci --production
pm2 start ecosystem.config.js
pm2 save
```

## 환경 변수 설정

`/var/www/gig-core/.env` 파일 생성:

```env
NODE_ENV=production
PORT=3000
API_PREFIX=api/v1
CORS_ORIGIN=https://yourdomain.com

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=trusttrade
DB_PASSWORD=your_secure_password
DB_DATABASE=ai_trusttrade
DB_SYNCHRONIZE=false

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_ENABLED=true

JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRATION=30d

RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

## Nginx 설정

```bash
# Nginx 설정 파일 생성
sudo nano /etc/nginx/sites-available/gig-core
```

다음 내용 추가:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

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
    }
}
```

```bash
# 설정 활성화
sudo ln -s /etc/nginx/sites-available/gig-core /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## SSL 인증서 설정 (선택사항)

```bash
# Certbot 설치
sudo apt install -y certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 확인

```bash
# Health Check
curl http://localhost:3000/api/v1/health

# 또는 도메인을 통해
curl https://yourdomain.com/api/v1/health
```

## 유용한 명령어

```bash
# PM2 상태 확인
pm2 status

# PM2 로그 확인
pm2 logs gig-core

# PM2 재시작
pm2 restart gig-core

# Nginx 로그 확인
sudo tail -f /var/log/nginx/gig-core-access.log
sudo tail -f /var/log/nginx/gig-core-error.log
```

## 문제 해결

### 애플리케이션이 시작되지 않는 경우

```bash
# PM2 로그 확인
pm2 logs gig-core --err

# 환경 변수 확인
cat /var/www/gig-core/.env

# 데이터베이스 연결 확인
psql -U trusttrade -h localhost -d ai_trusttrade
```

### Nginx 502 오류

```bash
# 애플리케이션 실행 확인
pm2 status

# 포트 확인
curl http://localhost:3000/api/v1/health
```

## 다음 단계

자세한 내용은 [AWS_EC2_DEPLOYMENT_GUIDE.md](./AWS_EC2_DEPLOYMENT_GUIDE.md)를 참조하세요.

