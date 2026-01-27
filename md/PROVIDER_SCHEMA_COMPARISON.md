# Providers 테이블 스키마 비교 분석

이 문서는 제공된 SQL 스키마와 현재 프로젝트의 Provider 엔티티를 비교 분석합니다.

---

## 📊 비교 요약

### ✅ 일치하는 부분
- 기본 필드 (id, user_id, years_of_experience, service_radius_km)
- 통계 필드 (total_jobs_completed, completion_rate)
- 상태 필드 (is_active)
- 타임스탬프 (created_at, updated_at)

### ⚠️ 주요 차이점

| 항목 | 제공된 SQL | 현재 프로젝트 | 상태 |
|------|-----------|--------------|------|
| 서비스 카테고리 | `service_categories TEXT[]` | 없음 | ❌ 누락 |
| Bio | `bio TEXT` | 없음 | ❌ 누락 |
| 가격 설정 | `hourly_rate_min/max`, `accepts_fixed_price` | 없음 | ❌ 누락 |
| 가용성 일정 | `available_days[]`, `available_hours_start/end` | 없음 | ❌ 누락 |
| 검증 레벨 | `verification_level INT` | 없음 | ❌ 누락 |
| 검증 배지 | `verification_badges TEXT[]` | 없음 | ❌ 누락 |
| 보험 정보 | `has_insurance`, `insurance_*` | 없음 | ❌ 누락 |
| 총 수익 | `total_earnings DECIMAL` | 없음 | ❌ 누락 |
| 평균 평점 | `average_rating DECIMAL` | 없음 | ❌ 누락 |
| 현재 작업 수 | `current_jobs_count`, `max_concurrent_jobs` | 없음 | ❌ 누락 |
| 가용성 상태 | `is_available BOOLEAN` | 없음 | ❌ 누락 |
| 사업자 정보 | 없음 | `business_name`, `business_type` | ✅ 추가 필드 |
| 인증 정보 | 없음 | `government_id_*`, `tin_number` | ✅ 추가 필드 |
| 자격증 | 없음 | `certifications JSONB` | ✅ 추가 필드 |
| 포트폴리오 | 없음 | `portfolio_photos JSONB` | ✅ 추가 필드 |
| 즉시 예약 | 없음 | `instant_booking_enabled` | ✅ 추가 필드 |
| 응답 시간 | 없음 | `response_time_minutes` | ✅ 추가 필드 |
| 추천 제공자 | 없음 | `is_featured` | ✅ 추가 필드 |

---

## 🔍 상세 비교

### 1. 서비스 카테고리

#### 제공된 SQL:
```sql
service_categories TEXT[], -- Array of categories
```

#### 현재 프로젝트:
```typescript
// 없음
```

**분석:**
- 제공된 SQL: 배열로 여러 카테고리를 저장
- 현재 프로젝트: 카테고리 정보 없음

**권장사항:**
- ✅ **추가 권장** (제공된 SQL 방식)
- 이유:
  1. 제공자가 여러 카테고리의 서비스를 제공할 수 있음
  2. 검색 및 필터링에 필수
  3. GIN 인덱스로 효율적인 배열 검색 가능

**구현 방법:**
```typescript
@Column('text', { array: true, nullable: true })
serviceCategories: string[];
```

```sql
CREATE INDEX idx_providers_categories ON providers USING GIN(service_categories);
```

---

### 2. Bio (자기소개)

#### 제공된 SQL:
```sql
bio TEXT,
```

#### 현재 프로젝트:
```typescript
// 없음 (user_profiles 테이블에 bio가 있을 수 있음)
```

**분석:**
- 제공된 SQL: `providers` 테이블에 직접 저장
- 현재 프로젝트: `user_profiles` 테이블에 `bio`가 있을 수 있음

**권장사항:**
- ✅ **providers 테이블에 추가 권장**
- 이유:
  1. 사용자 프로필의 bio와 서비스 제공자 bio는 다를 수 있음
  2. 서비스 제공자 전용 자기소개 필요
  3. 검색 및 매칭에 활용 가능

---

### 3. 가격 설정

