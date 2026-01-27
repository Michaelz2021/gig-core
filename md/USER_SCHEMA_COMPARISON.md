# Users 테이블 스키마 비교 분석

이 문서는 제공된 SQL 스키마와 현재 프로젝트의 User 엔티티를 비교 분석합니다.

---

## 📊 비교 요약

### ✅ 일치하는 부분
- 기본 필드 (id, email, phone, password_hash, first_name, last_name)
- 날짜 필드 (date_of_birth, created_at, updated_at, deleted_at)
- 상태 관리 (status)
- 인증 플래그 (email_verified, phone_verified)

### ⚠️ 차이점 및 권장사항

---

## 🔍 상세 비교

### 1. 필수 필드 (NOT NULL) 제약조건

#### 제공된 SQL:
```sql
phone_number VARCHAR(20) UNIQUE NOT NULL,
email VARCHAR(255) UNIQUE,
```

#### 현재 프로젝트:
```typescript
@Column({ unique: true })
email: string;  // NOT NULL

@Column({ unique: true })
phone: string;  // nullable
```

**문제점:**
- 제공된 SQL: `phone_number`는 NOT NULL, `email`은 nullable
- 현재 프로젝트: `email`은 NOT NULL, `phone`은 nullable

**권장사항:**
- 두 필드 모두 NOT NULL로 통일하는 것이 좋습니다.
- 현재 프로젝트는 이메일 기반 인증을 사용하므로 `email`을 NOT NULL로 유지하는 것이 맞습니다.
- `phone`도 필수로 만들려면 NOT NULL 제약을 추가해야 합니다.

---

### 2. 주소 정보 위치

#### 제공된 SQL:
```sql
-- 주소가 users 테이블에 직접 포함
address_line1 VARCHAR(255),
address_line2 VARCHAR(255),
city VARCHAR(100),
province VARCHAR(100),
postal_code VARCHAR(20),
country VARCHAR(50) DEFAULT 'Philippines',
```

#### 현재 프로젝트:
```typescript
// 주소 정보는 user_profiles 테이블에 있음
@Entity('user_profiles')
export class UserProfile {
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
  country: string; // 'PH' (국가 코드)
}
```

**분석:**
- 제공된 SQL은 주소를 `users` 테이블에 직접 저장
- 현재 프로젝트는 정규화된 구조로 `user_profiles` 테이블에 저장

**권장사항:**
- ✅ **현재 프로젝트 구조 유지 권장**
- 이유:
  1. 정규화된 데이터베이스 설계
  2. 주소 정보는 선택적이므로 별도 테이블이 적합
  3. 확장성 (향후 여러 주소 저장 가능)
  4. 성능 (주소 정보가 없는 경우 users 테이블이 가벼움)

**제공된 SQL을 사용하려면:**
- 주소 정보를 `users` 테이블에 추가하되, `user_profiles`와의 중복을 피하기 위해
- `user_profiles`의 주소 필드는 제거하거나
- `users`의 주소 필드는 기본 주소만 저장하고 `user_profiles`는 확장 정보로 사용

---

### 3. 위치 정보 (GIS)

#### 제공된 SQL:
```sql
location GEOGRAPHY(POINT, 4326),
```

#### 현재 프로젝트:
```typescript
// user_profiles 테이블에
latitude: number;  // DECIMAL(10, 8)
longitude: number; // DECIMAL(11, 8)
```

**분석:**
- 제공된 SQL: PostGIS의 `GEOGRAPHY(POINT, 4326)` 사용
- 현재 프로젝트: 별도의 `latitude`, `longitude` 컬럼 사용

**권장사항:**
- ✅ **PostGIS 사용 권장** (제공된 SQL 방식)
- 이유:
  1. 공간 쿼리 최적화 (거리 계산, 반경 검색 등)
  2. 인덱싱 효율성 (GIST 인덱스)
  3. 표준 GIS 형식
  4. 복잡한 지리적 쿼리 지원

**마이그레이션 방법:**
```sql
-- PostGIS 확장 활성화
CREATE EXTENSION IF NOT EXISTS postgis;

-- users 테이블에 location 컬럼 추가
ALTER TABLE users ADD COLUMN location GEOGRAPHY(POINT, 4326);

-- 기존 latitude/longitude 데이터 변환
UPDATE users u
SET location = ST_SetSRID(
  ST_MakePoint(up.longitude, up.latitude),
  4326
)::geography
FROM user_profiles up
WHERE u.id = up.user_id
  AND up.latitude IS NOT NULL
  AND up.longitude IS NOT NULL;

-- 인덱스 생성
CREATE INDEX idx_users_location ON users USING GIST(location);
```

