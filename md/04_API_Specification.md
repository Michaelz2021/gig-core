# AI 기반 서비스 제공자 검증 시스템
## Part 4: API 명세서 (API Specification)

---

## 1. API 개요

### 1.1 Base URL

**Production:**
```
https://api.aigigmarket.ph/v1
```

**Staging:**
```
https://api-staging.aigigmarket.ph/v1
```

### 1.2 인증

모든 API 요청은 JWT 토큰을 사용한 인증이 필요합니다 (공개 엔드포인트 제외).

**Header:**
```
Authorization: Bearer <JWT_TOKEN>
```

### 1.3 공통 응답 형식

**성공 응답:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Success message",
  "timestamp": "2025-11-02T10:30:00Z"
}
```

**에러 응답:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": { ... }
  },
  "timestamp": "2025-11-02T10:30:00Z"
}
```

### 1.4 HTTP 상태 코드

| 코드 | 설명 |
|------|------|
| 200 | OK - 요청 성공 |
| 201 | Created - 리소스 생성 성공 |
| 400 | Bad Request - 잘못된 요청 |
| 401 | Unauthorized - 인증 실패 |
| 403 | Forbidden - 권한 없음 |
| 404 | Not Found - 리소스 없음 |
| 409 | Conflict - 중복 리소스 |
| 422 | Unprocessable Entity - 유효성 검사 실패 |
| 429 | Too Many Requests - Rate Limit 초과 |
| 500 | Internal Server Error - 서버 오류 |

---

## 2. 인증 (Authentication)

### 2.1 회원가입

```
POST /auth/register
```

**Request Body:**
```json
{
  "phone_number": "+639123456789",
  "password": "SecurePassword123!",
  "first_name": "Juan",
  "last_name": "Dela Cruz",
  "account_type": "provider",
  "email": "juan@example.com"
}
```

**Response: (201 Created)**
```json
{
  "success": true,
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "phone_number": "+639123456789",
    "account_type": "provider",
    "verification_required": true,
    "otp_sent": true
  },
  "message": "OTP sent to your phone number"
}
```

---

### 2.2 OTP 인증

```
POST /auth/verify-otp
```

**Request Body:**
```json
{
  "phone_number": "+639123456789",
  "otp_code": "123456"
}
```

**Response: (200 OK)**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600,
    "token_type": "Bearer",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "phone_number": "+639123456789",
      "account_type": "provider",
      "kyc_level": 0
    }
  }
}
```

---



### 2.3 로그인

```
POST /auth/login
```

**Request Body:**
```json
{
  "phone_number": "+639123456789",
  "password": "SecurePassword123!"
}
```

**Response: (200 OK)**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600,
    "token_type": "Bearer"
  }
}
```

---

## 3. 검증 (Verification)

### 3.1 신분증 검증 제출

