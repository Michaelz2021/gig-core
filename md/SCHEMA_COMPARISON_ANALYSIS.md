# 데이터베이스 스키마 비교 분석

이 문서는 `md/02_Database_Schema.md`에 정의된 스키마와 현재 PostgreSQL 스키마(`ai_trusttrade_postgresql_schema.sql`)를 비교 분석합니다.

---

## 📊 전체 비교 요약

### ✅ 현재 스키마에 있는 테이블
- `users`, `user_profiles`, `providers`
- `trust_scores`, `trust_score_history`
- `service_categories`, `services`
- `bookings`, `transactions`, `escrows`
- `wallets`, `wallet_transactions`
- `reviews`, `disputes`, `dispute_messages`
- `conversations`, `messages`
- `notifications`
- `insurance_policies`, `insurance_claims`
- `loan_applications`, `loans`, `loan_payments`
- `activity_logs`, `system_settings`

### ❌ 문서에만 있는 테이블 (현재 스키마에 없음)
- `verifications` - AI 기반 검증 시스템
- `skill_tests` - 스킬 테스트
- `jobs` - 옥션 기반 작업 요청
- `bids` - 입찰 시스템
- `contracts` - 스마트 컨트랙트 (블록체인)
- `job_completions` - AI 기반 작업 완료 검증
- `reward_credits` - 리워드 크레딧 시스템

### ⚠️ 구조가 다른 테이블
- `users` - 주소 정보 위치, location 필드, 필드명 차이
- `providers` - 많은 필드 누락
- `trust_scores` - 점수 구성 요소 차이
- `reviews` - AI 분석 필드 누락
- `disputes` - 구조 차이

---

## 🔍 상세 비교

### 1. Users 테이블

#### 문서 스키마:
```sql
CREATE TABLE users (
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    -- 주소가 users 테이블에 직접 포함
    address_line1, address_line2, city, province, postal_code, country
    -- PostGIS location
    location GEOGRAPHY(POINT, 4326),
    -- account_type (VARCHAR + CHECK)
    account_type VARCHAR(20) CHECK (account_type IN ('consumer', 'provider', 'both')),
    -- status (VARCHAR + CHECK)
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned', 'deleted')),
    -- KYC
    kyc_level INT DEFAULT 0 CHECK (kyc_level BETWEEN 0 AND 3),
    kyc_verified_at TIMESTAMP,
    -- 메타데이터
    language_preference VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'Asia/Manila',
);
```

#### 현재 스키마:
```sql
CREATE TABLE users (
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,  -- nullable
    -- 주소는 user_profiles 테이블에 분리
    -- location 없음 (user_profiles에 latitude/longitude만)
    -- user_type (ENUM)
    user_type user_type_enum NOT NULL,
    -- status (ENUM)
    status user_status_enum DEFAULT 'active',
    -- KYC
    kyc_level kyc_level_enum DEFAULT 'basic',  -- ENUM
    -- kyc_verified_at 없음
    -- language_preference, timezone 없음 (user_profiles에 preferred_language만)
);
```

**주요 차이점:**
1. ❌ **주소 정보 위치**: 문서는 `users`에 직접, 현재는 `user_profiles`에 분리
2. ❌ **PostGIS location**: 문서는 `GEOGRAPHY(POINT, 4326)`, 현재는 `latitude/longitude` (DECIMAL)
3. ⚠️ **필드명**: `phone_number` vs `phone`, `account_type` vs `user_type`
4. ⚠️ **타입**: `VARCHAR + CHECK` vs `ENUM`
5. ❌ **kyc_verified_at**: 문서에만 있음
6. ❌ **language_preference, timezone**: 문서는 `users`에, 현재는 `user_profiles`에 `preferred_language`만

**권장사항:**
- PostGIS `location` 필드 추가 권장 (공간 쿼리 최적화)
- `kyc_verified_at` 필드 추가
- `timezone` 필드 추가 (user_profiles에)

---

### 2. Providers 테이블

