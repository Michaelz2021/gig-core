모든 항목을 종합하여 전면 재설계한 Trust Score 시스템을 제안드립니다.

---

# 🏆 Gig-Market Provider Trust Score — Full Redesign (v2)
## Total: **1,000 Points** across **6 Pillars**

---

## 📐 Architecture Overview

```
Trust Score (1,000 pts)
├── PILLAR 1: Identity & Verification        (150 pts)  — WHO you are
├── PILLAR 2: Credentials & Expertise        (150 pts)  — WHAT you know
├── PILLAR 3: Profile & Market Presence      (100 pts)  — HOW you present
├── PILLAR 4: Transaction Performance        (300 pts)  — HOW you execute
├── PILLAR 5: Communication & Reporting      (150 pts)  — HOW you communicate
└── PILLAR 6: Reward & Recognition           (150 pts)  — HOW clients reward you
```

---

## PILLAR 1 — Identity & Verification `150 pts`
*Who you are — foundational trust signals*

| # | Factor | Points | Method |
|---|--------|--------|--------|
| 1.1 | Email Verification (at registration) | 10 | Confirmed email link |
| 1.2 | Phone Verification (OTP via Semaphore) | 15 | SMS 6-digit OTP |
| 1.3 | Government ID Validation | 50 | OCR + AI liveness check (PhilSys, Passport, Driver's License) |
| 1.4 | Address Verification | 25 | Utility bill or bank statement upload |
| 1.5 | Provider Type Declaration | 10 | Individual or Registered Company |
| 1.6 | Business Registration (Company only) | 40 | SEC / DTI / BIR document |

> **Logic:** Company providers receive higher base credibility. Individual providers can compensate via Credentials (Pillar 2).

---

## PILLAR 2 — Credentials & Expertise `150 pts`
*What you know — verified professional competence*

| # | Factor | Points | Method |
|---|--------|--------|--------|
| 2.1 | TESDA National Certificate (NC I–NC IV) | 30 | Certificate upload → AI OCR validation |
| 2.2 | PRC Professional License | 40 | PRC license number → API or manual review |
| 2.3 | Other Industry Certifications | 20 | Upload + admin review (e.g., HVAC, AWS, CHED) |
| 2.4 | AI Skill Assessment Test | 40 | In-app AI-generated test per service category |
| 2.5 | Certification Recency Bonus | 20 | Cert issued within last 3 years → bonus |

> **AI Skill Test Design:** Category-specific multiple choice + practical scenario questions. Score ≥ 80% → full points. Score 60–79% → partial. Score < 60% → 0 pts, retake allowed after 30 days.

---

## PILLAR 3 — Profile & Market Presence `100 pts`
*How you present yourself — market visibility & professionalism*

| # | Factor | Points | Method |
|---|--------|--------|--------|
| 3.1 | Profile Photo (professional quality) | 10 | AI photo quality check |
| 3.2 | Portfolio Validation (min. 3 before/after photos) | 30 | AI authenticity check + admin review |
| 3.3 | Portfolio Experience Depth | 20 | Number of verified portfolio projects (≥10 → full) |
| 3.4 | Bio Completeness (min. 100 chars) | 10 | Character count + readability check |
| 3.5 | Provider Advertisement / Featured Listing | 20 | Active paid ad → signals platform commitment |
| 3.6 | Service Area Coverage | 10 | # of cities/regions covered |

> **Portfolio Validation Logic (AI):** Check for image duplication, stock photo detection, metadata consistency, and before/after logical coherence.

---

## PILLAR 4 — Transaction Performance `300 pts`
*How you execute — the core of service quality*

### 4A. Order Execution `180 pts`

| # | Factor | Points | Measurement |
|---|--------|--------|-------------|
| 4.1 | Quotation Success Rate | 30 | Accepted quotes / Total quotes submitted |
| 4.2 | Project Success Rate (overall) | 50 | Successfully completed / Total accepted orders |
| 4.3 | Quick Order (Instant) Success Rate | 30 | Instant jobs completed on time / Total instant jobs |
| 4.4 | Regular Order Success Rate | 30 | Regular jobs completed / Total regular jobs |
| 4.5 | Number of Completed Projects | 40 | Volume milestone scoring (10/25/50/100/200+ jobs) |

> **Order Type Split:** Quick Order and Regular Order are tracked separately because instant jobs demand different reliability. A provider strong in both earns full points.

### 4B. Financial Performance `120 pts`

| # | Factor | Points | Measurement |
|---|--------|--------|-------------|
| 4.6 | Total Service Payment Amount (Lifetime) | 50 | Cumulative GMV milestone (₱10K/₱50K/₱100K/₱500K+) |
| 4.7 | Average Order Value Trend | 30 | Rising AOV = gaining client trust |
| 4.8 | No-show / Last-minute Cancellation Rate | 40 | Lower rate → higher score (inverse scoring) |

---

## PILLAR 5 — Communication & Reporting `150 pts`
*How you communicate — professionalism in workflow*

| # | Factor | Points | Measurement |
|---|--------|--------|-------------|
| 5.1 | Response Time (initial reply to inquiry) | 40 | ≤15 min → full; 15–60 min → partial; >1hr → 0 |
| 5.2 | Response Style Quality | 30 | AI sentiment + grammar scoring of chat messages |
| 5.3 | Completion Report Submission Rate | 30 | % of jobs with report submitted vs. skipped |
| 5.4 | Completion Report Quality Score | 50 | AI evaluation: photo quality, description length, accuracy |

> **Completion Report Quality (AI Evaluation):**
> - Did the report include before/after photos? (+)
> - Was the description ≥ 100 characters? (+)
> - Did completion time match the contract estimate? (+)
> - Were materials used accurately listed? (+)

---

## PILLAR 6 — Reward & Recognition `150 pts`
*How clients reward you — the ultimate quality signal*

| # | Factor | Points | Measurement |
|---|--------|--------|-------------|
| 6.1 | Overall Star Rating (weighted, time-decayed) | 60 | Recent reviews weighted higher |
| 6.2 | Reward Credits Earned Rate | 30 | Avg. credits earned per completed job |
| 6.3 | Service Tips Received | 30 | % of jobs where client gave a tip (voluntary) |
| 6.4 | Repeat Hire Rate | 30 | % of clients who re-booked the same provider |

> **Service Tip as a Trust Signal:** A tip is a completely voluntary, non-manipulable action. A provider who consistently receives tips is a genuinely exceptional performer. This is a unique and powerful quality signal in the Philippine gig context.

---

## 📊 Complete Scoring Summary

| Pillar | Max Points | Category |
|--------|-----------|----------|
| 1. Identity & Verification | 150 | Who you are |
| 2. Credentials & Expertise | 150 | What you know |
| 3. Profile & Market Presence | 100 | How you present |
| 4. Transaction Performance | 300 | How you execute |
| 5. Communication & Reporting | 150 | How you communicate |
| 6. Reward & Recognition | 150 | How clients reward you |
| **TOTAL** | **1,000** | |

---

## 🎖️ Tier Thresholds (Unchanged)

| Tier | Score Range | Badge Color | Key Benefit |
|------|-------------|-------------|-------------|
| New | 0 – 399 | 🟠 Orange | Probation, limited visibility |
| Basic | 400 – 599 | ⚪ Gray | Standard listing |
| Verified | 600 – 749 | 🟢 Green | ₱10K micro-loan access |
| Pro | 750 – 899 | 🔵 Blue | Priority search, ₱30K loan |
| Elite | 900 – 1,000 | 🥇 Gold | Top ranking, 5% fee discount, ₱50K loan |

---

## 🗄️ Revised PostgreSQL Schema

```sql
CREATE TABLE provider_trust_scores (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id             UUID NOT NULL REFERENCES providers(id),
  provider_type           VARCHAR(20) NOT NULL, -- 'individual' | 'company'

  -- Pillar 1: Identity & Verification
  p1_identity_score       INTEGER DEFAULT 0,   -- /150

  -- Pillar 2: Credentials & Expertise
  p2_credential_score     INTEGER DEFAULT 0,   -- /150

  -- Pillar 3: Profile & Market Presence
  p3_profile_score        INTEGER DEFAULT 0,   -- /100

  -- Pillar 4: Transaction Performance
  p4_transaction_score    INTEGER DEFAULT 0,   -- /300
  quick_order_success_rate   DECIMAL(5,2) DEFAULT 0,
  regular_order_success_rate DECIMAL(5,2) DEFAULT 0,
  quotation_success_rate     DECIMAL(5,2) DEFAULT 0,
  total_completed_projects   INTEGER DEFAULT 0,
  total_service_amount       DECIMAL(15,2) DEFAULT 0,

  -- Pillar 5: Communication & Reporting
  p5_communication_score  INTEGER DEFAULT 0,   -- /150
  avg_response_time_mins  INTEGER DEFAULT 0,
  report_submission_rate  DECIMAL(5,2) DEFAULT 0,
  report_quality_score    DECIMAL(5,2) DEFAULT 0,

  -- Pillar 6: Reward & Recognition
  p6_reward_score         INTEGER DEFAULT 0,   -- /150
  avg_star_rating         DECIMAL(3,2) DEFAULT 0,
  tip_rate                DECIMAL(5,2) DEFAULT 0,
  repeat_hire_rate        DECIMAL(5,2) DEFAULT 0,

  -- Composite
  total_score             INTEGER GENERATED ALWAYS AS (
                            p1_identity_score + p2_credential_score +
                            p3_profile_score + p4_transaction_score +
                            p5_communication_score + p6_reward_score
                          ) STORED,

  tier                    VARCHAR(20) DEFAULT 'New',
  last_calculated_at      TIMESTAMP DEFAULT NOW(),

  CONSTRAINT score_range CHECK (total_score BETWEEN 0 AND 1000)
);
```

---

## ⚡ Key Design Decisions for CEO Review

| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| AI Skill Test — MVP or v2? | **v2** | Requires content creation per category; defer to post-launch |
| Portfolio AI Validation — MVP or v2? | **v2** | AWS Rekognition needed; defer |
| Completion Report Quality AI — MVP or v2? | **v2** | Complex NLP; use manual threshold for MVP |
| Service Tip tracking | **MVP** | Simple boolean flag per contract, low dev cost, high signal value |
| Company vs. Individual scoring | **MVP** | Different base verification paths already in registration flow |
| Quick Order vs. Regular Order split | **MVP** | Order type already in DB schema; just add separate counters |

**MVP-safe Pillars (build now):** 1, 3, 4, 5 (partial), 6
**Defer to v2:** Full Pillar 2 (AI test), AI-based portfolio & report quality scoring