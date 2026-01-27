# Gig-Market Platform 사용자별 데이터 정의서

**작성일**: 2025년 11월 1일  
**버전**: 1.0  
**프로젝트**: AI TrustTrade Gig-Market Platform

---

## 목차
1. [서비스 제공자 (Service Provider)](#1-서비스-제공자-service-provider)
2. [서비스 구매자 (Service Consumer)](#2-서비스-구매자-service-consumer)
3. [서비스 유형 (Service Types)](#3-서비스-유형-service-types)
4. [공통 데이터 구조](#4-공통-데이터-구조)
5. [데이터 관계도](#5-데이터-관계도)

---

## 1. 서비스 제공자 (Service Provider)

### 1.1 개인 프로파일 (Personal Profile)

#### 기본 정보 테이블: `users`
```sql
{
  id: UUID,                          // 고유 식별자
  email: String (255),               // 이메일 (필수, 고유값)
  phone: String (20),                // 전화번호 (필수, 고유값, +63 형식)
  password_hash: String (255),       // 암호화된 비밀번호
  user_type: Enum,                   // 'provider' | 'consumer' | 'both'
  first_name: String (100),          // 이름 (필수)
  last_name: String (100),           // 성 (필수)
  profile_photo_url: String (500),   // 프로필 사진 URL (필수)
  date_of_birth: Date,               // 생년월일
  gender: Enum,                      // 'male' | 'female' | 'other' | 'prefer_not_to_say'
  
  // 인증 키 (Authentication)
  is_email_verified: Boolean,        // 이메일 인증 여부
  is_phone_verified: Boolean,        // 전화번호 인증 여부 (SMS OTP)
  is_id_verified: Boolean,           // 신분증 인증 여부
  kyc_level: Enum,                   // KYC 레벨: 'basic' | 'intermediate' | 'advanced'
  two_factor_enabled: Boolean,       // 2단계 인증 활성화 여부
  
  // 상태
  status: Enum,                      // 'active' | 'suspended' | 'deactivated' | 'banned'
  last_login_at: Timestamp,          // 마지막 로그인 시각
  
  // 타임스탬프
  created_at: Timestamp,             // 가입일
  updated_at: Timestamp,             // 최종 수정일
  deleted_at: Timestamp              // 삭제일 (소프트 삭제)
}
```

#### 프로필 상세 정보 테이블: `user_profiles`
```sql
{
  id: UUID,
  user_id: UUID (FK → users.id),
  bio: Text,                         // 자기소개 (최소 50자)
  
  // 주소 정보
  address_line1: String (255),       // 주소 1
  address_line2: String (255),       // 주소 2
  city: String (100),                // 도시
  province: String (100),            // 지역/주
  postal_code: String (20),          // 우편번호
  country: String (2),               // 국가 코드 (기본값: 'PH')
  
  // 위치 정보 (GPS)
  latitude: Decimal (10,8),          // 위도
  longitude: Decimal (11,8),         // 경도
  
  // 언어 및 통화
  preferred_language: String (10),   // 선호 언어 (기본값: 'en')
  preferred_currency: String (3),    // 선호 통화 (기본값: 'PHP')
  
  // 알림 설정
  notification_email: Boolean,       // 이메일 알림 수신 여부
  notification_sms: Boolean,         // SMS 알림 수신 여부
  notification_push: Boolean,        // 푸시 알림 수신 여부
  
  created_at: Timestamp,
  updated_at: Timestamp
}
```

---

### 1.2 재능 프로파일 (Talent Profile)

#### 제공자 정보 테이블: `providers`
```sql
{
  id: UUID,
  user_id: UUID (FK → users.id),
  
  // 사업자 정보
  business_name: String (255),       // 사업자명 (선택)
  business_type: Enum,               // 'individual' | 'company'
  
  // 인증 데이터 (Verification Documents)
  government_id_type: String (50),   // 신분증 유형 (예: Driver's License, UMID, SSS)
  government_id_number: String (100),// 신분증 번호 (암호화 저장)
  tin_number: String (50),           // 납세자 번호 (TIN)
  
  // 재능 및 경력
  years_of_experience: Integer,      // 경력 연수
  certifications: JSON,              // 자격증 목록
  /*
  certifications 구조:
  [
    {
      name: "Certified Electrician",
      issuer: "TESDA",
      issue_date: "2020-01-15",
      expiry_date: "2025-01-15",
      certificate_url: "https://..."
    }
  ]
  */
  
  portfolio_photos: JSON,            // 포트폴리오 사진 (최소 3장)
  /*
  portfolio_photos 구조:
  [
    {
      url: "https://...",
      caption: "Kitchen renovation project",
      uploaded_at: "2024-05-10"
    }
  ]
  */
  
  // 가용성
  instant_booking_enabled: Boolean,  // 즉시 예약 허용 여부
  service_radius_km: Integer,        // 서비스 반경 (km) (기본값: 10)
  
  // 성과 통계
  response_time_minutes: Integer,    // 평균 응답 시간 (분)
  completion_rate: Decimal (5,2),    // 완료율 (%)
  total_jobs_completed: Integer,     // 총 완료 작업 수
  
  // 상태
  is_active: Boolean,                // 활성화 여부
  is_featured: Boolean,              // 추천 제공자 여부
  
  created_at: Timestamp,
  updated_at: Timestamp
}
```

#### 제공 서비스 목록 테이블: `services`
```sql
{
  id: UUID,
  provider_id: UUID (FK → providers.id),
  category_id: UUID (FK → service_categories.id),
  
  title: String (255),               // 서비스 제목
  description: Text,                 // 서비스 설명
  
  // 평가 등급 (Rating)
  average_rating: Decimal (3,2),     // 평균 평점 (0.00-5.00)
  total_reviews: Integer,            // 총 리뷰 수
  
  // 가격 정보
  base_rate: Decimal (10,2),         // 기본 요금 (PHP)
  rate_type: Enum,                   // 'per_hour' | 'per_project' | 'per_day'
  min_rate: Decimal (10,2),          // 최소 요금
  max_rate: Decimal (10,2),          // 최대 요금
  
  // 서비스 세부사항
  duration_minutes: Integer,         // 예상 소요 시간 (분)
  location_type: Enum,               // 'provider_location' | 'customer_location' | 'online' | 'flexible'
  
  // 상태
  is_active: Boolean,                // 활성화 여부
  is_featured: Boolean,              // 추천 서비스 여부
  
  // 통계
  views_count: Integer,              // 조회 수
  bookings_count: Integer,           // 예약 수
  
  created_at: Timestamp,
  updated_at: Timestamp
}
```

---

### 1.3 개인 히스토리 (Personal History)

#### 예약/프로젝트 이력 테이블: `bookings`
```sql
{
  id: UUID,
  booking_number: String (50),       // 예약 번호 (고유값)
  
  consumer_id: UUID (FK → users.id), // 구매자 ID
  provider_id: UUID (FK → providers.id), // 제공자 ID
  service_id: UUID (FK → services.id),   // 서비스 ID
  
  // 예약 정보
  scheduled_date: Date,              // 예약 날짜
  scheduled_time: Time,              // 예약 시간
  duration_minutes: Integer,         // 예상 소요 시간
  
  // 위치 정보
  service_location: Text,            // 서비스 제공 위치
  location_latitude: Decimal (10,8),
  location_longitude: Decimal (11,8),
  
  // 금액
  service_amount: Decimal (10,2),    // 서비스 금액
  platform_fee: Decimal (10,2),      // 플랫폼 수수료 (7%)
  insurance_fee: Decimal (10,2),     // 보험료 (선택)
  total_amount: Decimal (10,2),      // 총 금액
  
  // 상태
  status: Enum,                      // 'pending' | 'confirmed' | 'in_progress' | 
                                     // 'completed' | 'cancelled' | 'disputed'
  
  // 타임스탬프
  confirmed_at: Timestamp,           // 확정 시각
  started_at: Timestamp,             // 시작 시각
  completed_at: Timestamp,           // 완료 시각
  cancelled_at: Timestamp,           // 취소 시각
  
  cancellation_reason: Text,         // 취소 사유
  special_instructions: Text,        // 특별 요청사항
  
  created_at: Timestamp,
  updated_at: Timestamp
}
```

#### 리뷰 및 평가 테이블: `reviews`
```sql
{
  id: UUID,
  booking_id: UUID (FK → bookings.id),
  reviewer_id: UUID (FK → users.id),    // 평가자 ID
  reviewee_id: UUID (FK → users.id),    // 피평가자 ID
  review_type: Enum,                    // 'provider_to_consumer' | 'consumer_to_provider'
  
  // 평가 점수
  rating: Integer (1-5),                // 전체 평점 (1-5점)
  quality_rating: Integer (1-5),        // 품질 평점
  communication_rating: Integer (1-5),   // 의사소통 평점
  punctuality_rating: Integer (1-5),    // 시간 준수 평점
  professionalism_rating: Integer (1-5), // 전문성 평점
  
  // 리뷰 내용
  review_title: String (255),           // 리뷰 제목
  review_text: Text,                    // 리뷰 내용
  photos: JSON,                         // 리뷰 사진 URL 배열
  
  // 응답
  response_text: Text,                  // 제공자 응답
  response_date: Timestamp,             // 응답 날짜
  
  // 유용성
  helpful_count: Integer,               // 도움됨 투표 수
  
  // 상태
  is_verified: Boolean,                 // 검증된 리뷰 여부
  is_featured: Boolean,                 // 추천 리뷰 여부
  is_flagged: Boolean,                  // 신고된 리뷰 여부
  
  created_at: Timestamp,
  updated_at: Timestamp
}
```

#### 신뢰 점수 변경 이력: `trust_score_history`
```sql
{
  id: UUID,
  user_id: UUID (FK → users.id),
  
  score_change: Integer,             // 점수 변화량 (+/-)
  previous_score: Integer,           // 이전 점수
  new_score: Integer,                // 새로운 점수
  
  reason_code: String (50),          // 변경 사유 코드
  reason_description: Text,          // 변경 사유 설명
  related_transaction_id: UUID,      // 관련 거래 ID
  
  created_at: Timestamp
}
```

---

### 1.4 개인 지갑 (Personal Wallet)

#### 지갑 테이블: `wallets`
```sql
{
  id: UUID,
  user_id: UUID (FK → users.id),
  
  // 잔액
  balance: Decimal (10,2),           // 사용 가능 잔액 (PHP)
  escrow_balance: Decimal (10,2),    // 에스크로 잔액 (보류 중 금액)
  reward_credits: Integer,           // 리워드 크레딧 (입찰용)
  
  currency: String (3),              // 통화 (기본값: 'PHP')
  
  // 상태
  status: Enum,                      // 'active' | 'frozen' | 'suspended'
  
  // 통계
  total_deposited: Decimal (10,2),   // 총 입금액
  total_withdrawn: Decimal (10,2),   // 총 출금액
  total_earned: Decimal (10,2),      // 총 수익
  total_spent: Decimal (10,2),       // 총 지출
  
  created_at: Timestamp,
  updated_at: Timestamp
}
```

#### 지갑 거래 내역 테이블: `wallet_transactions`
```sql
{
  id: UUID,
  wallet_id: UUID (FK → wallets.id),
  user_id: UUID (FK → users.id),
  
  // 거래 정보
  transaction_number: String (50),   // 거래 번호 (고유값)
  type: Enum,                        // 'deposit' | 'withdrawal' | 'transfer' | 
                                     // 'payment' | 'refund' | 'fee' | 'reward'
  
  // 금액
  amount: Decimal (10,2),            // 거래 금액
  fee: Decimal (10,2),               // 수수료
  net_amount: Decimal (10,2),        // 순 금액
  
  balance_before: Decimal (10,2),    // 거래 전 잔액
  balance_after: Decimal (10,2),     // 거래 후 잔액
  
  // 상대방 정보
  counterparty_id: UUID (FK → users.id), // 상대방 ID (송금/수령 시)
  
  // 상태
  status: Enum,                      // 'pending' | 'completed' | 'failed' | 'cancelled'
  
  // 설명
  description: Text,                 // 거래 설명
  reference_id: UUID,                // 참조 ID (예: booking_id)
  
  // 결제 수단 정보
  payment_method: String (50),       // 결제 수단 ('gcash' | 'paymaya' | 'bank_transfer')
  payment_reference: String (100),   // 결제 참조 번호
  
  created_at: Timestamp,
  updated_at: Timestamp
}
```

#### 리워드 크레딧 거래 내역: `reward_credit_transactions`
```sql
{
  id: UUID,
  user_id: UUID (FK → users.id),
  
  // 거래 정보
  transaction_type: Enum,            // 'earned' | 'spent' | 'purchased' | 
                                     // 'bonus' | 'penalty' | 'refunded'
  
  credits_change: Integer,           // 크레딧 변화량 (+/-)
  credits_before: Integer,           // 거래 전 크레딧
  credits_after: Integer,            // 거래 후 크레딧
  
  // 사유
  reason: String (100),              // 거래 사유
  description: Text,                 // 상세 설명
  related_booking_id: UUID,          // 관련 예약 ID
  related_auction_id: UUID,          // 관련 경매 ID
  
  // 만료 정보 (보너스 크레딧의 경우)
  expires_at: Timestamp,             // 만료일
  
  created_at: Timestamp
}
```

---

### 1.5 개인 프로젝트 (Active Projects)

#### 경매 입찰 내역: `auction_bids`
```sql
{
  id: UUID,
  auction_id: UUID (FK → auctions.id),
  provider_id: UUID (FK → providers.id),
  
  // 입찰 내용
  proposed_price: Decimal (10,2),    // 제안 가격
  estimated_duration: Integer,       // 예상 소요 시간 (분)
  work_plan: Text,                   // 작업 계획서
  portfolio_items: JSON,             // 포트폴리오 항목 (관련 작업 사진)
  
  // 일정
  proposed_start_date: Date,         // 제안 시작일
  proposed_completion_date: Date,    // 제안 완료일
  
  // 입찰 비용
  credits_spent: Integer,            // 소모된 크레딧
  
  // AI 평가
  ai_match_score: Decimal (5,2),     // AI 매칭 점수 (0-100)
  ai_recommendation: Text,           // AI 추천 코멘트
  
  // 상태
  status: Enum,                      // 'submitted' | 'under_review' | 'shortlisted' | 
                                     // 'selected' | 'rejected'
  
  // 타임스탬프
  submitted_at: Timestamp,           // 제출 시각
  reviewed_at: Timestamp,            // 검토 시각
  selected_at: Timestamp,            // 선택 시각
  
  // 추가 정보
  withdrawal_reason: Text,           // 입찰 철회 사유 (철회 시)
  
  created_at: Timestamp,
  updated_at: Timestamp
}
```

#### 스마트 계약 테이블: `smart_contracts`
```sql
{
  id: UUID,
  contract_number: String (50),      // 계약 번호 (고유값)
  booking_id: UUID (FK → bookings.id),
  
  consumer_id: UUID (FK → users.id),
  provider_id: UUID (FK → providers.id),
  
  // 계약 내용
  contract_terms: JSON,              // 계약 조건 (구조화된 데이터)
  /*
  contract_terms 구조:
  {
    scope_of_work: "...",
    deliverables: [...],
    timeline: {...},
    payment_terms: {...},
    penalties: {...},
    termination_conditions: {...}
  }
  */
  
  contract_document_url: String (500), // 계약서 PDF URL
  contract_hash: String (64),        // 블록체인 해시 (SHA-256)
  blockchain_tx_id: String (100),    // 블록체인 거래 ID
  
  // 서명 정보
  consumer_signature: String (500),  // 구매자 전자서명 (base64)
  consumer_signed_at: Timestamp,     // 구매자 서명 시각
  consumer_ip: String (45),          // 구매자 IP 주소
  
  provider_signature: String (500),  // 제공자 전자서명 (base64)
  provider_signed_at: Timestamp,     // 제공자 서명 시각
  provider_ip: String (45),          // 제공자 IP 주소
  
  // 상태
  status: Enum,                      // 'draft' | 'pending_signatures' | 'active' | 
                                     // 'completed' | 'terminated' | 'disputed'
  
  // 이행 정보
  completion_proof: JSON,            // 완료 증빙 (사진, 서명 등)
  completion_confirmed_at: Timestamp, // 완료 확인 시각
  
  created_at: Timestamp,
  updated_at: Timestamp
}
```

---

## 2. 서비스 구매자 (Service Consumer)

### 2.1 개인 프로파일 (Personal Profile)

#### 기본 정보 테이블: `users` (제공자와 동일)
```sql
{
  // 제공자 섹션 1.1과 동일한 구조
  // user_type: 'consumer' 또는 'both'
}
```

#### 프로필 상세 정보 테이블: `user_profiles` (제공자와 동일)
```sql
{
  // 제공자 섹션 1.1과 동일한 구조
}
```

---

### 2.2 요구 서비스 (Service Requests)

#### AI 견적 세션 테이블: `ai_quotation_sessions`
```sql
{
  id: UUID,
  user_id: UUID (FK → users.id),
  
  // 세션 정보
  session_number: String (50),       // 세션 번호
  status: Enum,                      // 'in_progress' | 'completed' | 'abandoned'
  
  // 대화 내용
  conversation_history: JSON,        // 대화 이력
  /*
  conversation_history 구조:
  [
    {
      role: "ai" | "user",
      message: "...",
      timestamp: "2024-10-31T10:30:00Z",
      metadata: {...}
    }
  ]
  */
  
  // 수집된 정보
  service_category: String (100),    // 서비스 카테고리
  service_description: Text,         // 서비스 설명
  location: Text,                    // 서비스 위치
  preferred_date: Date,              // 희망 날짜
  preferred_time: Time,              // 희망 시간
  budget_range_min: Decimal (10,2),  // 예산 최소값
  budget_range_max: Decimal (10,2),  // 예산 최대값
  special_requirements: Text,        // 특별 요구사항
  photos: JSON,                      // 업로드된 사진 URL 배열
  
  // AI 분석 결과
  ai_estimated_price: Decimal (10,2), // AI 추정 가격
  ai_estimated_duration: Integer,    // AI 추정 소요 시간 (분)
  ai_suggested_providers: JSON,      // AI 추천 제공자 목록
  ai_confidence_score: Decimal (5,2), // AI 신뢰도 점수 (0-100)
  
  // 결과
  converted_to_auction: Boolean,     // 경매로 전환 여부
  auction_id: UUID (FK → auctions.id), // 생성된 경매 ID
  
  created_at: Timestamp,
  updated_at: Timestamp,
  completed_at: Timestamp
}
```

#### 경매 생성 테이블: `auctions`
```sql
{
  id: UUID,
  auction_number: String (50),       // 경매 번호 (고유값)
  consumer_id: UUID (FK → users.id),
  
  // 서비스 정보
  service_category_id: UUID (FK → service_categories.id),
  service_title: String (255),       // 서비스 제목
  service_description: Text,         // 상세 설명
  service_requirements: Text,        // 요구사항
  
  // 위치 및 일정
  service_location: Text,            // 서비스 위치
  location_latitude: Decimal (10,8),
  location_longitude: Decimal (11,8),
  preferred_date: Date,              // 희망 날짜
  preferred_time: Time,              // 희망 시간
  deadline: Timestamp,               // 입찰 마감 시간
  
  // 예산
  budget_min: Decimal (10,2),        // 최소 예산
  budget_max: Decimal (10,2),        // 최대 예산
  ai_fair_price: Decimal (10,2),     // AI 산정 적정가
  
  // 첨부 자료
  photos: JSON,                      // 사진 URL 배열
  documents: JSON,                   // 문서 URL 배열
  
  // 경매 설정
  auto_select_enabled: Boolean,      // 자동 선택 활성화 여부
  max_bids_to_receive: Integer,      // 최대 수령 입찰 수
  
  // 상태
  status: Enum,                      // 'draft' | 'published' | 'bidding' | 
                                     // 'reviewing' | 'selected' | 'expired' | 'cancelled'
  
  // 통계
  total_views: Integer,              // 조회 수
  total_bids: Integer,               // 총 입찰 수
  
  // 선택 정보
  selected_bid_id: UUID (FK → auction_bids.id), // 선택된 입찰 ID
  selection_reason: Text,            // 선택 사유
  selected_at: Timestamp,            // 선택 시각
  
  created_at: Timestamp,
  updated_at: Timestamp,
  expired_at: Timestamp
}
```

---

### 2.3 평가 데이터 (Evaluation Data)

#### 리뷰 및 평점: `reviews` (제공자 섹션 1.3과 동일)
```sql
{
  // 구매자가 제공자에게 남긴 리뷰
  // review_type: 'consumer_to_provider'
}
```

#### 제공자 즐겨찾기: `provider_favorites`
```sql
{
  id: UUID,
  user_id: UUID (FK → users.id),        // 구매자 ID
  provider_id: UUID (FK → providers.id), // 제공자 ID
  
  notes: Text,                           // 메모
  
  created_at: Timestamp
}
```

---

### 2.4 구매 히스토리 (Purchase History)

#### 예약 내역: `bookings` (제공자 섹션 1.3과 동일)
```sql
{
  // 구매자 관점의 예약 내역
  // consumer_id 필드를 기준으로 조회
}
```

#### 거래 내역: `transactions`
```sql
{
  id: UUID,
  transaction_number: String (50),   // 거래 번호 (고유값)
  booking_id: UUID (FK → bookings.id),
  
  consumer_id: UUID (FK → users.id),
  provider_id: UUID (FK → providers.id),
  
  // 금액 내역
  amount: Decimal (10,2),            // 총 금액
  service_amount: Decimal (10,2),    // 서비스 금액
  platform_fee: Decimal (10,2),      // 플랫폼 수수료 (7%)
  insurance_fee: Decimal (10,2),     // 보험료 (선택)
  provider_amount: Decimal (10,2),   // 제공자 수령액
  
  // 결제 정보
  payment_method: String (50),       // 결제 수단
  payment_reference: String (100),   // 결제 참조 번호
  paid_at: Timestamp,                // 결제 시각
  
  // 에스크로 정보
  escrow_id: UUID (FK → escrows.id), // 에스크로 ID
  
  // 상태
  status: Enum,                      // 'pending' | 'processing' | 'completed' | 
                                     // 'refunded' | 'failed'
  
  // 환불 정보
  refund_amount: Decimal (10,2),     // 환불 금액
  refund_reason: Text,               // 환불 사유
  refunded_at: Timestamp,            // 환불 시각
  
  created_at: Timestamp,
  updated_at: Timestamp
}
```

#### 에스크로 내역: `escrows`
```sql
{
  id: UUID,
  transaction_id: UUID (FK → transactions.id),
  booking_id: UUID (FK → bookings.id),
  
  // 당사자
  consumer_id: UUID (FK → users.id),
  provider_id: UUID (FK → providers.id),
  
  // 금액
  escrow_amount: Decimal (10,2),     // 에스크로 금액
  released_amount: Decimal (10,2),   // 출금된 금액
  
  // 상태
  status: Enum,                      // 'held' | 'released' | 'refunded' | 'disputed'
  
  // 출금 정보
  release_date: Date,                // 출금 예정일
  auto_release_date: Date,           // 자동 출금일 (완료 후 48시간)
  released_at: Timestamp,            // 실제 출금 시각
  
  // 분쟁 정보
  dispute_id: UUID (FK → disputes.id), // 분쟁 ID
  
  created_at: Timestamp,
  updated_at: Timestamp
}
```

---

### 2.5 개인 지갑 (Personal Wallet)

#### 지갑 정보: `wallets` (제공자 섹션 1.4와 동일)
```sql
{
  // 구매자 관점의 지갑 정보
  // 주로 서비스 결제 및 환불 관리
}
```

---

## 3. 서비스 유형 (Service Types)

### 3.1 견적 요청 템플릿 (Quotation Request Templates)

#### 서비스 카테고리별 질문 템플릿: `ai_question_templates`
```sql
{
  id: UUID,
  category_id: UUID (FK → service_categories.id),
  
  // 질문 정보
  question_text: Text,               // 질문 내용
  question_order: Integer,           // 질문 순서
  question_type: Enum,               // 'text' | 'number' | 'date' | 'time' | 
                                     // 'multiple_choice' | 'photo_upload' | 'location'
  
  // 옵션 (선택형 질문)
  options: JSON,                     // 선택 옵션 배열
  /*
  options 구조 (multiple_choice):
  [
    {value: "split_type", label: "Split Type Aircon"},
    {value: "window_type", label: "Window Type Aircon"}
  ]
  */
  
  // 유효성 검증
  is_required: Boolean,              // 필수 항목 여부
  validation_rules: JSON,            // 유효성 검증 규칙
  
  // AI 힌트
  ai_context: Text,                  // AI에게 제공할 컨텍스트
  suggested_follow_up: JSON,         // 후속 질문 제안
  
  // 상태
  is_active: Boolean,                // 활성화 여부
  
  created_at: Timestamp,
  updated_at: Timestamp
}
```

#### AI 가격 산정 규칙: `ai_pricing_rules`
```sql
{
  id: UUID,
  category_id: UUID (FK → service_categories.id),
  
  // 규칙 정보
  rule_name: String (100),           // 규칙 이름
  rule_description: Text,            // 규칙 설명
  
  // 가격 계산 로직
  base_price: Decimal (10,2),        // 기본 가격
  pricing_formula: Text,             // 가격 계산 공식
  /*
  예시: "base_price + (units * unit_price) + (complexity_factor * 0.2)"
  */
  
  // 변수 정의
  variables: JSON,                   // 변수 정의
  /*
  variables 구조:
  {
    "units": {
      "type": "number",
      "source": "question_id_123",
      "description": "Number of aircon units"
    },
    "complexity_factor": {
      "type": "number",
      "source": "ai_analysis",
      "min": 1.0,
      "max": 3.0
    }
  }
  */
  
  // 조정 요소
  location_multiplier: JSON,         // 지역별 가격 조정
  time_multiplier: JSON,             // 시간대별 가격 조정
  demand_multiplier: Decimal (5,2),  // 수요 기반 가격 조정
  
  // 상태
  is_active: Boolean,
  effective_from: Date,              // 적용 시작일
  effective_to: Date,                // 적용 종료일
  
  created_at: Timestamp,
  updated_at: Timestamp
}
```

---

### 3.2 견적 제안 템플릿 (Bid Proposal Templates)

#### 입찰 제안 템플릿: `bid_templates`
```sql
{
  id: UUID,
  provider_id: UUID (FK → providers.id),
  category_id: UUID (FK → service_categories.id),
  
  // 템플릿 정보
  template_name: String (255),       // 템플릿 이름
  template_description: Text,        // 템플릿 설명
  
  // 기본 제안 내용
  default_work_plan: Text,           // 기본 작업 계획
  default_terms: Text,               // 기본 조건
  default_portfolio_items: JSON,     // 기본 포트폴리오 항목
  
  // 가격 설정
  default_pricing_strategy: Enum,    // 'competitive' | 'premium' | 'budget'
  price_adjustment_percentage: Decimal (5,2), // 가격 조정 비율 (AI 제안 대비)
  
  // 사용 통계
  times_used: Integer,               // 사용 횟수
  success_rate: Decimal (5,2),       // 낙찰률 (%)
  
  // 상태
  is_active: Boolean,
  is_default: Boolean,               // 기본 템플릿 여부
  
  created_at: Timestamp,
  updated_at: Timestamp
}
```

#### 제안서 섹션 구조: `bid_sections`
```sql
{
  id: UUID,
  template_id: UUID (FK → bid_templates.id),
  
  // 섹션 정보
  section_name: String (100),        // 섹션 이름 (예: "작업 범위", "일정", "가격")
  section_order: Integer,            // 섹션 순서
  section_content: Text,             // 섹션 내용
  
  // 섹션 유형
  section_type: Enum,                // 'text' | 'list' | 'table' | 'pricing' | 'timeline'
  
  // 필수 여부
  is_required: Boolean,              // 필수 섹션 여부
  is_editable: Boolean,              // 수정 가능 여부
  
  created_at: Timestamp,
  updated_at: Timestamp
}
```

---

## 4. 공통 데이터 구조

### 4.1 신뢰 점수 시스템 (Trust Score System)

#### 현재 신뢰 점수: `trust_scores`
```sql
{
  id: UUID,
  user_id: UUID (FK → users.id),
  
  // 종합 점수
  current_score: Integer (0-1000),   // 현재 신뢰 점수
  score_category: Enum,              // 'poor' | 'fair' | 'good' | 'very_good' | 'excellent'
  /*
  점수 구간:
  - poor: 0-299
  - fair: 300-499
  - good: 500-699
  - very_good: 700-849
  - excellent: 850-1000
  */
  
  // 점수 구성 요소 (각 최대 200점)
  on_time_completion_score: Integer, // 시간 준수 점수
  quality_rating_score: Integer,     // 품질 평가 점수
  response_time_score: Integer,      // 응답 시간 점수
  verification_score: Integer,       // 인증 점수
  transaction_volume_score: Integer, // 거래량 점수
  
  // 통계
  total_transactions: Integer,       // 총 거래 수
  successful_transactions: Integer,   // 성공한 거래 수
  disputed_transactions: Integer,    // 분쟁 거래 수
  average_rating: Decimal (3,2),     // 평균 평점
  
  last_calculated_at: Timestamp,     // 마지막 계산 시각
  updated_at: Timestamp
}
```

---

### 4.2 알림 시스템 (Notification System)

#### 알림 테이블: `notifications`
```sql
{
  id: UUID,
  user_id: UUID (FK → users.id),
  
  // 알림 정보
  notification_type: Enum,           // 'booking' | 'payment' | 'review' | 
                                     // 'message' | 'auction' | 'system'
  title: String (255),               // 알림 제목
  message: Text,                     // 알림 내용
  
  // 링크 정보
  action_url: String (500),          // 액션 URL
  related_entity_type: String (50),  // 관련 엔티티 유형
  related_entity_id: UUID,           // 관련 엔티티 ID
  
  // 우선순위
  priority: Enum,                    // 'low' | 'normal' | 'high' | 'urgent'
  
  // 상태
  is_read: Boolean,                  // 읽음 여부
  read_at: Timestamp,                // 읽은 시각
  
  // 전송 채널
  sent_via_push: Boolean,            // 푸시 알림 전송 여부
  sent_via_email: Boolean,           // 이메일 전송 여부
  sent_via_sms: Boolean,             // SMS 전송 여부
  
  // 만료
  expires_at: Timestamp,             // 만료 시각
  
  created_at: Timestamp
}
```

---

### 4.3 분쟁 관리 (Dispute Management)

#### 분쟁 테이블: `disputes`
```sql
{
  id: UUID,
  dispute_number: String (50),       // 분쟁 번호 (고유값)
  booking_id: UUID (FK → bookings.id),
  transaction_id: UUID (FK → transactions.id),
  
  // 당사자
  complainant_id: UUID (FK → users.id), // 제기자 ID
  respondent_id: UUID (FK → users.id),  // 피제기자 ID
  
  // 분쟁 정보
  dispute_reason: Enum,              // 'quality_issue' | 'payment_issue' | 
                                     // 'no_show' | 'breach_of_contract' | 'other'
  dispute_description: Text,         // 분쟁 설명
  evidence_photos: JSON,             // 증거 사진 URL 배열
  evidence_documents: JSON,          // 증거 문서 URL 배열
  
  // 중재 정보
  assigned_mediator_id: UUID,        // 배정된 중재자 ID
  ai_recommendation: Text,           // AI 중재 추천
  
  // 상태
  status: Enum,                      // 'submitted' | 'under_review' | 'mediation' | 
                                     // 'resolved' | 'escalated'
  
  // 결과
  resolution: Text,                  // 해결 방안
  resolution_date: Date,             // 해결 날짜
  compensation_amount: Decimal (10,2), // 보상 금액
  
  // 만족도
  complainant_satisfied: Boolean,    // 제기자 만족 여부
  respondent_satisfied: Boolean,     // 피제기자 만족 여부
  
  created_at: Timestamp,
  updated_at: Timestamp,
  resolved_at: Timestamp
}
```

---

### 4.4 채팅 및 메시지 (Chat & Messaging)

#### 채팅방 테이블: `chat_rooms`
```sql
{
  id: UUID,
  room_type: Enum,                   // 'direct' | 'support' | 'mediation'
  
  // 참여자
  user1_id: UUID (FK → users.id),
  user2_id: UUID (FK → users.id),
  
  // 관련 정보
  related_booking_id: UUID,          // 관련 예약 ID
  related_auction_id: UUID,          // 관련 경매 ID
  
  // 상태
  status: Enum,                      // 'active' | 'archived' | 'blocked'
  
  // 메타데이터
  last_message_at: Timestamp,        // 마지막 메시지 시각
  unread_count_user1: Integer,       // user1의 읽지 않은 메시지 수
  unread_count_user2: Integer,       // user2의 읽지 않은 메시지 수
  
  created_at: Timestamp,
  updated_at: Timestamp
}
```

#### 메시지 테이블: `messages`
```sql
{
  id: UUID,
  room_id: UUID (FK → chat_rooms.id),
  sender_id: UUID (FK → users.id),
  
  // 메시지 내용
  message_type: Enum,                // 'text' | 'image' | 'file' | 'system'
  message_text: Text,                // 메시지 텍스트
  attachment_url: String (500),      // 첨부파일 URL
  attachment_type: String (50),      // 첨부파일 유형
  
  // 상태
  is_read: Boolean,                  // 읽음 여부
  read_at: Timestamp,                // 읽은 시각
  
  // 시스템 메시지 정보
  system_event: String (100),        // 시스템 이벤트 유형
  
  created_at: Timestamp,
  updated_at: Timestamp,
  deleted_at: Timestamp              // 삭제 시각 (소프트 삭제)
}
```

---

## 5. 데이터 관계도

### 5.1 핵심 엔티티 관계

```
users (사용자)
├─── user_profiles (프로필 상세)
├─── providers (제공자 정보)
│    ├─── services (제공 서비스)
│    └─── auction_bids (입찰)
├─── trust_scores (신뢰 점수)
│    └─── trust_score_history (점수 변경 이력)
├─── wallets (지갑)
│    ├─── wallet_transactions (지갑 거래)
│    └─── reward_credit_transactions (크레딧 거래)
├─── ai_quotation_sessions (AI 견적 세션)
└─── auctions (경매)
     └─── auction_bids (입찰)
          └─── bookings (예약)
               ├─── smart_contracts (스마트 계약)
               ├─── transactions (거래)
               │    └─── escrows (에스크로)
               ├─── reviews (리뷰)
               └─── disputes (분쟁)
```

### 5.2 주요 데이터 흐름

#### 서비스 제공자 여정:
1. **가입** → `users` + `user_profiles` + `providers` 생성
2. **서비스 등록** → `services` 생성
3. **경매 참여** → `auction_bids` 생성 (크레딧 소모)
4. **낙찰** → `bookings` + `smart_contracts` 생성
5. **서비스 제공** → `bookings.status` 업데이트
6. **완료 및 리뷰** → `reviews` 생성, `trust_scores` 업데이트
7. **정산** → `transactions` 완료, `wallets` 입금

#### 서비스 구매자 여정:
1. **가입** → `users` + `user_profiles` 생성
2. **AI 견적** → `ai_quotation_sessions` 생성
3. **경매 생성** → `auctions` 발행
4. **입찰 검토** → `auction_bids` 리뷰
5. **제공자 선택** → `bookings` 생성
6. **계약 서명** → `smart_contracts` 활성화
7. **결제** → `transactions` + `escrows` 생성
8. **서비스 확인** → `bookings` 완료, 에스크로 출금
9. **리뷰 작성** → `reviews` 생성

---

## 부록: 데이터 보안 및 개인정보 보호

### 암호화 필드
다음 필드는 데이터베이스 레벨에서 암호화되어야 합니다:
- `users.password_hash` (bcrypt)
- `providers.government_id_number` (AES-256)
- `providers.tin_number` (AES-256)
- `wallet_transactions.payment_reference` (AES-256)
- `smart_contracts.consumer_signature` (AES-256)
- `smart_contracts.provider_signature` (AES-256)

### GDPR/개인정보보호법 준수
- 모든 사용자 데이터는 `deleted_at` 필드를 통한 소프트 삭제 지원
- 사용자 요청 시 완전 삭제 기능 제공
- 데이터 다운로드 및 이전 기능 지원
- 최소 5년간 거래 기록 보관 (BSP 규정)

---

**문서 끝**