#### 문서 스키마:
```sql
CREATE TABLE providers (
    -- 서비스 정보
    service_categories TEXT[],  -- ⚠️ 중요
    bio TEXT,
    years_of_experience INT,
    
    -- 가격 설정
    hourly_rate_min DECIMAL(10,2),
    hourly_rate_max DECIMAL(10,2),
    accepts_fixed_price BOOLEAN DEFAULT TRUE,
    
    -- 가용성
    available_days TEXT[],
    available_hours_start TIME,
    available_hours_end TIME,
    service_radius_km INT DEFAULT 10,
    
    -- 검증 정보
    verification_level INT DEFAULT 0 CHECK (verification_level BETWEEN 0 AND 3),
    verification_badges TEXT[],
    
    -- 보험
    has_insurance BOOLEAN DEFAULT FALSE,
    insurance_provider VARCHAR(100),
    insurance_policy_number VARCHAR(100),
    insurance_expiry_date DATE,
    
    -- 통계
    total_jobs_completed INT DEFAULT 0,
    total_earnings DECIMAL(12,2) DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0,
    
    -- 상태
    is_active BOOLEAN DEFAULT TRUE,
    is_available BOOLEAN DEFAULT TRUE,  -- ⚠️ 중요
    current_jobs_count INT DEFAULT 0,
    max_concurrent_jobs INT DEFAULT 3,
);
```

#### 현재 스키마:
```sql
CREATE TABLE providers (
    -- 사업자 정보 (문서에 없음)
    business_name VARCHAR(255),
    business_type business_type_enum DEFAULT 'individual',
    
    -- 인증 정보 (문서에 없음)
    government_id_type VARCHAR(50),
    government_id_number VARCHAR(100),
    tin_number VARCHAR(50),
    
    -- 서비스 정보
    years_of_experience INT,  -- ✅ 일치
    certifications JSONB,  -- 문서에 없음
    portfolio_photos JSONB,  -- 문서에 없음
    
    -- 가용성
    instant_booking_enabled BOOLEAN DEFAULT FALSE,  -- 문서에 없음
    service_radius_km INT DEFAULT 10,  -- ✅ 일치
    
    -- 통계
    response_time_minutes INT DEFAULT 0,  -- 문서에 없음
    completion_rate DECIMAL(5,2) DEFAULT 0.00,  -- ✅ 일치
    total_jobs_completed INT DEFAULT 0,  -- ✅ 일치
    
    -- 상태
    is_active BOOLEAN DEFAULT TRUE,  -- ✅ 일치
    is_featured BOOLEAN DEFAULT FALSE,  -- 문서에 없음
);
```

**주요 차이점:**
1. ❌ **service_categories**: 문서에만 있음 (중요!)
2. ❌ **bio**: 문서에만 있음
3. ❌ **가격 설정**: `hourly_rate_min/max`, `accepts_fixed_price` 문서에만 있음
4. ❌ **가용성 일정**: `available_days[]`, `available_hours_start/end` 문서에만 있음
5. ❌ **검증 정보**: `verification_level`, `verification_badges[]` 문서에만 있음
6. ❌ **보험 정보**: `has_insurance`, `insurance_*` 문서에만 있음
7. ❌ **통계**: `total_earnings`, `average_rating` 문서에만 있음
8. ❌ **작업 관리**: `is_available`, `current_jobs_count`, `max_concurrent_jobs` 문서에만 있음
9. ✅ **현재 스키마만 있는 필드**: `business_name`, `business_type`, `government_id_*`, `tin_number`, `certifications`, `portfolio_photos`, `instant_booking_enabled`, `response_time_minutes`, `is_featured`

**권장사항:**
- 문서의 모든 필드 추가 권장 (특히 `service_categories`, `is_available`, 가용성 일정)
- 현재 스키마의 필드도 유지 (사업자 정보, 인증 정보 등)

---

### 3. Verifications 테이블

#### 문서 스키마:
```sql
CREATE TABLE verifications (
    user_id UUID REFERENCES users(id),
    verification_type VARCHAR(50) NOT NULL CHECK (...),
    sub_type VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending' CHECK (...),
    document_url TEXT,
    document_number VARCHAR(100),
    issuing_authority VARCHAR(100),
    issue_date DATE,
    expiry_date DATE,
    -- AI 분석 결과
    ai_confidence_score DECIMAL(5,2),
    ai_analysis_result JSONB,
    ai_fraud_score DECIMAL(5,2),
    -- 검증자 정보
    verified_by_type VARCHAR(20) CHECK (...),
    verified_by_user_id UUID,
    verified_at TIMESTAMP,
    rejection_reason TEXT,
    requires_reverification BOOLEAN DEFAULT FALSE,
    reverification_due_date DATE,
    metadata JSONB,
);
```