#### 제공된 SQL:
```sql
hourly_rate_min DECIMAL(10,2),
hourly_rate_max DECIMAL(10,2),
accepts_fixed_price BOOLEAN DEFAULT TRUE,
```

#### 현재 프로젝트:
```typescript
// 없음
```

**분석:**
- 제공된 SQL: 시간당 요금 범위와 고정가 수락 여부
- 현재 프로젝트: 가격 정보 없음

**권장사항:**
- ✅ **추가 권장** (제공된 SQL 방식)
- 이유:
  1. 가격 검색 및 필터링에 필수
  2. 예산 기반 매칭 가능
  3. 투명한 가격 정책

**구현 방법:**
```typescript
@Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
hourlyRateMin: number;

@Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
hourlyRateMax: number;

@Column({ default: true })
acceptsFixedPrice: boolean;
```

---

### 4. 가용성 일정

#### 제공된 SQL:
```sql
available_days TEXT[], -- ['monday', 'tuesday', ...]
available_hours_start TIME,
available_hours_end TIME,
```

#### 현재 프로젝트:
```typescript
// 없음
```

**분석:**
- 제공된 SQL: 요일 배열과 시간 범위
- 현재 프로젝트: 가용성 일정 정보 없음

**권장사항:**
- ✅ **추가 권장** (제공된 SQL 방식)
- 이유:
  1. 실시간 가용성 확인
  2. 자동 매칭 시스템에 필수
  3. 사용자 경험 향상

**구현 방법:**
```typescript
@Column('text', { array: true, nullable: true })
availableDays: string[]; // ['monday', 'tuesday', ...]

@Column({ type: 'time', nullable: true })
availableHoursStart: string;

@Column({ type: 'time', nullable: true })
availableHoursEnd: string;
```

**개선 제안:**
- 더 유연한 스케줄링을 위해 별도 `provider_schedules` 테이블 고려
- 주간별 다른 스케줄 지원
- 공휴일 처리

---

### 5. 검증 레벨 및 배지

#### 제공된 SQL:
```sql
verification_level INT DEFAULT 0 CHECK (verification_level BETWEEN 0 AND 3),
verification_badges TEXT[], -- ['tesda_certified', 'background_checked', etc.]
```

#### 현재 프로젝트:
```typescript
// 없음
// certifications JSONB는 있지만 검증 레벨/배지는 없음
```

**분석:**
- 제공된 SQL: 검증 레벨(0-3)과 검증 배지 배열
- 현재 프로젝트: 자격증은 있지만 검증 레벨/배지 없음

**권장사항:**
- ✅ **추가 권장** (제공된 SQL 방식)
- 이유:
  1. 신뢰도 표시
  2. 검증된 제공자 우선 노출
  3. 사용자 신뢰 향상

**구현 방법:**
```typescript
@Column({ default: 0 })
verificationLevel: number; // 0-3

@Column('text', { array: true, nullable: true })
verificationBadges: string[]; // ['tesda_certified', 'background_checked', ...]
```

**검증 레벨 정의:**
```
0 = 미검증
1 = 기본 검증 (신분증 확인)
2 = 중급 검증 (신분증 + 배경 조사)
3 = 고급 검증 (신분증 + 배경 조사 + 전문 자격증)
```

---

### 6. 보험 정보

#### 제공된 SQL:
```sql
has_insurance BOOLEAN DEFAULT FALSE,
insurance_provider VARCHAR(100),
insurance_policy_number VARCHAR(100),
insurance_expiry_date DATE,
```

#### 현재 프로젝트:
```typescript
// 없음
```

**분석:**
- 제공된 SQL: 보험 정보 저장
- 현재 프로젝트: 보험 정보 없음

**권장사항:**
- ✅ **추가 권장** (제공된 SQL 방식)
- 이유:
  1. 서비스 제공 시 책임 보험 필수
  2. 고객 신뢰도 향상
  3. 법적 요구사항 충족

**구현 방법:**
```typescript
@Column({ default: false })
hasInsurance: boolean;

@Column({ nullable: true })
insuranceProvider: string;

@Column({ nullable: true })
insurancePolicyNumber: string;

@Column({ type: 'date', nullable: true })
insuranceExpiryDate: Date;
```

