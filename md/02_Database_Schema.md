# AI 기반 서비스 제공자 검증 시스템
## Part 2: 데이터베이스 스키마 및 데이터 모델

---

## 1. 전체 데이터베이스 구조

### 1.1 데이터베이스 선택

**PostgreSQL** (Primary Relational DB):
- 사용자, 거래, Trust Score 등 구조화된 데이터
- ACID 트랜잭션 보장 필수
- 복잡한 쿼리 및 조인 필요

**MongoDB** (Document Store):
- 포트폴리오, 리뷰, 채팅 로그 등 비구조화 데이터
- 스키마 유연성 필요
- 대용량 문서 저장

**Redis** (Cache & Session Store):
- Trust Score 캐싱
- 세션 관리
- Rate Limiting
- 실시간 데이터

---

## 2. PostgreSQL 스키마 상세

### 2.1 Users Table (사용자)

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    
    -- 기본 정보
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10),
    
    -- 주소
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'Philippines',
    
    -- 위치 (GIS)
    location GEOGRAPHY(POINT, 4326),
    
    -- 계정 타입
    account_type VARCHAR(20) CHECK (account_type IN ('consumer', 'provider', 'both')),
    
    -- 상태
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned', 'deleted')),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    
    -- KYC
    kyc_level INT DEFAULT 0 CHECK (kyc_level BETWEEN 0 AND 3),
    kyc_verified_at TIMESTAMP,
    
    -- 메타데이터
    profile_photo_url TEXT,
    language_preference VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'Asia/Manila',
    
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
CREATE INDEX idx_users_location ON users USING GIST(location);
CREATE INDEX idx_users_account_type ON users(account_type);
```

---

### 2.2 Providers Table (서비스 제공자 추가 정보)

```sql
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- 서비스 정보
    service_categories TEXT[], -- Array of categories
    bio TEXT,
    years_of_experience INT,
    
    -- 가격 설정
    hourly_rate_min DECIMAL(10,2),
    hourly_rate_max DECIMAL(10,2),
    accepts_fixed_price BOOLEAN DEFAULT TRUE,
    
    -- 가용성
    available_days TEXT[], -- ['monday', 'tuesday', ...]
    available_hours_start TIME,
    available_hours_end TIME,
    service_radius_km INT DEFAULT 10,
    
    -- 검증 정보
    verification_level INT DEFAULT 0 CHECK (verification_level BETWEEN 0 AND 3),
    verification_badges TEXT[], -- ['tesda_certified', 'background_checked', etc.]
    
    -- 보험
    has_insurance BOOLEAN DEFAULT FALSE,
    insurance_provider VARCHAR(100),
    insurance_policy_number VARCHAR(100),
    insurance_expiry_date DATE,
    
    -- 통계 (캐시용)
    total_jobs_completed INT DEFAULT 0,
    total_earnings DECIMAL(12,2) DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0,
    
    -- 상태
    is_active BOOLEAN DEFAULT TRUE,
    is_available BOOLEAN DEFAULT TRUE,
    current_jobs_count INT DEFAULT 0,
    max_concurrent_jobs INT DEFAULT 3,
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_providers_user ON providers(user_id);
CREATE INDEX idx_providers_categories ON providers USING GIN(service_categories);
CREATE INDEX idx_providers_verification_level ON providers(verification_level);
CREATE INDEX idx_providers_active ON providers(is_active, is_available);
```

---

### 2.3 Verifications Table (검증 기록)

```sql
CREATE TABLE verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- 검증 타입
    verification_type VARCHAR(50) NOT NULL CHECK (verification_type IN 
        ('id_card', 'drivers_license', 'passport', 
         'professional_license', 'certificate', 'diploma',
         'portfolio', 'skill_test', 'background_check')),
    
    -- 서브 타입
    sub_type VARCHAR(100), -- e.g., 'PRC_license', 'TESDA_certificate'
    
    -- 상태
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN 
        ('pending', 'under_review', 'approved', 'rejected', 'expired')),
    
    -- 문서 정보
    document_url TEXT,
    document_number VARCHAR(100),
    issuing_authority VARCHAR(100),
    issue_date DATE,
    expiry_date DATE,
    
    -- AI 분석 결과
    ai_confidence_score DECIMAL(5,2), -- 0-100
    ai_analysis_result JSONB, -- Detailed AI analysis
    ai_fraud_score DECIMAL(5,2), -- 0-100, higher = more suspicious
    
    -- 검증자 정보
    verified_by_type VARCHAR(20) CHECK (verified_by_type IN ('ai', 'human', 'api')),
    verified_by_user_id UUID REFERENCES users(id),
    verified_at TIMESTAMP,
    
    -- 거부 사유
    rejection_reason TEXT,
    
    -- 재검증
    requires_reverification BOOLEAN DEFAULT FALSE,
    reverification_due_date DATE,
    
    -- 메타데이터
    metadata JSONB, -- OCR results, EXIF data, etc.
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_verifications_user ON verifications(user_id);
CREATE INDEX idx_verifications_type ON verifications(verification_type);
CREATE INDEX idx_verifications_status ON verifications(status);
CREATE INDEX idx_verifications_expiry ON verifications(expiry_date);
```

---

### 2.4 Trust_Scores Table (신뢰도 점수)

```sql
CREATE TABLE trust_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- 현재 점수
    current_score INT NOT NULL CHECK (current_score BETWEEN 0 AND 1000),
    
    -- 세부 점수 (각 컴포넌트)
    completion_rate_score INT DEFAULT 0, -- 0-400
    response_time_score INT DEFAULT 0,   -- 0-200
    rating_score INT DEFAULT 0,          -- 0-200
    dispute_score INT DEFAULT 0,         -- 0-100
    transaction_volume_score INT DEFAULT 0, -- 0-100
    
    -- 레벨
    level INT DEFAULT 0 CHECK (level BETWEEN 0 AND 3),
    
    -- 통계 (계산에 사용)
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
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_trust_scores_user ON trust_scores(user_id);
CREATE INDEX idx_trust_scores_score ON trust_scores(current_score DESC);
CREATE INDEX idx_trust_scores_level ON trust_scores(level);
```

---

### 2.5 Trust_Score_History Table (점수 변동 이력)

```sql
CREATE TABLE trust_score_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- 점수 변화
    old_score INT,
    new_score INT,
    score_change INT, -- new - old
    
    -- 변경 사유
    change_reason VARCHAR(50) CHECK (change_reason IN 
        ('job_completed', 'job_cancelled', 'dispute_resolved', 
         'positive_review', 'negative_review', 'verification_upgrade',
         'penalty_applied', 'bonus_awarded', 'periodic_recalculation')),
    
    -- 관련 엔티티
    related_transaction_id UUID,
    related_review_id UUID,
    related_dispute_id UUID,
    
    -- 상세 정보
    details JSONB,
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_trust_score_history_user ON trust_score_history(user_id);
CREATE INDEX idx_trust_score_history_date ON trust_score_history(created_at DESC);
```

---

### 2.6 Skill_Tests Table (스킬 테스트)

```sql
CREATE TABLE skill_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- 테스트 정보
    test_id UUID, -- Reference to test template
    test_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    
    -- 테스트 타입
    test_type VARCHAR(50) CHECK (test_type IN ('quiz', 'video_submission', 'practical_demo', 'code_challenge')),
    
    -- 결과
    score INT CHECK (score BETWEEN 0 AND 100),
    passed BOOLEAN,
    passing_score INT DEFAULT 80,
    
    -- 시간
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    time_taken_seconds INT,
    time_limit_seconds INT,
    
    -- 응답 데이터
    answers JSONB, -- User's answers
    evaluation JSONB, -- AI or manual evaluation details
    
    -- 비디오 제출 (해당되는 경우)
    video_url TEXT,
    video_analysis JSONB, -- AI video analysis results
    
    -- 검토자
    reviewed_by_type VARCHAR(20) CHECK (reviewed_by_type IN ('ai', 'human')),
    reviewed_by_user_id UUID REFERENCES users(id),
    reviewer_comments TEXT,
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_skill_tests_user ON skill_tests(user_id);
CREATE INDEX idx_skill_tests_category ON skill_tests(category);
CREATE INDEX idx_skill_tests_passed ON skill_tests(passed);
```

---

### 2.7 Jobs Table (작업/서비스 요청)

```sql
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 고객 정보
    customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- 서비스 정보
    category VARCHAR(100) NOT NULL,
    sub_category VARCHAR(100),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    -- 위치
    location GEOGRAPHY(POINT, 4326),
    address_line1 VARCHAR(255),
    city VARCHAR(100),
    province VARCHAR(100),
    
    -- 일정
    preferred_date DATE,
    preferred_time TIME,
    urgency VARCHAR(20) CHECK (urgency IN ('flexible', 'within_week', 'urgent_24h')),
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
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN 
        ('draft', 'open', 'bidding_closed', 'provider_selected', 
         'in_progress', 'completed', 'cancelled', 'disputed')),
    
    -- 선택된 제공자
    selected_provider_id UUID REFERENCES providers(id),
    selected_bid_id UUID,
    selection_reason TEXT,
    
    -- 보험
    insurance_required BOOLEAN DEFAULT FALSE,
    insurance_coverage_amount DECIMAL(10,2),
    
    -- AI 매칭
    ai_recommended_providers UUID[], -- Array of provider IDs
    ai_match_scores JSONB, -- {provider_id: match_score}
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    closed_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_jobs_customer ON jobs(customer_id);
CREATE INDEX idx_jobs_provider ON jobs(selected_provider_id);
CREATE INDEX idx_jobs_category ON jobs(category);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_location ON jobs USING GIST(location);
CREATE INDEX idx_jobs_auction_deadline ON jobs(auction_deadline) WHERE status = 'open';
```

---

### 2.8 Bids Table (입찰)

```sql
CREATE TABLE bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
    
    -- 입찰 금액
    bid_amount DECIMAL(10,2) NOT NULL,
    
    -- 일정
    proposed_date DATE,
    proposed_time TIME,
    estimated_duration_hours DECIMAL(5,2),
    
    -- 제안서
    proposal_text TEXT,
    portfolio_attachments TEXT[], -- URLs
    
    -- 추가 정보
    includes_materials BOOLEAN DEFAULT FALSE,
    materials_cost DECIMAL(10,2),
    warranty_offered VARCHAR(255),
    
    -- 크레딧 사용
    reward_credits_spent INT DEFAULT 1,
    
    -- 상태
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN 
        ('pending', 'viewed', 'shortlisted', 'accepted', 'rejected', 'withdrawn')),
    
    -- AI 분석
    ai_quality_score INT, -- 0-100 (proposal quality)
    ai_spam_score DECIMAL(5,2), -- 0-1 (spam probability)
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT NOW(),
    viewed_at TIMESTAMP,
    responded_at TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_bids_job ON bids(job_id);