#### 현재 스키마:
❌ **테이블 없음**

**권장사항:**
- ✅ **테이블 생성 필수** (AI 기반 검증 시스템의 핵심)
- 문서 스키마 그대로 구현 권장

---

### 4. Trust_Scores 테이블

#### 문서 스키마:
```sql
CREATE TABLE trust_scores (
    user_id UUID UNIQUE REFERENCES users(id),
    current_score INT NOT NULL CHECK (current_score BETWEEN 0 AND 1000),
    -- 세부 점수 (각 컴포넌트)
    completion_rate_score INT DEFAULT 0,  -- 0-400
    response_time_score INT DEFAULT 0,     -- 0-200
    rating_score INT DEFAULT 0,            -- 0-200
    dispute_score INT DEFAULT 0,           -- 0-100
    transaction_volume_score INT DEFAULT 0, -- 0-100
    -- 레벨
    level INT DEFAULT 0 CHECK (level BETWEEN 0 AND 3),
    -- 통계
    total_jobs INT DEFAULT 0,
    completed_jobs INT DEFAULT 0,
    cancelled_jobs INT DEFAULT 0,
    avg_response_time_minutes DECIMAL(10,2),
    avg_rating DECIMAL(3,2),
    total_disputes INT DEFAULT 0,
    disputes_resolved_favorably INT DEFAULT 0,
    -- 시간 가중 통계
    last_30days_jobs INT DEFAULT 0,
    last_30days_rating DECIMAL(3,2),
    last_90days_jobs INT DEFAULT 0,
    -- 계산 정보
    calculated_at TIMESTAMP DEFAULT NOW(),
    calculation_method VARCHAR(50) DEFAULT 'ml_model_v1',
);
```

#### 현재 스키마:
```sql
CREATE TABLE trust_scores (
    user_id UUID UNIQUE NOT NULL,
    current_score INT DEFAULT 0,
    score_category score_category_enum,  -- 문서에 없음 (함수로 계산)
    -- 점수 구성 요소 (다름)
    on_time_completion_score INT DEFAULT 0,
    quality_rating_score INT DEFAULT 0,
    response_time_score INT DEFAULT 0,  -- ✅ 일치
    verification_score INT DEFAULT 0,  -- 문서에 없음
    transaction_volume_score INT DEFAULT 0,  -- ✅ 일치
    -- 통계 (다름)
    total_transactions INT DEFAULT 0,
    successful_transactions INT DEFAULT 0,
    disputed_transactions INT DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    -- 계산 정보
    last_calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- calculation_method 없음
);
```

**주요 차이점:**
1. ⚠️ **점수 구성 요소**: 문서는 `completion_rate_score`, `rating_score`, `dispute_score`, 현재는 `on_time_completion_score`, `quality_rating_score`, `verification_score`
2. ⚠️ **통계 필드**: 문서는 `total_jobs`, `completed_jobs`, `cancelled_jobs`, 현재는 `total_transactions`, `successful_transactions`, `disputed_transactions`
3. ❌ **시간 가중 통계**: `last_30days_jobs`, `last_30days_rating`, `last_90days_jobs` 문서에만 있음
4. ❌ **calculation_method**: 문서에만 있음
5. ✅ **score_category**: 현재 스키마에만 있음 (함수로 자동 계산)

**권장사항:**
- 점수 구성 요소 통일 필요
- 시간 가중 통계 필드 추가
- `calculation_method` 필드 추가

---

### 5. Jobs 테이블 (옥션 시스템)