```
POST /verification/id-card
```

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data
```

**Request Body (Multipart Form Data):**
```
id_photo: <FILE> (JPEG/PNG, max 10MB)
selfie_photo: <FILE> (JPEG/PNG, max 10MB)
id_type: "national_id" | "drivers_license" | "passport"
```

**Response: (202 Accepted)**
```json
{
  "success": true,
  "data": {
    "verification_id": "660e8400-e29b-41d4-a716-446655440001",
    "status": "processing",
    "estimated_completion_seconds": 30,
    "message": "Your ID is being verified. You'll receive a notification shortly."
  }
}
```

---

### 3.2 검증 상태 조회

```
GET /verification/{verification_id}
```

**Response: (200 OK)**
```json
{
  "success": true,
  "data": {
    "verification_id": "660e8400-e29b-41d4-a716-446655440001",
    "verification_type": "id_card",
    "status": "approved",
    "submitted_at": "2025-11-02T10:00:00Z",
    "verified_at": "2025-11-02T10:00:25Z",
    "ai_confidence_score": 96.5,
    "verified_by_type": "ai",
    "details": {
      "id_number": "1234-5678-9012",
      "full_name": "Juan Dela Cruz",
      "date_of_birth": "1990-05-15",
      "face_match_score": 98.2,
      "liveness_check_passed": true,
      "document_authenticity": "verified"
    },
    "kyc_level_granted": 1
  }
}
```

---

### 3.3 자격증 검증 제출

```
POST /verification/certificate
```

**Request Body (Multipart Form Data):**
```
certificate_photo: <FILE>
certificate_type: "tesda" | "prc" | "other"
certificate_number: "CERT-12345"
issuing_authority: "TESDA"
issue_date: "2023-01-15"
expiry_date: "2028-01-14" (optional)
```

**Response: (202 Accepted)**
```json
{
  "success": true,
  "data": {
    "verification_id": "660e8400-e29b-41d4-a716-446655440002",
    "status": "under_review",
    "message": "Certificate verification in progress. Typically takes 24-48 hours for manual review."
  }
}
```

---

### 3.4 스킬 테스트 시작

```
POST /verification/skill-test/start
```

**Request Body:**
```json
{
  "test_id": "test-aircon-cleaning-intermediate",
  "category": "home_services",
  "sub_category": "aircon_cleaning"
}
```

**Response: (200 OK)**
```json
{
  "success": true,
  "data": {
    "session_id": "session-abc123",
    "test_name": "Aircon Cleaning - Intermediate",
    "test_type": "quiz",
    "time_limit_seconds": 900,
    "total_questions": 15,
    "passing_score": 80,
    "questions": [
      {
        "question_id": "q1",
        "question_text": "What should be the first step when cleaning an aircon?",
        "question_type": "multiple_choice",
        "options": [
          {"id": "a", "text": "Turn off power supply"},
          {"id": "b", "text": "Remove filter"},
          {"id": "c", "text": "Spray cleaning solution"},
          {"id": "d", "text": "Open the unit"}
        ]
      }
      // ... more questions
    ],
    "started_at": "2025-11-02T10:30:00Z",
    "expires_at": "2025-11-02T10:45:00Z"
  }
}
```

---

### 3.5 스킬 테스트 제출

```
POST /verification/skill-test/submit
```

**Request Body:**
```json
{
  "session_id": "session-abc123",
  "answers": [
    {"question_id": "q1", "selected_option": "a"},
    {"question_id": "q2", "selected_option": "b"}
    // ... all answers
  ],
  "time_taken_seconds": 720
}
```

**Response: (200 OK)**
```json
{
  "success": true,
  "data": {
    "test_result_id": "result-xyz789",
    "passed": true,
    "score": 87,
    "passing_score": 80,
    "correct_answers": 13,
    "total_questions": 15,
    "time_taken": "12 minutes",
    "feedback": {
      "strengths": ["Safety procedures", "Tool usage"],
      "improvement_areas": ["Troubleshooting", "Customer communication"]
    },
    "certificate_issued": true,
    "trust_score_bonus": 20
  }
}
```

---

### 3.6 포트폴리오 제출

```
POST /verification/portfolio
```

**Request Body (Multipart Form Data):**
```
title: "Aircon Cleaning Project - Residential"
description: "Cleaned 3 split-type aircon units in a 2-bedroom apartment"
category: "home_services"
images[]: <FILE> (multiple files)
completion_date: "2025-10-15"
```

**Response: (202 Accepted)**
```json
{
  "success": true,
  "data": {
    "portfolio_item_id": "portfolio-item-123",
    "status": "verifying",
    "message": "AI is verifying your portfolio images. This may take a few minutes."
  }
}
```

---

## 4. Trust Score

### 4.1 Trust Score 조회

```
GET /trust-score/{user_id}
```

**Response: (200 OK)**
```json
{
  "success": true,
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "current_score": 522,
    "level": 2,
    "rank": "Intermediate",
    "percentile": 68,
    "components": {
      "completion_rate": {
        "score": 360,
        "max": 400,
        "percentage": 90,
        "details": {
          "total_jobs": 45,
          "completed_jobs": 42,
          "cancelled_jobs": 3
        }
      },
      "response_time": {
        "score": 180,
        "max": 200,
        "percentage": 90,
        "avg_response_minutes": 12
      },
      "rating": {
        "score": 184,
        "max": 200,
        "percentage": 92,
        "avg_rating": 4.6,
        "total_reviews": 38
      },
      "dispute_history": {
        "score": 85,
        "max": 100,
        "total_disputes": 1,
        "resolved_favorably": 1
      },
      "transaction_volume": {
        "score": 80,
        "max": 100,
        "total_jobs": 45
      }
    },
    "recent_changes": [
      {
        "date": "2025-11-02",
        "change": +15,
        "reason": "Completed job with 5-star rating"
      },
      {
        "date": "2025-10-30",
        "change": -5,
        "reason": "Slightly late arrival"
      }
    ],
    "next_milestone": {
      "level": 3,
      "required_score": 700,
      "points_needed": 178,
      "estimated_jobs": 12
    },
    "improvement_tips": [
      "Respond to messages within 10 minutes to maximize response score",
      "Complete 10 more jobs to increase transaction volume score",
      "Maintain your high completion rate and rating"
    ],
    "calculated_at": "2025-11-02T10:30:00Z"
  }
}
```

---

### 4.2 Trust Score 이력 조회

```
GET /trust-score/{user_id}/history?days=30
```

**Query Parameters:**
- `days`: Number of days to retrieve (default: 30, max: 365)

**Response: (200 OK)**
```json
{
  "success": true,
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "period": {
      "from": "2025-10-03",
      "to": "2025-11-02"
    },
    "history": [
      {
        "date": "2025-11-02",
        "score": 522,
        "change": +15,
        "reason": "job_completed",
        "details": "Job #12345 completed with 5-star rating"
      },
      {
        "date": "2025-11-01",
        "score": 507,
        "change": +10,
        "reason": "positive_review",
        "details": "Received excellent review from customer"
      }
      // ... more history
    ],
    "statistics": {
      "highest_score": 525,
      "lowest_score": 450,
      "average_score": 493,
      "total_changes": 18,
      "positive_changes": 15,
      "negative_changes": 3
    }
  }
}
```

---

## 5. 작업 (Jobs) & 옥션 (Auctions)

### 5.1 작업 생성 (AI 견적 요청)

```
POST /jobs/create
```

**Request Body:**
```json
{
  "category": "home_services",
  "sub_category": "aircon_cleaning",
  "description": "Need cleaning for 2 split-type aircon units. Not cooling properly, making weird noise.",
  "location": {
    "latitude": 14.5995,
    "longitude": 120.9842,
    "address": "123 Main Street, Quezon City",
    "city": "Quezon City",
    "province": "Metro Manila"
  },
  "preferred_date": "2025-11-05",
  "preferred_time": "14:00:00",
  "urgency": "within_week",
  "budget_max": 2000,
  "requirements": [
    "Professional tools required",
    "Must provide before/after photos"
  ],
  "minimum_provider_level": 2,
  "minimum_trust_score": 400,
  "insurance_required": true
}
```

**Response: (201 Created)**
```json
{
  "success": true,
  "data": {
    "job_id": "job-abc123",
    "status": "open",
    "ai_analysis": {
      "estimated_price": 1900,
      "price_range": {
        "min": 1500,
        "max": 2200
      },
      "confidence": 85,
      "based_on_transactions": 243,
      "estimated_duration_hours": 2,
      "recommended_skills": [
        "TESDA Certified",
        "3+ years experience"
      ]
    },
    "auction": {
      "deadline": "2025-11-03T14:00:00Z",
      "hours_remaining": 24,
      "matched_providers_count": 18
    },
    "created_at": "2025-11-02T14:00:00Z"
  },
  "message": "Job created successfully. Providers are being notified."
}
```

---

### 5.2 작업 목록 조회 (제공자용)

```
GET /jobs/available?category=home_services&distance=10
```

**Query Parameters:**
- `category`: Filter by category
- `distance`: Max distance in km (default: 10)
- `min_price`: Minimum price
- `max_price`: Maximum price
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response: (200 OK)**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "job_id": "job-abc123",
        "title": "Aircon Cleaning - 2 Units",
        "category": "home_services",
        "sub_category": "aircon_cleaning",
        "budget_range": {
          "min": null,
          "max": 2000
        },
        "ai_estimated_price": 1900,
        "location": {
          "city": "Quezon City",
          "distance_km": 5.2
        },
        "urgency": "within_week",
        "auction_deadline": "2025-11-03T14:00:00Z",
        "hours_remaining": 20,
        "current_bids_count": 3,
        "lowest_bid": 1650,
        "customer": {
          "trust_score": 720,
          "total_jobs": 12,
          "avg_rating": 4.8,
          "response_rate": "95%"
        },
        "match_score": 92,
        "match_reasons": [
          "High skill match (95%)",
          "Close proximity (5.2 km)",
          "Your Trust Score meets requirement"
        ],
        "created_at": "2025-11-02T14:00:00Z"
      }
      // ... more jobs
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 87,
      "items_per_page": 20
    }
  }
}
```

