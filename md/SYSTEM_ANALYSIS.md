# Gig-Core 시스템 분석 요약

이 문서는 gig-core 시스템의 아키텍처, 구조, 그리고 주요 컴포넌트에 대한 분석 결과를 요약합니다.

## 📊 시스템 개요

**프로젝트명**: AI TrustTrade Core Service (gig-core)  
**버전**: 1.0.0  
**타입**: NestJS 기반 RESTful API 서버  
**목적**: 기그 이코노미 마켓플레이스 백엔드 서비스

## 🏗️ 아키텍처

### 전체 구조

```
┌─────────────────────────────────────────────┐
│         Client Applications                  │
│   (Web, iOS, Android)                       │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│         API Gateway (Port 3000)             │
│   - NestJS Application                      │
│   - Authentication (JWT)                    │
│   - Rate Limiting                          │
│   - Request Validation                     │
│   - CORS                                    │
└─────────────────┬───────────────────────────┘
                  │
      ┌───────────┴───────────┐
      │                       │
      ▼                       ▼
┌──────────────┐      ┌──────────────┐
│  PostgreSQL  │      │    Redis     │
│  (Primary DB)│      │   (Cache)    │
└──────────────┘      └──────────────┘
```

### 모듈 구조

```
src/
├── main.ts                    # 애플리케이션 진입점
├── app.module.ts              # 루트 모듈 (모든 모듈 통합)
│
├── config/                    # 설정 모듈
│   └── redis.module.ts       # Redis 클라이언트 설정
│
├── common/                    # 공통 유틸리티
│   ├── filters/              # 예외 필터
│   │   └── http-exception.filter.ts
│   ├── interceptors/         # 인터셉터
│   │   ├── logging.interceptor.ts
│   │   └── transform.interceptor.ts
│   ├── guards/               # 인증/인가 가드
│   ├── decorators/           # 커스텀 데코레이터
│   └── dto/                  # 공통 DTO
│
└── modules/                   # 기능 모듈
    ├── auth/                  # 인증 모듈
    ├── users/                 # 사용자 관리
    ├── services/              # 서비스 관리
    ├── bookings/              # 예약 관리
    ├── payments/              # 결제 처리
    ├── reviews/               # 리뷰 시스템
    ├── matching/              # AI 매칭
    ├── trust-score/           # 신뢰 점수
    ├── notifications/         # 알림
    ├── messages/              # 메시징
    ├── disputes/              # 분쟁 해결
    └── health/                # 헬스 체크
```

## 🔧 주요 컴포넌트 분석

### 1. 애플리케이션 진입점 (main.ts)

**위치**: `src/main.ts`

**주요 기능**:
- NestJS 애플리케이션 부트스트랩
- 글로벌 설정 적용:
  - API 프리픽스 설정 (`api/v1`)
  - CORS 설정
  - ValidationPipe (요청 검증)
  - 예외 필터 (HttpExceptionFilter)
  - 인터셉터 (LoggingInterceptor, TransformInterceptor)
- 포트 3000에서 리스닝

**핵심 설정**:
```typescript
- Global Prefix: api/v1
- CORS: ConfigService에서 가져온 origin 허용
- Validation: whitelist, transform 활성화
- Port: ConfigService에서 가져오거나 기본값 3000
```

### 2. 루트 모듈 (app.module.ts)

**위치**: `src/app.module.ts`

**주요 구성**:

1. **ConfigModule**: 환경 변수 관리 (전역)
2. **TypeOrmModule**: PostgreSQL 데이터베이스 연결
   - 엔티티 자동 로드: `__dirname + '/**/*.entity{.ts,.js}'`
   - 동기화 옵션: 환경 변수 제어 (`DB_SYNCHRONIZE`)
3. **RedisModule**: Redis 클라이언트 (전역)
4. **ThrottlerModule**: Rate limiting 설정
5. **기능 모듈들**: 12개의 비즈니스 로직 모듈

### 3. 데이터베이스 설정

**ORM**: TypeORM 0.3.x  
**데이터베이스**: PostgreSQL 15+

**주요 엔티티**:

- **User Entity** (`src/modules/users/entities/user.entity.ts`)
  - UUID 기반 Primary Key
  - 사용자 타입: provider, consumer, both
  - KYC 상태: unverified, pending, verified, rejected
  - 자동 비밀번호 해싱 (bcrypt, cost factor 12)
  - 지갑 잔액, 신뢰 점수, 평점 통계 포함

**데이터베이스 연결**:
- 호스트, 포트, 사용자명, 비밀번호, 데이터베이스명은 환경 변수에서 로드
- 프로덕션 환경에서는 SSL 연결 활성화
- 개발 환경에서는 로깅 활성화

### 4. Redis 설정

**위치**: `src/config/redis.module.ts`

**기능**:
- 전역 Redis 클라이언트 제공
- 환경 변수에서 호스트 및 포트 로드
- 애플리케이션 시작 시 자동 연결

**용도**:
- 캐싱
- 세션 관리 (예상)
- Rate limiting 저장소 (ThrottlerModule과 통합)

### 5. 공통 컴포넌트

#### HttpExceptionFilter
- 모든 예외를 캐치하여 일관된 에러 응답 형식으로 변환
- 로깅 포함

#### LoggingInterceptor
- 모든 요청/응답 로깅
- 요청 시간 측정
- IP, User-Agent 정보 수집