**보안 고려사항:**
- `insurance_policy_number`는 암호화 저장 권장

---

### 7. 총 수익 및 평균 평점

#### 제공된 SQL:
```sql
total_earnings DECIMAL(12,2) DEFAULT 0,
average_rating DECIMAL(3,2) DEFAULT 0,
```

#### 현재 프로젝트:
```typescript
// 없음
```

**분석:**
- 제공된 SQL: 캐시된 통계 정보
- 현재 프로젝트: 통계 정보 없음

**권장사항:**
- ✅ **추가 권장** (제공된 SQL 방식)
- 이유:
  1. 성능 최적화 (매번 계산하지 않음)
  2. 대시보드 및 리포팅에 유용
  3. 정렬 및 필터링에 활용

**구현 방법:**
```typescript
@Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
totalEarnings: number;

@Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
averageRating: number;
```

**주의사항:**
- 정기적으로 실제 데이터와 동기화 필요
- 트리거 또는 스케줄러로 자동 업데이트 권장

---

### 8. 현재 작업 수 및 최대 동시 작업

#### 제공된 SQL:
```sql
current_jobs_count INT DEFAULT 0,
max_concurrent_jobs INT DEFAULT 3,
```

#### 현재 프로젝트:
```typescript
// 없음
```

**분석:**
- 제공된 SQL: 동시 작업 관리
- 현재 프로젝트: 작업 수 관리 없음

**권장사항:**
- ✅ **추가 권장** (제공된 SQL 방식)
- 이유:
  1. 제공자 용량 관리
  2. 자동 매칭 시스템에 필수
  3. 서비스 품질 보장

**구현 방법:**
```typescript
@Column({ default: 0 })
currentJobsCount: number;

@Column({ default: 3 })
maxConcurrentJobs: number;
```

**로직:**
- 새 작업 수락 시 `current_jobs_count` 증가
- 작업 완료 시 감소
- `current_jobs_count >= max_concurrent_jobs`이면 새 작업 수락 불가

---

### 9. 가용성 상태

#### 제공된 SQL:
```sql
is_available BOOLEAN DEFAULT TRUE,
```

#### 현재 프로젝트:
```typescript
// 없음
```

**분석:**
- 제공된 SQL: 실시간 가용성 플래그
- 현재 프로젝트: `is_active`만 있음 (계정 활성화 여부)

**권장사항:**
- ✅ **추가 권장** (제공된 SQL 방식)
- 이유:
  1. `is_active`: 계정 활성화 여부 (장기)
  2. `is_available`: 현재 서비스 가능 여부 (단기)
  3. 휴가, 일시적 부재 등 처리

**구현 방법:**
```typescript
@Column({ default: true })
isAvailable: boolean;
```

**사용 시나리오:**
- `is_active = false`: 계정 정지/삭제
- `is_available = false`: 일시적 휴무 (휴가, 개인 사정)

---

### 10. 현재 프로젝트에만 있는 필드

#### 사업자 정보
```typescript
businessName: string;
businessType: BusinessType; // 'individual' | 'company'
```

**권장사항:**
- ✅ **유지 권장**
- 이유: 법인 제공자 지원, 세금 처리

#### 인증 정보
```typescript
governmentIdType: string;
governmentIdNumber: string;
tinNumber: string;
```

**권장사항:**
- ✅ **유지 권장**
- 이유: KYC/AML 요구사항, 세금 신고

#### 자격증 및 포트폴리오
```typescript
certifications: Array<{...}>; // JSONB
portfolioPhotos: Array<{...}>; // JSONB
```

**권장사항:**
- ✅ **유지 권장**
- 이유: 신뢰도 향상, 서비스 품질 증명

#### 즉시 예약
```typescript
instantBookingEnabled: boolean;
```

**권장사항:**
- ✅ **유지 권장**
- 이유: 사용자 경험 향상

#### 응답 시간
```typescript
responseTimeMinutes: number;
```