---

### 5.3 입찰 제출

```
POST /bids/submit
```

**Request Body:**
```json
{
  "job_id": "job-abc123",
  "bid_amount": 1600,
  "proposed_date": "2025-11-03",
  "proposed_time": "15:00:00",
  "estimated_duration_hours": 2.5,
  "proposal_text": "Hello! I'm a TESDA-certified aircon technician with 5 years of experience. I'll thoroughly clean your units and provide 3-month warranty. I use only genuine cleaning products and will provide before/after photos.",
  "includes_materials": true,
  "materials_cost": 100,
  "warranty_offered": "3-month free follow-up service",
  "portfolio_attachments": [
    "https://s3.../portfolio1.jpg",
    "https://s3.../portfolio2.jpg"
  ]
}
```

**Response: (201 Created)**
```json
{
  "success": true,
  "data": {
    "bid_id": "bid-xyz789",
    "job_id": "job-abc123",
    "status": "pending",
    "bid_amount": 1600,
    "reward_credits_spent": 1,
    "remaining_credits": 9,
    "ai_analysis": {
      "quality_score": 88,
      "spam_score": 0.02,
      "competitiveness": "high",
      "win_probability": 65
    },
    "submitted_at": "2025-11-02T15:30:00Z",
    "message": "Your bid has been submitted successfully. The customer will be notified."
  }
}
```