CREATE INDEX idx_bids_provider ON bids(provider_id);
CREATE INDEX idx_bids_status ON bids(status);
CREATE UNIQUE INDEX idx_bids_job_provider ON bids(job_id, provider_id);
```

---

### 2.9 Contracts Table (스마트 컨트랙트)

```sql
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,
    
    -- 당사자
    customer_id UUID REFERENCES users(id),
    provider_id UUID REFERENCES users(id),
    
    -- 계약 내용
    service_description TEXT NOT NULL,
    scope_of_work TEXT NOT NULL,
    deliverables TEXT[] NOT NULL,
    
    -- 금액
    service_amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL,
    insurance_premium DECIMAL(10,2),
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- 일정
    start_date DATE,
    start_time TIME,
    estimated_completion_time TIMESTAMP,
    
    -- 완료 기준
    completion_criteria TEXT NOT NULL,
    requires_customer_approval BOOLEAN DEFAULT TRUE,
    auto_release_hours INT DEFAULT 48,
    
    -- 취소 정책
    cancellation_policy JSONB NOT NULL,
    
    -- 분쟁 해결
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
    
    -- 상태
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN 
        ('draft', 'pending_signatures', 'active', 'completed', 
         'cancelled', 'disputed', 'terminated')),
    
    -- AI 생성
    ai_generated BOOLEAN DEFAULT TRUE,
    ai_template_version VARCHAR(50),
    
    -- 수정
    amendments JSONB[], -- Array of amendment records
    amendment_count INT DEFAULT 0,
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT NOW(),
    activated_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_contracts_job ON contracts(job_id);