**권장사항:**
- ✅ **유지 권장**
- 이유: 서비스 품질 지표

#### 추천 제공자
```typescript
isFeatured: boolean;
```

**권장사항:**
- ✅ **유지 권장**
- 이유: 우수 제공자 강조

---

## 📝 통합된 권장 SQL 스키마

제공된 SQL과 현재 프로젝트의 장점을 결합한 권장 스키마:

```sql
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- 사업자 정보 (현재 프로젝트)
    business_name VARCHAR(255),
    business_type business_type_enum DEFAULT 'individual',
    
    -- 서비스 정보
    service_categories TEXT[], -- Array of categories (제공된 SQL)
    bio TEXT, -- 제공된 SQL
    years_of_experience INT,
    
    -- 가격 설정 (제공된 SQL)
    hourly_rate_min DECIMAL(10,2),
    hourly_rate_max DECIMAL(10,2),
    accepts_fixed_price BOOLEAN DEFAULT TRUE,
    
    -- 가용성 (제공된 SQL + 현재 프로젝트)
    available_days TEXT[], -- ['monday', 'tuesday', ...]
    available_hours_start TIME,
    available_hours_end TIME,
    service_radius_km INT DEFAULT 10,
    instant_booking_enabled BOOLEAN DEFAULT FALSE, -- 현재 프로젝트
    
    -- 검증 정보 (제공된 SQL + 현재 프로젝트)
    verification_level INT DEFAULT 0 CHECK (verification_level BETWEEN 0 AND 3),
    verification_badges TEXT[], -- ['tesda_certified', 'background_checked', etc.]
    government_id_type VARCHAR(50), -- 현재 프로젝트
    government_id_number VARCHAR(100), -- 현재 프로젝트 (암호화 권장)
    tin_number VARCHAR(50), -- 현재 프로젝트 (암호화 권장)
    certifications JSONB, -- 현재 프로젝트
    portfolio_photos JSONB, -- 현재 프로젝트
    
    -- 보험 (제공된 SQL)
    has_insurance BOOLEAN DEFAULT FALSE,
    insurance_provider VARCHAR(100),
    insurance_policy_number VARCHAR(100), -- 암호화 권장
    insurance_expiry_date DATE,
    
    -- 통계 (캐시용) (제공된 SQL + 현재 프로젝트)
    total_jobs_completed INT DEFAULT 0,
    total_earnings DECIMAL(12,2) DEFAULT 0, -- 제공된 SQL
    average_rating DECIMAL(3,2) DEFAULT 0, -- 제공된 SQL
    completion_rate DECIMAL(5,2) DEFAULT 0,
    response_time_minutes INT DEFAULT 0, -- 현재 프로젝트
    
    -- 상태 (제공된 SQL + 현재 프로젝트)
    is_active BOOLEAN DEFAULT TRUE,
    is_available BOOLEAN DEFAULT TRUE, -- 제공된 SQL
    is_featured BOOLEAN DEFAULT FALSE, -- 현재 프로젝트
    current_jobs_count INT DEFAULT 0, -- 제공된 SQL
    max_concurrent_jobs INT DEFAULT 3, -- 제공된 SQL
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_providers_user ON providers(user_id);
CREATE INDEX idx_providers_categories ON providers USING GIN(service_categories);
CREATE INDEX idx_providers_verification_level ON providers(verification_level);
CREATE INDEX idx_providers_active ON providers(is_active, is_available);
CREATE INDEX idx_providers_featured ON providers(is_featured); -- 현재 프로젝트
CREATE INDEX idx_providers_location ON providers(service_radius_km); -- 위치 기반 검색
```

---

## 🔄 마이그레이션 체크리스트

제공된 SQL을 적용하려면 다음을 추가해야 합니다:

- [ ] **서비스 카테고리 필드 추가**
  ```sql
  ALTER TABLE providers ADD COLUMN service_categories TEXT[];
  CREATE INDEX idx_providers_categories ON providers USING GIN(service_categories);
  ```

- [ ] **Bio 필드 추가**
  ```sql
  ALTER TABLE providers ADD COLUMN bio TEXT;
  ```