---

### 5.4 입찰 목록 조회 (고객용)

```
GET /jobs/{job_id}/bids
```

**Response: (200 OK)**
```json
{
  "success": true,
  "data": {
    "job_id": "job-abc123",
    "total_bids": 5,
    "bids": [
      {
        "bid_id": "bid-xyz789",
        "provider": {
          "user_id": "provider-001",
          "name": "Juan Dela Cruz",
          "profile_photo": "https://s3.../photo.jpg",
          "trust_score": 522,
          "level": 2,
          "verification_badges": ["TESDA Certified", "ID Verified"],
          "avg_rating": 4.6,
          "total_jobs": 45,
          "completion_rate": 93,
          "response_time": "12 minutes average"
        },
        "bid_amount": 1600,
        "proposed_schedule": {
          "date": "2025-11-03",
          "time": "15:00:00"
        },
        "estimated_duration": "2.5 hours",
        "proposal": "Hello! I'm a TESDA-certified aircon technician...",
        "portfolio_samples": [
          "https://s3.../portfolio1.jpg",
          "https://s3.../portfolio2.jpg"
        ],
        "warranty": "3-month free follow-up service",
        "includes_materials": true,
        "ai_recommendation": {
          "score": 92,
          "reasons": [
            "Competitive price",
            "High trust score",
            "Excellent reviews",
            "Quick availability"
          ]
        },
        "submitted_at": "2025-11-02T15:30:00Z"
      }
      // ... more bids sorted by AI recommendation score
    ],
    "ai_top_recommendation": "bid-xyz789"
  }
}
```

---

### 5.5 제공자 선택 (입찰 수락)

```
POST /jobs/{job_id}/select-provider
```

**Request Body:**
```json
{
  "bid_id": "bid-xyz789",
  "selection_reason": "Best combination of price, reviews, and availability"
}
```