---

### 4. 계정 타입 필드명

#### 제공된 SQL:
```sql
account_type VARCHAR(20) CHECK (account_type IN ('consumer', 'provider', 'both')),
```

#### 현재 프로젝트:
```typescript
@Column({
  name: 'user_type',
  type: 'enum',
  enum: UserType,
  default: UserType.CONSUMER,
})
userType: UserType; // 'provider' | 'consumer' | 'both'
```

**분석:**
- 필드명: `account_type` vs `user_type`
- 타입: VARCHAR + CHECK vs ENUM

**권장사항:**
- ✅ **ENUM 타입 사용 권장** (현재 프로젝트 방식)
- 이유:
  1. 타입 안정성
  2. 데이터베이스 레벨 제약
  3. 성능 (인덱싱 효율)
  4. 코드 가독성

**제공된 SQL을 사용하려면:**
```sql
-- ENUM 타입 생성
CREATE TYPE user_type_enum AS ENUM ('consumer', 'provider', 'both');

-- 컬럼 타입 변경
ALTER TABLE users 
  ALTER COLUMN account_type TYPE user_type_enum 
  USING account_type::user_type_enum;

-- 컬럼명 변경 (선택사항)
ALTER TABLE users RENAME COLUMN account_type TO user_type;
```

---

### 5. 상태 (Status) 값

#### 제공된 SQL:
```sql
status VARCHAR(20) DEFAULT 'active' 
CHECK (status IN ('active', 'suspended', 'banned', 'deleted')),
```

#### 현재 프로젝트:
```typescript
export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DEACTIVATED = 'deactivated',  // ⚠️ 차이점
  BANNED = 'banned',
}
```

**분석:**
- 제공된 SQL: `deleted` 상태 포함
- 현재 프로젝트: `deactivated` 상태 사용, `deleted_at`으로 소프트 삭제

**권장사항:**
- ✅ **현재 프로젝트 방식 권장** (소프트 삭제 사용)
- 이유:
  1. `deleted_at`으로 소프트 삭제 구현
  2. `deactivated`는 계정 비활성화, `deleted_at`은 삭제 표시
  3. 데이터 복구 가능

**제공된 SQL을 사용하려면:**
- `deleted`` 상태를 `deleted_at`으로 대체
- 또는 `deleted` 상태를 `deactivated`로 변경

---

### 6. KYC 레벨 타입

#### 제공된 SQL:
```sql
kyc_level INT DEFAULT 0 CHECK (kyc_level BETWEEN 0 AND 3),
kyc_verified_at TIMESTAMP,
```

#### 현재 프로젝트:
```typescript
@Column({
  name: 'kyc_level',
  type: 'enum',
  enum: KYCLevel,
  nullable: true,
})
kycLevel: KYCLevel; // 'basic' | 'intermediate' | 'advanced'

// kyc_verified_at 없음
```

**분석:**
- 제공된 SQL: INT (0-3)
- 현재 프로젝트: ENUM ('basic', 'intermediate', 'advanced')
- 제공된 SQL: `kyc_verified_at` 필드 있음
- 현재 프로젝트: `kyc_verified_at` 필드 없음

**권장사항:**
- ✅ **ENUM + kyc_verified_at 추가 권장**
- 이유:
  1. ENUM이 더 명확하고 타입 안전
  2. `kyc_verified_at`은 KYC 검증 시점 추적에 유용

**매핑:**
```
0 = 'basic' (또는 null)
1 = 'intermediate'
2 = 'advanced'
3 = (추가 레벨, 필요시)
```

---

### 7. 언어 및 타임존

#### 제공된 SQL:
```sql
language_preference VARCHAR(10) DEFAULT 'en',
timezone VARCHAR(50) DEFAULT 'Asia/Manila',
```

#### 현재 프로젝트:
```typescript
// user_profiles 테이블에
preferredLanguage: string; // 'en'
// timezone 없음
```

**분석:**
- 제공된 SQL: `users` 테이블에 직접 저장
- 현재 프로젝트: `user_profiles` 테이블에 저장, `timezone` 없음

**권장사항:**
- ✅ **timezone 필드 추가 권장**
- 위치: `user_profiles` 테이블에 추가 (정규화 구조 유지)

---

### 8. 프로필 사진 URL 타입

#### 제공된 SQL:
```sql
profile_photo_url TEXT,
```

#### 현재 프로젝트:
```typescript
@Column({ name: 'profile_photo_url', nullable: true })
profileImage: string; // VARCHAR(500)
```

**분석:**
- 제공된 SQL: TEXT (무제한)
- 현재 프로젝트: VARCHAR(500)

**권장사항:**
- ✅ **TEXT 사용 권장** (제공된 SQL 방식)
- 이유:
  1. 긴 URL 지원 (S3 presigned URL 등)
  2. 미래 확장성

---

### 9. 인덱스

#### 제공된 SQL:
```sql
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_location ON users USING GIST(location);
CREATE INDEX idx_users_account_type ON users(account_type);
```

#### 현재 프로젝트:
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);
```