#### 문서 스키마:
```sql
CREATE TABLE jobs (
    customer_id UUID REFERENCES users(id),
    category VARCHAR(100) NOT NULL,
    sub_category VARCHAR(100),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    -- 위치
    location GEOGRAPHY(POINT, 4326),
    address_line1, city, province,
    -- 일정
    preferred_date DATE,
    preferred_time TIME,
    urgency VARCHAR(20) CHECK (...),
    estimated_duration_hours DECIMAL(5,2),
    -- 가격
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    ai_estimated_price DECIMAL(10,2),
    ai_price_confidence DECIMAL(5,2),
    -- 옥션
    is_auction BOOLEAN DEFAULT TRUE,
    auction_deadline TIMESTAMP,
    minimum_provider_level INT DEFAULT 1,
    minimum_trust_score INT DEFAULT 400,
    -- 요구사항
    requirements TEXT[],
    skills_required TEXT[],
    tools_provided_by_customer BOOLEAN DEFAULT FALSE,
    -- 상태
    status VARCHAR(20) DEFAULT 'open' CHECK (...),
    -- 선택된 제공자
    selected_provider_id UUID REFERENCES providers(id),
    selected_bid_id UUID,
    selection_reason TEXT,
    -- 보험
    insurance_required BOOLEAN DEFAULT FALSE,
    insurance_coverage_amount DECIMAL(10,2),
    -- AI 매칭
    ai_recommended_providers UUID[],
    ai_match_scores JSONB,
);
```

#### 현재 스키마:
❌ **테이블 없음** (대신 `bookings` 테이블 사용)

**비교:**
- `bookings`: 직접 예약 시스템 (서비스 선택 후 즉시 예약)
- `jobs`: 옥션 시스템 (여러 제공자가 입찰)

**권장사항:**
- ✅ **옥션 시스템 구현 시 테이블 생성 필수**
- 문서 스키마 그대로 구현 권장

---

### 6. Bids 테이블

#### 문서 스키마:
```sql
CREATE TABLE bids (
    job_id UUID REFERENCES jobs(id),
    provider_id UUID REFERENCES providers(id),
    bid_amount DECIMAL(10,2) NOT NULL,
    proposed_date DATE,
    proposed_time TIME,
    estimated_duration_hours DECIMAL(5,2),
    proposal_text TEXT,
    portfolio_attachments TEXT[],
    includes_materials BOOLEAN DEFAULT FALSE,
    materials_cost DECIMAL(10,2),
    warranty_offered VARCHAR(255),
    reward_credits_spent INT DEFAULT 1,
    status VARCHAR(20) DEFAULT 'pending' CHECK (...),
    -- AI 분석
    ai_quality_score INT,
    ai_spam_score DECIMAL(5,2),
);
```

#### 현재 스키마:
❌ **테이블 없음**

**권장사항:**
- ✅ **옥션 시스템 구현 시 테이블 생성 필수**

---

### 7. Contracts 테이블 (스마트 컨트랙트)

#### 문서 스키마:
```sql
CREATE TABLE contracts (
    job_id UUID UNIQUE REFERENCES jobs(id),
    customer_id UUID REFERENCES users(id),
    provider_id UUID REFERENCES users(id),
    service_description TEXT NOT NULL,
    scope_of_work TEXT NOT NULL,
    deliverables TEXT[] NOT NULL,
    service_amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL,
    insurance_premium DECIMAL(10,2),
    total_amount DECIMAL(10,2) NOT NULL,
    start_date DATE,
    start_time TIME,
    estimated_completion_time TIMESTAMP,
    completion_criteria TEXT NOT NULL,
    requires_customer_approval BOOLEAN DEFAULT TRUE,
    auto_release_hours INT DEFAULT 48,
    cancellation_policy JSONB NOT NULL,
    dispute_resolution_terms TEXT NOT NULL,
    -- 서명
    customer_signed BOOLEAN DEFAULT FALSE,
    customer_signature_hash VARCHAR(255),
    customer_signed_at TIMESTAMP,
    provider_signed BOOLEAN DEFAULT FALSE,
    provider_signature_hash VARCHAR(255),
    provider_signed_at TIMESTAMP,
    -- 블록체인
    blockchain_hash VARCHAR(255),
    blockchain_network VARCHAR(50) DEFAULT 'polygon',
    blockchain_recorded_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'draft' CHECK (...),
    -- AI 생성
    ai_generated BOOLEAN DEFAULT TRUE,
    ai_template_version VARCHAR(50),
    -- 수정
    amendments JSONB[],
    amendment_count INT DEFAULT 0,
);
```

#### 현재 스키마:
❌ **테이블 없음**