**Response: (200 OK)**
```json
{
  "success": true,
  "data": {
    "job_id": "job-abc123",
    "selected_provider_id": "provider-001",
    "selected_bid_id": "bid-xyz789",
    "next_steps": [
      "Smart contract will be generated",
      "Both parties will receive signature request",
      "Escrow payment will be initiated"
    ],
    "contract": {
      "contract_id": "contract-def456",
      "status": "pending_signatures",
      "total_amount": 1732,
      "breakdown": {
        "service_amount": 1600,
        "platform_fee": 112,
        "insurance_premium": 20
      }
    }
  },
  "message": "Provider selected successfully. Please proceed to sign the contract."
}
```

---

## 6. 계약 (Contracts)

### 6.1 계약서 조회

```
GET /contracts/{contract_id}
```

**Response: (200 OK)**
```json
{
  "success": true,
  "data": {
    "contract_id": "contract-def456",
    "job_id": "job-abc123",
    "status": "pending_signatures",
    "parties": {
      "customer": {
        "user_id": "customer-001",
        "name": "Kim Min-ho",
        "signed": false
      },
      "provider": {
        "user_id": "provider-001",
        "name": "Juan Dela Cruz",
        "signed": false
      }
    },
    "terms": {
      "service_description": "Wall-mounted Aircon Cleaning & Inspection",
      "scope_of_work": [
        "Filter cleaning and washing",
        "Internal unit cleaning",
        "Gas pressure inspection",
        "Basic functionality test",
        "Customer education on maintenance"
      ],
      "deliverables": [
        "Before/after photos",
        "Service completion report",
        "Maintenance recommendations"
      ],
      "out_of_scope": [
        "Gas refilling: ₱1,000-1,500 additional",
        "Part replacement: Actual cost"
      ]
    },
    "schedule": {
      "start_date": "2025-11-03",
      "start_time": "14:00:00",
      "estimated_duration": "2-3 hours",
      "location": "123 Main Street, Quezon City"
    },
    "payment": {
      "service_amount": 1600,
      "platform_fee": 112,
      "insurance_premium": 20,
      "total_amount": 1732,
      "currency": "PHP"
    },
    "completion_criteria": [
      "Provider uploads before/after photos",
      "Customer confirms satisfactory completion",
      "AI verifies photo quality and work completion"
    ],
    "auto_release": {
      "enabled": true,
      "hours_after_submission": 48
    },
    "cancellation_policy": {
      "customer_cancels_24h_before": "Full refund",
      "customer_cancels_less_24h": "25% cancellation fee",
      "customer_no_show": "50% fee",
      "provider_cancels_24h_before": "No penalty",
      "provider_cancels_less_24h": "-3 reward credits + Trust Score deduction",
      "provider_no_show": "Account suspension + full refund"
    },
    "dispute_resolution": "7-day mediation process with AI assistance and human mediator final decision",
    "insurance": {
      "property_damage_coverage": 50000,
      "premium": 20
    },
    "warranty": "3-month free after-service support",
    "blockchain": {
      "network": "polygon",
      "hash": null,
      "recorded": false
    },
    "ai_generated": true,
    "template_version": "v1.2",
    "created_at": "2025-11-02T16:00:00Z"
  }
}
```

---

### 6.2 계약서 서명

```
POST /contracts/{contract_id}/sign
```

**Request Body:**
```json
{
  "signature_method": "biometric",
  "agree_to_terms": true,
  "signature_hash": "a1b2c3d4e5f6..." // Client-generated hash
}
```

**Response: (200 OK)**
```json
{
  "success": true,
  "data": {
    "contract_id": "contract-def456",
    "your_signature": {
      "signed": true,
      "signature_hash": "a1b2c3d4e5f6...",
      "signed_at": "2025-11-02T16:15:00Z"
    },
    "contract_status": "active",
    "both_parties_signed": true,
    "blockchain": {
      "recorded": true,
      "hash": "0x7f3a9b2e1d8c4f5a6b9e3d2c1f4a8b7e6d5c9f2a1b8e7d6c5f4a3b2e1d9c8f7a6b",
      "network": "polygon"
    },
    "next_step": "proceed_to_payment"
  },
  "message": "Contract signed successfully. Please proceed with escrow payment."
}
```

---

## 7. 거래 및 결제 (Transactions & Payments)