**분석:**
- 제공된 SQL: `location`에 GIST 인덱스 (PostGIS)
- 현재 프로젝트: `created_at` 인덱스 추가

**권장사항:**
- ✅ **모든 인덱스 포함 권장**
- `created_at` 인덱스는 정렬/필터링에 유용하므로 유지
- `location` GIST 인덱스는 PostGIS 사용 시 필수

---

## 📝 수정된 권장 SQL 스키마

현재 프로젝트 구조와 제공된 SQL의 장점을 결합한 권장 스키마:

```sql
-- PostGIS 확장 활성화
CREATE EXTENSION IF NOT EXISTS postgis;

-- ENUM 타입 생성
CREATE TYPE user_type_enum AS ENUM ('consumer', 'provider', 'both');
CREATE TYPE user_status_enum AS ENUM ('active', 'suspended', 'deactivated', 'banned');
CREATE TYPE gender_enum AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');
CREATE TYPE kyc_level_enum AS ENUM ('basic', 'intermediate', 'advanced');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 인증 정보
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- 기본 정보
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender gender_enum,
    
    -- 계정 타입
    user_type user_type_enum NOT NULL DEFAULT 'consumer',
    
    -- 상태
    status user_status_enum DEFAULT 'active',
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    is_id_verified BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    
    -- KYC
    kyc_level kyc_level_enum,
    kyc_verified_at TIMESTAMP,
    
    -- 메타데이터
    profile_photo_url TEXT,
    
    -- 위치 (GIS) - PostGIS 사용
    location GEOGRAPHY(POINT, 4326),
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login_at TIMESTAMP,
    
    -- 소프트 삭제
    deleted_at TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_location ON users USING GIST(location);
CREATE INDEX idx_users_created_at ON users(created_at);

-- 주소 정보는 user_profiles 테이블에 유지
-- 언어 및 타임존도 user_profiles에 추가
```

---

## 🔄 마이그레이션 체크리스트

제공된 SQL을 사용하려면 다음을 확인/수정해야 합니다:

- [ ] **PostGIS 확장 설치 확인**
  ```sql
  CREATE EXTENSION IF NOT EXISTS postgis;
  ```

- [ ] **ENUM 타입으로 변경** (VARCHAR + CHECK 대신)
  ```sql
  CREATE TYPE user_type_enum AS ENUM ('consumer', 'provider', 'both');
  CREATE TYPE user_status_enum AS ENUM ('active', 'suspended', 'deactivated', 'banned');
  ```

- [ ] **필드명 통일**
  - `account_type` → `user_type`
  - `phone_number` → `phone` (또는 반대)

- [ ] **주소 정보 위치 결정**
  - `users` 테이블에 직접 저장 vs `user_profiles` 테이블 유지

- [ ] **KYC 레벨 타입 변경**
  - INT → ENUM 또는 ENUM → INT

- [ ] **kyc_verified_at 필드 추가** (현재 프로젝트에 없음)

- [ ] **timezone 필드 추가** (user_profiles 테이블에)

- [ ] **profile_photo_url 타입 변경**
  - VARCHAR(500) → TEXT

- [ ] **location 필드 추가** (PostGIS)
  - 기존 latitude/longitude 데이터 마이그레이션

---

## ✅ 최종 권장사항

1. **PostGIS 사용**: `location GEOGRAPHY(POINT, 4326)` 권장
2. **ENUM 타입 사용**: VARCHAR + CHECK 대신 ENUM 사용
3. **주소 정보 분리 유지**: `user_profiles` 테이블에 유지 (정규화)
4. **timezone 필드 추가**: `user_profiles` 테이블에 추가
5. **kyc_verified_at 추가**: KYC 검증 시점 추적
6. **profile_photo_url을 TEXT로 변경**: 긴 URL 지원
7. **필드명 통일**: `user_type` 사용 (현재 프로젝트와 일치)

---

## 📚 참고

- [PostGIS 공식 문서](https://postgis.net/documentation/)
- [TypeORM 공간 데이터 타입](https://typeorm.io/entities#column-types)
- [PostgreSQL ENUM 타입](https://www.postgresql.org/docs/current/datatype-enum.html)