**권장사항:**
- ✅ **스마트 컨트랙트 기능 구현 시 테이블 생성 필수**
- 블록체인 통합 고려

---

### 8. Transactions 테이블

#### 문서 스키마:
```sql
CREATE TABLE transactions (
    contract_id UUID REFERENCES contracts(id),
    job_id UUID REFERENCES jobs(id),
    payer_id UUID REFERENCES users(id),
    payee_id UUID REFERENCES users(id),
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'PHP',
    transaction_type VARCHAR(50) CHECK (...),
    payment_method VARCHAR(50) CHECK (...),
    payment_provider VARCHAR(100),
    payment_reference VARCHAR(255),
    payment_gateway_transaction_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (...),
    -- 에스크로
    escrow_held_until TIMESTAMP,
    escrow_released_at TIMESTAMP,
    auto_release_enabled BOOLEAN DEFAULT TRUE,
    -- 블록체인 기록
    blockchain_hash VARCHAR(255),
    blockchain_recorded BOOLEAN DEFAULT FALSE,
    -- 에러 처리
    error_code VARCHAR(50),
    error_message TEXT,
    retry_count INT DEFAULT 0,
    metadata JSONB,
);
```

#### 현재 스키마:
```sql
CREATE TABLE transactions (
    transaction_number VARCHAR(50) UNIQUE NOT NULL,  -- 문서에 없음
    booking_id UUID UNIQUE NOT NULL,  -- 문서는 job_id
    consumer_id UUID NOT NULL,  -- 문서는 payer_id
    provider_id UUID NOT NULL,  -- 문서는 payee_id
    amount DECIMAL(10,2) NOT NULL,  -- 문서는 DECIMAL(12,2)
    platform_fee DECIMAL(10,2) NOT NULL,  -- 문서에 없음
    provider_amount DECIMAL(10,2) NOT NULL,  -- 문서에 없음
    currency VARCHAR(3) DEFAULT 'PHP',  -- ✅ 일치
    status transaction_status_enum NOT NULL DEFAULT 'pending',  -- ✅ 일치
    payment_method payment_method_enum NOT NULL,  -- ✅ 일치
    payment_gateway VARCHAR(50),  -- 문서는 payment_provider
    payment_intent_id VARCHAR(255),  -- 문서는 payment_gateway_transaction_id
    -- 에스크로
    escrow_held_at TIMESTAMP NULL,  -- 문서는 escrow_held_until
    escrow_released_at TIMESTAMP NULL,  -- ✅ 일치
    auto_release_date TIMESTAMP,  -- 문서는 auto_release_enabled (BOOLEAN)
    -- 블록체인 기록 없음
    -- 에러 처리 없음
    -- metadata 없음
);
```

**주요 차이점:**
1. ⚠️ **참조**: 문서는 `contract_id`, `job_id`, 현재는 `booking_id`
2. ⚠️ **필드명**: `payer_id/payee_id` vs `consumer_id/provider_id`
3. ⚠️ **에스크로**: 문서는 `escrow_held_until`, `auto_release_enabled`, 현재는 `escrow_held_at`, `auto_release_date`
4. ❌ **블록체인 기록**: 문서에만 있음
5. ❌ **에러 처리**: 문서에만 있음
6. ❌ **metadata**: 문서에만 있음

**권장사항:**
- 블록체인 기록 필드 추가 (선택사항)
- 에러 처리 필드 추가
- `metadata` 필드 추가

---

### 9. Job_Completions 테이블

#### 문서 스키마:
```sql
CREATE TABLE job_completions (
    job_id UUID UNIQUE REFERENCES jobs(id),
    contract_id UUID REFERENCES contracts(id),
    provider_id UUID REFERENCES users(id),
    completion_notes TEXT,
    -- 사진 증거
    photos_before TEXT[] NOT NULL,
    photos_after TEXT[] NOT NULL,
    -- AI 검증
    ai_verification_status VARCHAR(20) CHECK (...),
    ai_confidence_score DECIMAL(5,2),
    ai_quality_score INT,
    ai_analysis_result JSONB,
    -- 품질 평가
    image_quality_passed BOOLEAN,
    comparison_analysis JSONB,
    metadata_verification_passed BOOLEAN,
    fraud_check_passed BOOLEAN,
    scope_verification_passed BOOLEAN,
    -- 고객 확인
    customer_approved BOOLEAN,
    customer_approval_date TIMESTAMP,
    customer_comments TEXT,
    -- 수동 리뷰
    requires_manual_review BOOLEAN DEFAULT FALSE,
    manual_reviewer_id UUID REFERENCES users(id),
    manual_review_notes TEXT,
    manual_review_completed_at TIMESTAMP,
    -- 완료 시간
    actual_start_time TIMESTAMP,
    actual_end_time TIMESTAMP,
    actual_duration_minutes INT,
);
```