### 7.1 에스크로 결제 시작

```
POST /transactions/escrow/deposit
```

**Request Body:**
```json
{
  "contract_id": "contract-def456",
  "payment_method": "gcash",
  "return_url": "https://app.aigigmarket.ph/payment/callback"
}
```

**Response: (200 OK)**
```json
{
  "success": true,
  "data": {
    "transaction_id": "txn-abc123",
    "amount": 1732,
    "currency": "PHP",
    "payment_method": "gcash",
    "status": "pending",
    "payment_url": "https://api.gcash.com/payment/redirect?token=xyz",
    "expires_at": "2025-11-02T16:45:00Z",
    "reference_number": "AIGM-20251102-ABC123"
  },
  "message": "Redirecting to GCash for payment..."
}
```

---

### 7.2 결제 상태 확인

```
GET /transactions/{transaction_id}
```

**Response: (200 OK)**
```json
{
  "success": true,
  "data": {
    "transaction_id": "txn-abc123",
    "contract_id": "contract-def456",
    "job_id": "job-abc123",
    "amount": 1732,
    "currency": "PHP",
    "transaction_type": "escrow_deposit",
    "payment_method": "gcash",
    "payment_reference": "GC-20251102-XYZ789",
    "status": "completed",
    "escrow": {
      "held_until": "2025-11-05T18:00:00Z",
      "auto_release_enabled": true,
      "can_release_after": "Service completion + customer approval or 48h"
    },
    "blockchain": {
      "recorded": true,
      "hash": "0x9f8e7d6c5b4a3e2d1c9f8e7d6c5b4a3e2d1c9f8e7d6c5b4a3e2d1c9f8e7d6c5b",
      "network": "polygon"
    },
    "created_at": "2025-11-02T16:30:00Z",
    "completed_at": "2025-11-02T16:32:15Z"
  }
}
```

---

## 8. 작업 완료 (Job Completion)

### 8.1 완료 증명 제출

```
POST /jobs/{job_id}/complete
```

**Request Body (Multipart Form Data):**
```
photos_before[]: <FILE> (multiple files, required)
photos_after[]: <FILE> (multiple files, required)
completion_notes: "Cleaned both aircon units thoroughly. Gas pressure is normal. Units are working efficiently now. Recommended next cleaning in 3 months."
actual_start_time: "2025-11-03T14:00:00Z"
actual_end_time: "2025-11-03T16:15:00Z"
```

**Response: (202 Accepted)**
```json
{
  "success": true,
  "data": {
    "job_completion_id": "completion-ghi789",
    "job_id": "job-abc123",
    "status": "verifying",
    "ai_verification": {
      "status": "analyzing",
      "estimated_completion_seconds": 60
    },
    "message": "AI is verifying your completion proof. Customer will be notified once approved."
  }
}
```

---

### 8.2 완료 검증 결과 조회

```
GET /jobs/{job_id}/completion
```

**Response: (200 OK)**
```json
{
  "success": true,
  "data": {
    "job_completion_id": "completion-ghi789",
    "job_id": "job-abc123",
    "provider_id": "provider-001",
    "submitted_at": "2025-11-03T16:20:00Z",
    "ai_verification": {
      "status": "approved",
      "confidence_score": 96,
      "quality_score": 94,
      "analysis": {
        "image_quality": {
          "passed": true,
          "average_score": 92
        },
        "before_after_comparison": {
          "passed": true,
          "improvement_percentage": 85
        },
        "metadata_verification": {
          "passed": true,
          "timestamp_valid": true,
          "location_match": true
        },
        "fraud_check": {
          "passed": true,
          "risk_score": 0.05
        },
        "scope_verification": {
          "passed": true,
          "all_deliverables_met": true
        }
      },
      "recommendation": "auto_approve",
      "verified_at": "2025-11-03T16:21:30Z"
    },
    "customer_approval": {
      "required": true,
      "status": "pending",
      "deadline": "2025-11-05T16:21:30Z",
      "auto_approve_in_hours": 48
    },
    "photos": {
      "before": [
        "https://s3.../before1.jpg",
        "https://s3.../before2.jpg"
      ],
      "after": [
        "https://s3.../after1.jpg",
        "https://s3.../after2.jpg",
        "https://s3.../after3.jpg"
      ]
    },
    "completion_notes": "Cleaned both aircon units thoroughly...",
    "actual_duration": {
      "start": "2025-11-03T14:00:00Z",
      "end": "2025-11-03T16:15:00Z",
      "duration_minutes": 135
    }
  }
}
```