CREATE INDEX idx_contracts_customer ON contracts(customer_id);
CREATE INDEX idx_contracts_provider ON contracts(provider_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_blockchain ON contracts(blockchain_hash);
```

---

### 2.10 Transactions Table (에스크로 거래)

```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id),
    
    -- 당사자
    payer_id UUID REFERENCES users(id),
    payee_id UUID REFERENCES users(id),
    
    -- 금액
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'PHP',
    
    -- 거래 타입
    transaction_type VARCHAR(50) CHECK (transaction_type IN 
        ('escrow_deposit', 'escrow_release', 'refund', 
         'platform_fee', 'insurance_premium', 'penalty', 'bonus')),
    
    -- 결제 방법
    payment_method VARCHAR(50) CHECK (payment_method IN 
        ('gcash', 'paymaya', 'card', 'bank_transfer', 'cash', 'wallet')),
    payment_provider VARCHAR(100),
    
    -- 결제 정보
    payment_reference VARCHAR(255),
    payment_gateway_transaction_id VARCHAR(255),
    
    -- 상태
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN 
        ('pending', 'processing', 'completed', 'failed', 'refunded', 'disputed')),
    
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
    
    -- 메타데이터
    metadata JSONB,
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_transactions_contract ON transactions(contract_id);
CREATE INDEX idx_transactions_job ON transactions(job_id);
CREATE INDEX idx_transactions_payer ON transactions(payer_id);
CREATE INDEX idx_transactions_payee ON transactions(payee_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
```

---

### 2.11 Job_Completions Table (작업 완료 증명)

```sql
CREATE TABLE job_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contracts(id),
    provider_id UUID REFERENCES users(id),
    
    -- 완료 증명
    completion_notes TEXT,
    
    -- 사진 증거
    photos_before TEXT[] NOT NULL, -- Array of S3 URLs
    photos_after TEXT[] NOT NULL,
    
    -- AI 검증
    ai_verification_status VARCHAR(20) CHECK (ai_verification_status IN 
        ('pending', 'analyzing', 'approved', 'needs_review', 'rejected')),
    ai_confidence_score DECIMAL(5,2), -- 0-100
    ai_quality_score INT, -- 0-100
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
    
    -- 수동 리뷰 (필요시)
    requires_manual_review BOOLEAN DEFAULT FALSE,
    manual_reviewer_id UUID REFERENCES users(id),
    manual_review_notes TEXT,
    manual_review_completed_at TIMESTAMP,
    
    -- 완료 시간
    actual_start_time TIMESTAMP,
    actual_end_time TIMESTAMP,
    actual_duration_minutes INT,
    
    -- 타임스탬프
    submitted_at TIMESTAMP DEFAULT NOW(),
    verified_at TIMESTAMP,
    approved_at TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_job_completions_job ON job_completions(job_id);
CREATE INDEX idx_job_completions_provider ON job_completions(provider_id);
CREATE INDEX idx_job_completions_ai_status ON job_completions(ai_verification_status);
```

---

### 2.12 Reviews Table (리뷰 및 평점)

```sql
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    
    -- 리뷰어 및 대상
    reviewer_id UUID REFERENCES users(id),
    reviewee_id UUID REFERENCES users(id),
    reviewer_type VARCHAR(20) CHECK (reviewer_type IN ('customer', 'provider')),
    
    -- 평점
    overall_rating INT CHECK (overall_rating BETWEEN 1 AND 5),
    
    -- 세부 평점 (제공자에 대한 평가)
    professionalism_rating INT CHECK (professionalism_rating BETWEEN 1 AND 5),
    communication_rating INT CHECK (communication_rating BETWEEN 1 AND 5),
    quality_rating INT CHECK (quality_rating BETWEEN 1 AND 5),
    punctuality_rating INT CHECK (punctuality_rating BETWEEN 1 AND 5),
    value_rating INT CHECK (value_rating BETWEEN 1 AND 5),
    
    -- 리뷰 내용
    review_title VARCHAR(255),
    review_text TEXT,
    pros TEXT,
    cons TEXT,
    
    -- 추천
    would_recommend BOOLEAN,
    
    -- 사진/비디오
    media_urls TEXT[],
    
    -- AI 분석
    ai_sentiment_score DECIMAL(5,2), -- -1 to 1 (negative to positive)
    ai_spam_detected BOOLEAN DEFAULT FALSE,
    ai_fake_review_probability DECIMAL(5,2), -- 0-1
    
    -- 도움 됨 투표
    helpful_count INT DEFAULT 0,
    not_helpful_count INT DEFAULT 0,
    
    -- 응답
    provider_response TEXT,
    provider_responded_at TIMESTAMP,
    
    -- 상태
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN 
        ('draft', 'published', 'hidden', 'flagged', 'removed')),
    
    -- 신고
    flagged_count INT DEFAULT 0,
    flag_reasons TEXT[],
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_reviews_job ON reviews(job_id);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_reviews_rating ON reviews(overall_rating);
CREATE INDEX idx_reviews_status ON reviews(status);
```

---

### 2.13 Disputes Table (분쟁)

```sql
CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contracts(id),
    
    -- 당사자
    filed_by_user_id UUID REFERENCES users(id),
    filed_against_user_id UUID REFERENCES users(id),
    
    -- 분쟁 정보
    dispute_type VARCHAR(50) CHECK (dispute_type IN 
        ('non_payment', 'incomplete_work', 'poor_quality', 
         'no_show', 'late_completion', 'scope_disagreement', 
         'property_damage', 'other')),
    
    -- 설명
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
    resolution VARCHAR(50) CHECK (resolution IN 
        ('pending', 'in_mediation', 'resolved_customer_favor', 
         'resolved_provider_favor', 'split_resolution', 'escalated')),
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
    
    -- 타임스탬프
    filed_at TIMESTAMP DEFAULT NOW(),
    assigned_at TIMESTAMP,
    resolved_at TIMESTAMP,
    closed_at TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_disputes_job ON disputes(job_id);
