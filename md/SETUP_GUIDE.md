# Gig-Core 시스템 설정 가이드

이 문서는 gig-core (AI TrustTrade Core Service) 시스템을 운영하기 위한 상세한 설정 가이드를 제공합니다.

## 📋 목차

1. [시스템 개요](#시스템-개요)
2. [사전 요구사항](#사전-요구사항)
3. [설치 및 설정](#설치-및-설정)
4. [환경 변수 설정](#환경-변수-설정)
5. [데이터베이스 설정](#데이터베이스-설정)
6. [개발 서버 실행](#개발-서버-실행)
7. [프로덕션 배포](#프로덕션-배포)
8. [트러블슈팅](#트러블슈팅)

## 시스템 개요

**Gig-Core**는 기그 이코노미(Gig Economy) 마켓플레이스를 위한 백엔드 API 서버입니다.

### 주요 기능 모듈

- **인증 (Auth)**: JWT 기반 인증, OTP 인증
- **사용자 관리 (Users)**: 프로필 관리, KYC 인증
- **서비스 관리 (Services)**: 서비스 게시 및 관리
- **예약 시스템 (Bookings)**: 예약 생성 및 관리
- **결제 처리 (Payments)**: 에스크로, 지갑 관리
- **리뷰 시스템 (Reviews)**: 양방향 리뷰 및 평점
- **매칭 시스템 (Matching)**: AI 기반 서비스 매칭
- **신뢰 점수 (Trust Score)**: ML 기반 신뢰도 평가
- **알림 (Notifications)**: 푸시, SMS, 이메일 알림
- **메시징 (Messages)**: 실시간 채팅
- **분쟁 해결 (Disputes)**: 자동화된 분쟁 처리 워크플로우

### 기술 스택

- **Runtime**: Node.js 20+
- **Framework**: NestJS 10.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **ORM**: TypeORM 0.3.x

## 사전 요구사항

다음 소프트웨어가 설치되어 있어야 합니다:

```bash
# Node.js 버전 확인
node --version  # >= 20.0.0

# npm 버전 확인
npm --version   # >= 9.0.0

# PostgreSQL 확인
psql --version  # >= 15.0

# Redis 확인 (선택사항, Docker 사용 시 불필요)
redis-cli --version  # >= 7.0

# Docker 확인 (선택사항)
docker --version
docker-compose --version
```

## 설치 및 설정

### 1. 저장소 클론 및 의존성 설치

```bash
# 프로젝트 디렉토리로 이동
cd /Users/michaeljang/Git/gig-core

# 의존성 설치
npm install
```

### 2. 누락된 의존성 확인

시스템에서 사용하는 `@nestjs/throttler` 패키지가 자동으로 설치되었는지 확인:

```bash
npm list @nestjs/throttler
```

설치되어 있지 않다면:

```bash
npm install @nestjs/throttler
```

## 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 변수들을 설정하세요:

```bash
# .env 파일 생성
touch .env
```

### 필수 환경 변수

```env
# Application Configuration
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=trusttrade
DB_PASSWORD=secure_password_123
DB_DATABASE=ai_trusttrade
DB_SYNCHRONIZE=false

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_minimum_32_characters_long_for_security
JWT_EXPIRATION=30d

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

### 선택적 환경 변수 (외부 서비스 연동)

```env
# Payment Gateways
PAYMONGO_SECRET_KEY=sk_test_your_paymongo_secret_key
GCASH_API_KEY=your_gcash_api_key
PAYMAYA_API_KEY=your_paymaya_api_key

# AWS Configuration
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_S3_BUCKET=your_s3_bucket_name

# Twilio SMS
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# SendGrid Email
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@trusttrade.ph

# Firebase Push Notifications
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
```

### JWT_SECRET 생성

보안을 위해 강력한 JWT Secret을 생성하세요:

```bash
# 방법 1: OpenSSL 사용
openssl rand -base64 32

# 방법 2: Node.js 사용
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

생성된 값을 `.env` 파일의 `JWT_SECRET`에 설정하세요.

## 데이터베이스 설정

### 방법 1: Docker Compose 사용 (권장)

가장 간단한 방법은 Docker Compose를 사용하는 것입니다:

```bash
# PostgreSQL과 Redis를 함께 실행
docker-compose up -d postgres redis

# 로그 확인
docker-compose logs -f postgres redis

# 서비스 상태 확인
docker-compose ps
```

### 방법 2: 로컬 PostgreSQL 설치

로컬에 PostgreSQL이 설치되어 있다면:

```bash
# PostgreSQL 데이터베이스 생성
createdb ai_trusttrade

# 또는 psql을 사용하여
psql -U postgres -c "CREATE DATABASE ai_trusttrade;"
psql -U postgres -c "CREATE USER trusttrade WITH PASSWORD 'secure_password_123';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ai_trusttrade TO trusttrade;"
```

### 데이터베이스 스키마 초기화

TypeORM의 `synchronize` 옵션을 사용하거나 수동으로 마이그레이션을 실행할 수 있습니다.

**주의**: 프로덕션 환경에서는 `DB_SYNCHRONIZE=false`로 설정하고 마이그레이션을 사용하세요.

```env
# 개발 환경에서만 사용
DB_SYNCHRONIZE=true

# 프로덕션 환경
DB_SYNCHRONIZE=false
```

## 개발 서버 실행

### 1. 환경 변수 확인

`.env` 파일이 올바르게 설정되었는지 확인:

```bash
# 환경 변수 확인 (민감한 정보는 표시되지 않음)
cat .env | grep -v PASSWORD | grep -v SECRET
```

### 2. 데이터베이스 연결 확인

```bash
# PostgreSQL 연결 테스트
psql -h localhost -U trusttrade -d ai_trusttrade -c "SELECT version();"

# 또는 Docker 사용 시
docker-compose exec postgres psql -U trusttrade -d ai_trusttrade -c "SELECT version();"
```

### 3. Redis 연결 확인

```bash
# Redis 연결 테스트
redis-cli -h localhost -p 6379 ping

# 또는 Docker 사용 시
docker-compose exec redis redis-cli ping
```

### 4. 개발 서버 시작

```bash
# 개발 모드로 실행 (Hot reload 지원)
npm run start:dev
```

성공적으로 시작되면 다음과 같은 메시지가 표시됩니다:

```
🚀 AI TrustTrade Core Service is running!
🌍 Environment: development
📡 API: http://localhost:3000/api/v1
📚 Health Check: http://localhost:3000/api/v1/health
```

### 5. 헬스 체크

다른 터미널에서 헬스 체크를 실행:

```bash
curl http://localhost:3000/api/v1/health
```

예상 응답:

```json
{
  "status": "ok",
  "timestamp": "2025-01-27T10:00:00.000Z",
  "service": "ai-trusttrade-core-service",
  "version": "1.0.0"
}
```

## 프로덕션 배포

### 1. 빌드

```bash
# TypeScript 컴파일
npm run build

# dist 디렉토리에 컴파일된 파일 생성 확인
ls -la dist/
```

### 2. Docker를 사용한 배포

```bash
# Docker 이미지 빌드
docker build -t gig-core:latest .

# 컨테이너 실행
docker run -d \
  --name gig-core \
  -p 3000:3000 \
  --env-file .env \
  --network host \
  gig-core:latest
```

### 3. Docker Compose를 사용한 전체 스택 배포

```bash
# 전체 스택 (API + PostgreSQL + Redis) 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f api

# 서비스 중지
docker-compose down

# 볼륨까지 삭제하려면
docker-compose down -v
```

### 4. 환경별 설정

프로덕션 환경에서는 다음을 설정하세요:

```env
NODE_ENV=production
DB_SYNCHRONIZE=false
CORS_ORIGIN=https://yourdomain.com
JWT_SECRET=<strong_production_secret>
```

## 트러블슈팅

### 문제 1: 의존성 설치 오류

```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

### 문제 2: 데이터베이스 연결 실패

**증상**: `ECONNREFUSED` 또는 `Connection refused` 오류

**해결책**:

```bash
# PostgreSQL이 실행 중인지 확인
pg_isready -h localhost -p 5432

# Docker를 사용하는 경우
docker-compose ps postgres

# 연결 정보 확인
cat .env | grep DB_
```

### 문제 3: Redis 연결 실패

**증상**: `ECONNREFUSED` 오류 또는 Redis 관련 오류

**해결책**:

```bash
# Redis가 실행 중인지 확인
redis-cli -h localhost -p 6379 ping

# Docker를 사용하는 경우
docker-compose ps redis

# Redis 재시작
docker-compose restart redis
```

### 문제 4: 포트 충돌

**증상**: `EADDRINUSE` 오류

**해결책**:

```bash
# 포트 사용 중인 프로세스 확인
lsof -i :3000

# 프로세스 종료
kill -9 <PID>

# 또는 다른 포트 사용
PORT=3001 npm run start:dev
```

### 문제 5: JWT 인증 오류

**증상**: `JWT_SECRET is not defined` 또는 인증 실패

**해결책**:

```bash
# JWT_SECRET이 설정되어 있는지 확인
grep JWT_SECRET .env

# 강력한 Secret 재생성
openssl rand -base64 32
```

### 문제 6: TypeORM 엔티티 로드 실패

**증상**: `No metadata found for entity` 오류

**해결책**:

```bash
# 빌드 파일 확인
ls -la dist/modules/**/*.entity.js

# 재빌드
npm run build
```

### 문제 7: 타입 에러

**증상**: TypeScript 컴파일 오류

**해결책**:

```bash
# 타입 정의 확인
npm list @types/node @types/express

# 타입 재설치
npm install --save-dev @types/node @types/express
```

## 유용한 명령어

### 개발 중

```bash
# 개발 서버 시작
npm run start:dev

# 빌드
npm run build

# 린트 체크
npm run lint

# 테스트 실행
npm run test
```

### Docker 관리

```bash
# 전체 스택 시작
docker-compose up -d

# 특정 서비스만 시작
docker-compose up -d postgres redis

# 로그 확인
docker-compose logs -f [service_name]

# 서비스 재시작
docker-compose restart [service_name]

# 서비스 중지
docker-compose down

# 볼륨 삭제
docker-compose down -v
```

### 데이터베이스 관리

```bash
# PostgreSQL 접속
psql -h localhost -U trusttrade -d ai_trusttrade

# 테이블 목록 확인
\dt

# 특정 테이블 구조 확인
\d users

# SQL 실행
SELECT * FROM users LIMIT 10;
```

## 다음 단계

시스템이 정상적으로 실행되면:

1. **API 테스트**: Postman이나 curl을 사용하여 API 엔드포인트 테스트
2. **인증 플로우**: 회원가입 및 로그인 테스트
3. **모듈별 기능**: 각 모듈의 기능 테스트
4. **모니터링 설정**: 로그 및 모니터링 도구 설정
5. **보안 강화**: 프로덕션 환경 보안 설정

## 추가 리소스

- [NestJS 공식 문서](https://docs.nestjs.com/)
- [TypeORM 문서](https://typeorm.io/)
- [PostgreSQL 문서](https://www.postgresql.org/docs/)
- [Redis 문서](https://redis.io/documentation)

## 지원

문제가 발생하면:

1. 이 가이드의 트러블슈팅 섹션 확인
2. 프로젝트 README.md 확인
3. 로그 파일 확인 (`docker-compose logs` 또는 콘솔 출력)
4. GitHub 이슈 트래커 확인 (있는 경우)

---

**최종 업데이트**: 2025-01-27  
**버전**: 1.0.0