#### TransformInterceptor
- 성공 응답을 일관된 형식으로 변환:
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Success",
    "data": {...},
    "timestamp": "..."
  }
  ```

### 6. 인증 시스템

**전략**: JWT (JSON Web Tokens)  
**모듈**: `src/modules/auth/`

**구성**:
- PassportModule (JWT 전략)
- JwtModule (토큰 생성/검증)
- UsersModule 의존성

**토큰 설정**:
- Secret: 환경 변수에서 로드 (`JWT_SECRET`)
- 만료 시간: 환경 변수 또는 기본값 30일 (`JWT_EXPIRATION`)

## 📦 의존성 분석

### 핵심 의존성

- **@nestjs/common, @nestjs/core**: NestJS 프레임워크
- **@nestjs/typeorm**: TypeORM 통합
- **@nestjs/config**: 환경 변수 관리
- **@nestjs/jwt, @nestjs/passport**: 인증
- **typeorm, pg**: 데이터베이스
- **redis**: 캐시
- **bcrypt**: 비밀번호 해싱
- **class-validator, class-transformer**: DTO 검증
- **@nestjs/throttler**: Rate limiting (추가 필요)

### 개발 의존성

- **TypeScript**: 타입 안전성
- **ts-node-dev**: 개발 서버 (Hot reload)
- **jest**: 테스트 프레임워크
- **eslint**: 코드 품질 검사

## 🔐 보안 기능

1. **비밀번호 해싱**: bcrypt (cost factor 12)
2. **JWT 인증**: 토큰 기반 인증
3. **Rate Limiting**: ThrottlerModule 사용
4. **입력 검증**: class-validator를 통한 DTO 검증
5. **CORS**: 설정 가능한 origin
6. **SQL Injection 방지**: TypeORM 파라미터화 쿼리

## 📡 API 구조

### Base URL

- **개발**: `http://localhost:3000/api/v1`
- **프로덕션**: `https://api.aitrustrade.ph/api/v1`

### 엔드포인트 패턴

모든 엔드포인트는 `/api/v1` 프리픽스를 사용하며, 모듈별로 그룹화됩니다:

- `/api/v1/auth/*` - 인증
- `/api/v1/users/*` - 사용자 관리
- `/api/v1/services/*` - 서비스 관리
- `/api/v1/bookings/*` - 예약
- `/api/v1/payments/*` - 결제
- `/api/v1/reviews/*` - 리뷰
- `/api/v1/health` - 헬스 체크
- 기타 모듈별 엔드포인트

## 🚀 실행 방법

### 개발 모드

```bash
npm run start:dev
```

- TypeScript 파일 직접 실행 (ts-node-dev)
- Hot reload 지원
- 소스맵 생성

### 프로덕션 모드

```bash
npm run build
npm start
```

- TypeScript 컴파일 먼저 수행
- 컴파일된 JavaScript 실행
- `dist/` 디렉토리에 빌드 산출물 생성

### Docker 실행

```bash
docker-compose up -d
```

- PostgreSQL, Redis, API 서버를 함께 실행
- 환경 변수는 `docker-compose.yml`에서 관리

## 🔍 발견된 문제점 및 개선 사항

### 1. 누락된 의존성

**문제**: `app.module.ts`에서 `ThrottlerModule`을 사용하지만 `package.json`에 의존성이 없음

**해결책**: `@nestjs/throttler` 패키지 추가 필요

```json
"@nestjs/throttler": "^5.0.1"
```

### 2. 환경 변수 파일 부재

**문제**: `.env.example` 파일이 없어 설정 가이드가 부족함

**해결책**: `.env.example` 파일 생성 또는 SETUP_GUIDE.md에 환경 변수 템플릿 포함

### 3. 데이터베이스 마이그레이션

**현재 상태**: TypeORM의 `synchronize` 옵션 사용 (개발 환경)

**권장 사항**: 프로덕션 환경에서는 마이그레이션 사용

### 4. 헬스 체크 기능

**현재 상태**: 기본 헬스 체크만 구현 (`/health`)

**개선 제안**: 데이터베이스 및 Redis 연결 상태 확인 추가

## 📝 운영 체크리스트

### 시스템 시작 전

- [ ] Node.js 20+ 설치 확인
- [ ] PostgreSQL 실행 확인
- [ ] Redis 실행 확인
- [ ] `.env` 파일 생성 및 설정
- [ ] `JWT_SECRET` 생성 및 설정
- [ ] 데이터베이스 연결 테스트
- [ ] 의존성 설치 (`npm install`)

### 시작 후 확인

- [ ] 헬스 체크 엔드포인트 동작 확인
- [ ] 로그 출력 정상 여부 확인
- [ ] 데이터베이스 연결 상태 확인
- [ ] Redis 연결 상태 확인

### 프로덕션 배포 전

- [ ] `NODE_ENV=production` 설정
- [ ] `DB_SYNCHRONIZE=false` 설정
- [ ] 강력한 `JWT_SECRET` 설정
- [ ] CORS origin 제한 설정
- [ ] SSL/TLS 인증서 설정
- [ ] 로그 모니터링 설정
- [ ] 백업 전략 수립

## 🔄 향후 개선 방향

1. **테스트 커버리지**: 단위 테스트 및 E2E 테스트 추가
2. **API 문서화**: Swagger/OpenAPI 통합
3. **모니터링**: Prometheus/Grafana 통합
4. **로깅**: Winston 또는 Pino와 같은 전문 로깅 라이브러리
5. **마이그레이션**: TypeORM 마이그레이션 파일 생성
6. **환경별 설정**: 개발/스테이징/프로덕션 환경 분리

## 📚 관련 문서

- **README.md**: 프로젝트 개요 및 기본 가이드
- **SETUP_GUIDE.md**: 상세한 설정 가이드
- **API 문서**: 각 모듈의 컨트롤러 및 서비스 파일 참조

---

**분석 일자**: 2025-01-27  
**분석자**: AI Assistant  
**버전**: 1.0.0