#### 현재 스키마:
❌ **테이블 없음**

**권장사항:**
- ✅ **AI 기반 작업 완료 검증 시스템 구현 시 테이블 생성 필수**

---

### 10. Reviews 테이블

#### 문서 스키마:
```sql
CREATE TABLE reviews (
    job_id UUID REFERENCES jobs(id),
    reviewer_id UUID REFERENCES users(id),
    reviewee_id UUID REFERENCES users(id),
    reviewer_type VARCHAR(20) CHECK (...),
    overall_rating INT CHECK (overall_rating BETWEEN 1 AND 5),
    -- 세부 평점
    professionalism_rating INT CHECK (...),
    communication_rating INT CHECK (...),
    quality_rating INT CHECK (...),
    punctuality_rating INT CHECK (...),
    value_rating INT CHECK (...),
    -- 리뷰 내용
    review_title VARCHAR(255),
    review_text TEXT,
    pros TEXT,
    cons TEXT,
    would_recommend BOOLEAN,
    media_urls TEXT[],
    -- AI 분석
    ai_sentiment_score DECIMAL(5,2),
    ai_spam_detected BOOLEAN DEFAULT FALSE,
    ai_fake_review_probability DECIMAL(5,2),
    -- 도움 됨 투표
    helpful_count INT DEFAULT 0,
    not_helpful_count INT DEFAULT 0,
    -- 응답
    provider_response TEXT,
    provider_responded_at TIMESTAMP,
    -- 상태
    status VARCHAR(20) DEFAULT 'published' CHECK (...),
    -- 신고
    flagged_count INT DEFAULT 0,
    flag_reasons TEXT[],
);
```

#### 현재 스키마:
```sql
CREATE TABLE reviews (
    booking_id UUID UNIQUE NOT NULL,  -- 문서는 job_id
    reviewer_id UUID NOT NULL,  -- ✅ 일치
    reviewee_id UUID NOT NULL,  -- ✅ 일치
    reviewer_type reviewer_type_enum NOT NULL,  -- ✅ 일치
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),  -- 문서는 overall_rating
    -- 세부 평점
    quality_rating INT CHECK (...),  -- ✅ 일치
    communication_rating INT CHECK (...),  -- ✅ 일치
    punctuality_rating INT CHECK (...),  -- ✅ 일치
    professionalism_rating INT CHECK (...),  -- ✅ 일치
    -- value_rating 없음
    -- 리뷰 내용
    review_text TEXT,  -- ✅ 일치
    -- review_title, pros, cons, would_recommend 없음
    photo_urls JSONB,  -- 문서는 media_urls TEXT[]
    -- AI 분석 없음
    -- 도움 됨 투표 없음
    -- 응답
    provider_response TEXT,  -- ✅ 일치
    responded_at TIMESTAMP NULL,  -- 문서는 provider_responded_at
    -- 상태
    is_verified BOOLEAN DEFAULT TRUE,  -- 문서에 없음
    is_visible BOOLEAN DEFAULT TRUE,  -- 문서는 status
    is_flagged BOOLEAN DEFAULT FALSE,  -- 문서는 flagged_count, flag_reasons
);
```

**주요 차이점:**
1. ⚠️ **참조**: `job_id` vs `booking_id`
2. ⚠️ **필드명**: `overall_rating` vs `rating`
3. ❌ **리뷰 내용**: `review_title`, `pros`, `cons`, `would_recommend` 문서에만 있음
4. ❌ **AI 분석**: `ai_sentiment_score`, `ai_spam_detected`, `ai_fake_review_probability` 문서에만 있음
5. ❌ **도움 됨 투표**: `helpful_count`, `not_helpful_count` 문서에만 있음
6. ❌ **value_rating**: 문서에만 있음
7. ⚠️ **상태 관리**: 문서는 `status` (enum), 현재는 `is_visible`, `is_flagged` (boolean)