---

### 8.3 고객 확인

```
POST /jobs/{job_id}/completion/approve
```

**Request Body:**
```json
{
  "approved": true,
  "comments": "Excellent work! The aircons are working perfectly now. Very professional service."
}
```

**Response: (200 OK)**
```json
{
  "success": true,
  "data": {
    "job_id": "job-abc123",
    "completion_status": "approved",
    "approved_at": "2025-11-03T18:00:00Z",
    "payment_release": {
      "status": "released",
      "amount": 1600,
      "released_to": "provider-001",
      "released_at": "2025-11-03T18:00:15Z"
    },
    "next_step": "please_leave_review"
  },
  "message": "Payment released to provider. Please leave a review to complete the transaction."
}
```

---

## 9. 리뷰 (Reviews)

### 9.1 리뷰 작성

```
POST /reviews
```

**Request Body:**
```json
{
  "job_id": "job-abc123",
  "overall_rating": 5,
  "professionalism_rating": 5,
  "communication_rating": 5,
  "quality_rating": 5,
  "punctuality_rating": 4,
  "value_rating": 5,
  "review_title": "Excellent Aircon Cleaning Service!",
  "review_text": "Juan did an amazing job cleaning both aircon units. He was very professional, explained everything clearly, and the results are fantastic. The aircons are cooling much better now. Highly recommend!",
  "pros": "Professional, thorough work, good communication",
  "cons": "Arrived 5 minutes late (minor)",
  "would_recommend": true,
  "media_urls": [
    "https://s3.../review_photo1.jpg"
  ]
}
```

**Response: (201 Created)**
```json
{
  "success": true,
  "data": {
    "review_id": "review-jkl012",
    "job_id": "job-abc123",
    "overall_rating": 5,
    "status": "published",
    "ai_analysis": {
      "sentiment_score": 0.95,
      "spam_detected": false,
      "fake_review_probability": 0.02,
      "authenticity": "high"
    },
    "trust_score_impact": {
      "provider": +25,
      "customer": +5
    },
    "reward_credits_earned": {
      "provider": 3,
      "customer": 1
    },
    "created_at": "2025-11-03T18:30:00Z"
  },
  "message": "Review published successfully. Thank you for your feedback!"
}
```

---

## 10. 분쟁 (Disputes)

### 10.1 분쟁 제기

```
POST /disputes
```

**Request Body (Multipart Form Data):**
```json
{
  "job_id": "job-abc123",
  "dispute_type": "incomplete_work",
  "description": "The provider claimed to clean both units but only cleaned one. The second unit still has a dirty filter and is not cooling properly.",
  "evidence_urls": [
    "https://s3.../evidence1.jpg",
    "https://s3.../evidence2.jpg"
  ]
}
```

**Response: (201 Created)**
```json
{
  "success": true,
  "data": {
    "dispute_id": "dispute-mno345",
    "job_id": "job-abc123",
    "status": "pending",
    "filed_at": "2025-11-04T10:00:00Z",
    "ai_analysis": {
      "initial_assessment": "in_progress",
      "estimated_completion_minutes": 15
    },
    "escrow_status": "held",
    "next_steps": [
      "AI will analyze the evidence",
      "Both parties will be notified",
      "Mediator may be assigned if needed"
    ]
  },
  "message": "Dispute filed successfully. We'll investigate and get back to you within 24 hours."
}
```

---

이 문서는 Part 4입니다. 

주요 API 엔드포인트들을 상세히 정의했습니다. 

추가 문서:
- Part 5: 배포 및 스케일링 가이드
- Part 6: 보안 및 규정 준수

실제 구현 시에는 Swagger/OpenAPI 스펙으로 변환하여 자동 문서화를 권장합니다.