- [ ] **가격 설정 필드 추가**
  ```sql
  ALTER TABLE providers ADD COLUMN hourly_rate_min DECIMAL(10,2);
  ALTER TABLE providers ADD COLUMN hourly_rate_max DECIMAL(10,2);
  ALTER TABLE providers ADD COLUMN accepts_fixed_price BOOLEAN DEFAULT TRUE;
  ```

- [ ] **가용성 일정 필드 추가**
  ```sql
  ALTER TABLE providers ADD COLUMN available_days TEXT[];
  ALTER TABLE providers ADD COLUMN available_hours_start TIME;
  ALTER TABLE providers ADD COLUMN available_hours_end TIME;
  ```

- [ ] **검증 레벨 및 배지 필드 추가**
  ```sql
  ALTER TABLE providers ADD COLUMN verification_level INT DEFAULT 0;
  ALTER TABLE providers ADD CONSTRAINT check_verification_level 
    CHECK (verification_level BETWEEN 0 AND 3);
  ALTER TABLE providers ADD COLUMN verification_badges TEXT[];
  CREATE INDEX idx_providers_verification_level ON providers(verification_level);
  ```

- [ ] **보험 정보 필드 추가**
  ```sql
  ALTER TABLE providers ADD COLUMN has_insurance BOOLEAN DEFAULT FALSE;
  ALTER TABLE providers ADD COLUMN insurance_provider VARCHAR(100);
  ALTER TABLE providers ADD COLUMN insurance_policy_number VARCHAR(100);
  ALTER TABLE providers ADD COLUMN insurance_expiry_date DATE;
  ```

- [ ] **통계 필드 추가**
  ```sql
  ALTER TABLE providers ADD COLUMN total_earnings DECIMAL(12,2) DEFAULT 0;
  ALTER TABLE providers ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0;
  ```

- [ ] **작업 관리 필드 추가**
  ```sql
  ALTER TABLE providers ADD COLUMN current_jobs_count INT DEFAULT 0;
  ALTER TABLE providers ADD COLUMN max_concurrent_jobs INT DEFAULT 3;
  ```

- [ ] **가용성 상태 필드 추가**
  ```sql
  ALTER TABLE providers ADD COLUMN is_available BOOLEAN DEFAULT TRUE;
  CREATE INDEX idx_providers_active ON providers(is_active, is_available);
  ```

---

## ✅ 최종 권장사항

### 필수 추가 필드 (제공된 SQL)
1. ✅ `service_categories TEXT[]` - 서비스 카테고리
2. ✅ `bio TEXT` - 자기소개
3. ✅ `hourly_rate_min/max`, `accepts_fixed_price` - 가격 설정
4. ✅ `available_days[]`, `available_hours_start/end` - 가용성 일정
5. ✅ `verification_level`, `verification_badges[]` - 검증 정보
6. ✅ `has_insurance`, `insurance_*` - 보험 정보
7. ✅ `total_earnings`, `average_rating` - 통계
8. ✅ `current_jobs_count`, `max_concurrent_jobs` - 작업 관리
9. ✅ `is_available` - 가용성 상태

### 유지할 현재 프로젝트 필드
1. ✅ `business_name`, `business_type` - 사업자 정보
2. ✅ `government_id_*`, `tin_number` - 인증 정보
3. ✅ `certifications`, `portfolio_photos` - 자격증 및 포트폴리오
4. ✅ `instant_booking_enabled` - 즉시 예약
5. ✅ `response_time_minutes` - 응답 시간
6. ✅ `is_featured` - 추천 제공자

### 보안 고려사항
- `government_id_number`, `tin_number`, `insurance_policy_number`는 암호화 저장 권장
- 민감 정보 접근 로깅
- GDPR/개인정보보호법 준수

---

## 📚 참고

- [PostgreSQL 배열 타입](https://www.postgresql.org/docs/current/arrays.html)
- [PostgreSQL GIN 인덱스](https://www.postgresql.org/docs/current/gin.html)
- [TypeORM 배열 컬럼](https://typeorm.io/entities#column-types)