**권장사항:**
- AI 분석 필드 추가 (스팸/가짜 리뷰 감지)
- `review_title`, `pros`, `cons`, `would_recommend` 필드 추가
- 도움 됨 투표 기능 추가
- `value_rating` 필드 추가

---

### 11. Disputes 테이블

#### 문서 스키마:
```sql
CREATE TABLE disputes (
    job_id UUID REFERENCES jobs(id),
    contract_id UUID REFERENCES contracts(id),
    filed_by_user_id UUID REFERENCES users(id),
    filed_against_user_id UUID REFERENCES users(id),
    dispute_type VARCHAR(50) CHECK (...),
    description TEXT NOT NULL,
    evidence_urls TEXT[],
    -- AI 분석
    ai_recommended_resolution VARCHAR(50),
    ai_confidence DECIMAL(5,2),
    ai_analysis JSONB,
    -- 중재
    mediator_assigned_id UUID REFERENCES users(id),
    mediation_notes TEXT,
    -- 결정
    resolution VARCHAR(50) CHECK (...),
    resolution_details TEXT,
    resolution_amount DECIMAL(10,2),
    -- 환불
    refund_amount DECIMAL(10,2),
    refund_to_customer BOOLEAN,
    -- 페널티
    penalty_applied_to UUID REFERENCES users(id),
    penalty_type VARCHAR(50),
    penalty_amount DECIMAL(10,2),
    penalty_trust_score_impact INT,
);
```

#### 현재 스키마:
```sql
CREATE TABLE disputes (
    dispute_number VARCHAR(50) UNIQUE NOT NULL,  -- 문서에 없음
    booking_id UUID NOT NULL,  -- 문서는 job_id
    transaction_id UUID NOT NULL,  -- 문서는 contract_id
    initiated_by UUID NOT NULL,  -- 문서는 filed_by_user_id
    consumer_id UUID NOT NULL,  -- 문서에 없음
    provider_id UUID NOT NULL,  -- 문서는 filed_against_user_id
    dispute_type dispute_type_enum NOT NULL,  -- ✅ 일치
    description TEXT NOT NULL,  -- ✅ 일치
    evidence_urls JSONB,  -- 문서는 TEXT[]
    -- AI 분석 없음
    -- 중재
    -- mediator_assigned_id 없음 (dispute_messages에 sender_type으로 관리)
    -- mediation_notes 없음
    -- 결정
    resolution dispute_resolution_enum,  -- ✅ 일치
    resolution_amount DECIMAL(10,2),  -- ✅ 일치
    resolution_notes TEXT,  -- 문서는 resolution_details
    resolved_by UUID,  -- 문서에 없음
    resolved_at TIMESTAMP NULL,  -- 문서에 없음
    -- 환불 정보 없음
    -- 페널티 정보 없음
);
```

**주요 차이점:**
1. ⚠️ **참조**: `job_id`, `contract_id` vs `booking_id`, `transaction_id`
2. ⚠️ **필드명**: `filed_by_user_id`, `filed_against_user_id` vs `initiated_by`, `consumer_id`, `provider_id`
3. ❌ **AI 분석**: 문서에만 있음
4. ❌ **중재**: `mediator_assigned_id`, `mediation_notes` 문서에만 있음
5. ❌ **환불**: `refund_amount`, `refund_to_customer` 문서에만 있음
6. ❌ **페널티**: `penalty_applied_to`, `penalty_type`, `penalty_amount`, `penalty_trust_score_impact` 문서에만 있음

**권장사항:**
- AI 분석 필드 추가
- 중재 필드 추가
- 환불 및 페널티 필드 추가

---

### 12. Reward_Credits 테이블

#### 문서 스키마:
```sql
CREATE TABLE reward_credits (
    user_id UUID REFERENCES users(id),
    credit_change INT NOT NULL,
    balance_after INT NOT NULL,
    transaction_type VARCHAR(50) CHECK (...),
    related_job_id UUID REFERENCES jobs(id),
    related_bid_id UUID REFERENCES bids(id),
    related_review_id UUID REFERENCES reviews(id),
    description TEXT,
    metadata JSONB,
    expires_at TIMESTAMP,
);
```