CREATE INDEX idx_disputes_filed_by ON disputes(filed_by_user_id);
CREATE INDEX idx_disputes_filed_against ON disputes(filed_against_user_id);
CREATE INDEX idx_disputes_mediator ON disputes(mediator_assigned_id);
CREATE INDEX idx_disputes_resolution ON disputes(resolution);
```

---

### 2.14 Reward_Credits Table (리워드 크레딧)

```sql
CREATE TABLE reward_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- 크레딧 변동
    credit_change INT NOT NULL, -- Positive for earn, negative for spend
    balance_after INT NOT NULL,
    
    -- 사유
    transaction_type VARCHAR(50) CHECK (transaction_type IN 
        ('initial_bonus', 'job_completion', 'high_rating', 
         'milestone_reached', 'referral_bonus', 'bid_spent', 
         'penalty', 'admin_adjustment', 'promotion')),
    
    -- 관련 엔티티
    related_job_id UUID REFERENCES jobs(id),
    related_bid_id UUID REFERENCES bids(id),
    related_review_id UUID REFERENCES reviews(id),
    
    -- 상세 정보
    description TEXT,
    metadata JSONB,
    
    -- 만료
    expires_at TIMESTAMP,
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_reward_credits_user ON reward_credits(user_id);
CREATE INDEX idx_reward_credits_type ON reward_credits(transaction_type);
CREATE INDEX idx_reward_credits_date ON reward_credits(created_at DESC);
```

---

## 3. MongoDB Collections

### 3.1 Portfolios Collection

```javascript
{
  _id: ObjectId(),
  user_id: UUID,
  
  // 포트폴리오 항목
  items: [
    {
      title: String,
      description: String,
      category: String,
      sub_category: String,
      
      // 미디어
      images: [String], // S3 URLs
      videos: [String],
      
      // 작업 정보
      client_name: String, // Optional
      completion_date: Date,
      project_duration: String,
      
      // AI 검증
      ai_verified: Boolean,
      ai_confidence_score: Number,
      reverse_image_search_passed: Boolean,
      metadata_verified: Boolean,
      
      // 통계
      views_count: Number,
      likes_count: Number,
      
      created_at: Date,
      updated_at: Date
    }
  ],
  
  // 통계
  total_items: Number,
  total_views: Number,
  verification_status: String,
  
  created_at: Date,
  updated_at: Date
}
```

---

### 3.2 Chat_Messages Collection

```javascript
{
  _id: ObjectId(),
  conversation_id: UUID,
  job_id: UUID,
  
  // 참여자
  participants: [UUID], // Array of user IDs
  
  // 메시지
  messages: [
    {
      message_id: UUID,
      sender_id: UUID,
      
      // 내용
      message_type: String, // 'text', 'image', 'voice', 'system'
      text: String,
      media_url: String,
      
      // AI 분석
      ai_sentiment: Number, // -1 to 1
      ai_spam_detected: Boolean,
      ai_inappropriate_content: Boolean,
      
      // 상태
      read_by: [UUID], // User IDs who read the message
      delivered_at: Date,
      read_at: Date,
      
      timestamp: Date
    }
  ],
  
  // 메타데이터
  last_message_at: Date,
  total_messages: Number,
  
  created_at: Date,
  updated_at: Date
}
```

---

이 문서는 Part 2입니다. 다음 문서들이 이어집니다:
- Part 3: API 설계 및 엔드포인트
- Part 4: 데이터 흐름도 (Mermaid Diagrams)
- Part 5: 배포 및 스케일링 전략