#### 현재 스키마:
❌ **테이블 없음**

**권장사항:**
- ✅ **리워드 크레딧 시스템 구현 시 테이블 생성 필수**

---

### 13. Skill_Tests 테이블

#### 문서 스키마:
```sql
CREATE TABLE skill_tests (
    user_id UUID REFERENCES users(id),
    test_id UUID,
    test_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    difficulty_level VARCHAR(20) CHECK (...),
    test_type VARCHAR(50) CHECK (...),
    score INT CHECK (score BETWEEN 0 AND 100),
    passed BOOLEAN,
    passing_score INT DEFAULT 80,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    time_taken_seconds INT,
    time_limit_seconds INT,
    answers JSONB,
    evaluation JSONB,
    video_url TEXT,
    video_analysis JSONB,
    reviewed_by_type VARCHAR(20) CHECK (...),
    reviewed_by_user_id UUID REFERENCES users(id),
    reviewer_comments TEXT,
);
```

#### 현재 스키마:
❌ **테이블 없음**

**권장사항:**
- ✅ **스킬 테스트 시스템 구현 시 테이블 생성 필수**

---

## 📋 마이그레이션 우선순위

### 🔴 높은 우선순위 (핵심 기능)

1. **Providers 테이블 확장**
   - `service_categories TEXT[]` 추가
   - `bio TEXT` 추가
   - `hourly_rate_min/max`, `accepts_fixed_price` 추가
   - `available_days[]`, `available_hours_start/end` 추가
   - `is_available BOOLEAN` 추가
   - `current_jobs_count`, `max_concurrent_jobs` 추가
   - `verification_level`, `verification_badges[]` 추가
   - `total_earnings`, `average_rating` 추가

2. **Users 테이블 개선**
   - PostGIS `location GEOGRAPHY(POINT, 4326)` 추가
   - `kyc_verified_at TIMESTAMP` 추가
   - `timezone VARCHAR(50)` 추가 (user_profiles에)

3. **Reviews 테이블 확장**
   - AI 분석 필드 추가
   - `review_title`, `pros`, `cons`, `would_recommend` 추가
   - 도움 됨 투표 필드 추가
   - `value_rating` 추가

### 🟡 중간 우선순위 (옵션 기능)

4. **옥션 시스템** (Jobs, Bids 테이블)
   - 옥션 기반 작업 요청 시스템 구현 시

5. **스마트 컨트랙트** (Contracts 테이블)
   - 블록체인 통합 시

6. **AI 검증 시스템** (Verifications, Job_Completions 테이블)
   - AI 기반 검증 기능 구현 시

### 🟢 낮은 우선순위 (향후 기능)

7. **리워드 크레딧** (Reward_Credits 테이블)
8. **스킬 테스트** (Skill_Tests 테이블)
9. **Disputes 테이블 확장** (AI 분석, 페널티 등)
10. **Trust_Scores 테이블 개선** (시간 가중 통계 등)

---

## ✅ 최종 권장사항

### 즉시 적용 가능한 개선사항

1. **Providers 테이블**: 문서의 모든 필드 추가 (특히 `service_categories`, `is_available`)
2. **Users 테이블**: PostGIS `location` 필드 추가
3. **Reviews 테이블**: AI 분석 필드 추가

### 기능별 구현 계획

- **옥션 시스템**: Jobs, Bids 테이블 생성
- **스마트 컨트랙트**: Contracts 테이블 생성
- **AI 검증**: Verifications, Job_Completions 테이블 생성
- **리워드 시스템**: Reward_Credits 테이블 생성

### 호환성 유지

- 현재 스키마의 고유 필드 유지 (business_name, government_id_* 등)
- 문서 스키마의 필드를 추가하여 확장
- 기존 데이터 마이그레이션 계획 수립

---

## 📚 참고

- [PostGIS 공식 문서](https://postgis.net/documentation/)
- [PostgreSQL 배열 타입](https://www.postgresql.org/docs/current/arrays.html)
- [TypeORM 공간 데이터 타입](https://typeorm.io/entities#column-types)

