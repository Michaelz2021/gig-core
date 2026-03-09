# 🏆 Gig-Market Trust Score System Design Proposal

## Core Philosophy: "Behavior-Driven Trust"

Rather than a simple star rating average, the goal is to calculate a highly reliable score based on **actual service behavior data** that is difficult to manipulate.

---

## 📊 Trust Score Components (Total: 1,000 Points)

### 1️⃣ Service Quality — **Max 350 Points**

| Metric | Points | Measurement Method |
|--------|--------|--------------------|
| Customer Rating Average | 200 | Cumulative weighted average (recent reviews weighted higher) |
| Service Completion Rate | 100 | Completed jobs / Accepted jobs |
| Repeat Hire Rate | 50 | % of clients who re-hired the same provider |

> **Key insight:** Repeat hire rate is a powerful quality indicator that is nearly impossible to manipulate.

---

### 2️⃣ Responsiveness & Reliability — **Max 250 Points**

| Metric | Points | Benchmark |
|--------|--------|-----------|
| Average Initial Response Time | 80 | Under 15 minutes → Full score |
| Appointment Punctuality Rate | 100 | Actual arrival vs. scheduled booking time |
| On-Time Completion Rate | 70 | % of jobs completed before contract deadline |

---

### 3️⃣ Transaction Integrity — **Max 200 Points**

| Metric | Points | Measurement Method |
|--------|--------|--------------------|
| Dispute Rate | 100 | Disputes raised / Total completed jobs — lower is better |
| No-show / Cancellation Rate | 70 | % of cancellations after booking confirmation |
| Escrow Issue Rate | 30 | % of payment-related incidents |

---

### 4️⃣ Platform Activity — **Max 100 Points**

| Metric | Points | Benchmark |
|--------|--------|-----------|
| Total Completed Transactions | 50 | Transaction experience as foundation of trust |
| Profile Completeness | 30 | Photo, portfolio, certifications uploaded |
| Regular Login / Activity | 20 | Active within last 30 days |

---

### 5️⃣ Identity & Verification — **Max 100 Points**

| Metric | Points | Description |
|--------|--------|-------------|
| Government ID Verification | 40 | PhilSys / Passport etc. |
| Professional Certification | 30 | Relevant skill certificate upload |
| Address Verification | 20 | Residential address confirmation |
| Phone Number Verification | 10 | Semaphore OTP |

---

## ⚙️ Core Server Algorithm Ideas

### 💡 Idea 1: Time Decay Weighting

Apply **higher weight to behavior within the last 6 months** rather than older reviews.

```typescript
// NestJS server logic example
function calculateWeightedRating(reviews: Review[]): number {
  const now = Date.now();
  const SIX_MONTHS = 180 * 24 * 60 * 60 * 1000;

  let weightedSum = 0;
  let totalWeight = 0;

  reviews.forEach(review => {
    const age = now - new Date(review.created_at).getTime();
    // Recent = weight 1.0, 6 months ago = weight 0.5
    const weight = Math.max(0.5, 1 - (age / SIX_MONTHS) * 0.5);
    weightedSum += review.rating * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}
```

---

### 💡 Idea 2: Streak Bonus / Penalty System

```
✅ 5 consecutive 5-star ratings      → +10 bonus points
✅ 10 consecutive dispute-free jobs  → +20 points
❌ 3 consecutive low ratings (≤3★)   → -15 points + admin warning
❌ 2 consecutive no-shows            → -30 points + temporary account restriction
```

---

### 💡 Idea 3: Category-Specific Scores

Even the same provider maintains **separate scores per service category** (e.g., "Aircon Cleaning" vs. "Electrical Wiring"), enabling granular expertise-based trust.

```sql
-- PostgreSQL schema example
CREATE TABLE provider_category_scores (
  provider_id     UUID REFERENCES providers(id),
  category_id     UUID REFERENCES service_categories(id),
  score           INTEGER DEFAULT 500,
  total_jobs      INTEGER DEFAULT 0,
  avg_rating      DECIMAL(3,2),
  updated_at      TIMESTAMP,
  PRIMARY KEY (provider_id, category_id)
);
```

---

### 💡 Idea 4: Review Credibility Filter

Server-side validation logic to prevent fake or manipulated reviews.

```
A review is counted toward Trust Score ONLY when ALL conditions are met:
✅ Review linked to an actually completed Contract
✅ Reviewer account created more than 7 days ago
✅ Reviewer has at least 2 prior transaction records
✅ Auto-flag triggered if same customer gives 5-star to same provider
   on 3+ consecutive jobs (suspected collusion)
```

---

### 💡 Idea 5: Tier Drop Protection

A buffer mechanism to prevent provider churn when scores decline.

```
Elite → Pro Demotion Conditions:
- Trust Score must remain below 750 for 30 consecutive days to trigger demotion
- 7-day advance notification sent (Push + SMS) before demotion
- Demotion cancelled if provider recovers to 750 within the 30-day window
```

---

## 🗄️ Core PostgreSQL Table Structure

```sql
CREATE TABLE provider_trust_scores (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id           UUID NOT NULL REFERENCES providers(id),

  -- Score components
  quality_score         INTEGER DEFAULT 0,     -- /350
  reliability_score     INTEGER DEFAULT 0,     -- /250
  integrity_score       INTEGER DEFAULT 0,     -- /200
  activity_score        INTEGER DEFAULT 0,     -- /100
  verification_score    INTEGER DEFAULT 0,     -- /100

  -- Composite score (auto-computed)
  total_score           INTEGER GENERATED ALWAYS AS (
                          quality_score + reliability_score +
                          integrity_score + activity_score +
                          verification_score
                        ) STORED,

  -- Tier
  tier                  VARCHAR(20) DEFAULT 'New',
  -- 'New' | 'Basic' | 'Verified' | 'Pro' | 'Elite'

  last_calculated_at    TIMESTAMP DEFAULT NOW(),
  score_version         INTEGER DEFAULT 1,

  CONSTRAINT score_range CHECK (total_score BETWEEN 0 AND 1000)
);

-- Score change history table
CREATE TABLE trust_score_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id     UUID NOT NULL REFERENCES providers(id),
  score_before    INTEGER NOT NULL,
  score_after     INTEGER NOT NULL,
  change_amount   INTEGER NOT NULL,
  change_reason   VARCHAR(100) NOT NULL,
  -- e.g. 'REVIEW_5STAR', 'DISPUTE_RAISED', 'STREAK_BONUS'
  source_id       UUID,  -- references contract_id or dispute_id
  created_at      TIMESTAMP DEFAULT NOW()
);
```

---

## 🔄 Trust Score Recalculation Triggers (NestJS)

```typescript
// Events that trigger recalculation
@OnEvent('contract.completed')
@OnEvent('review.submitted')
@OnEvent('dispute.resolved')
@OnEvent('provider.verified')
async recalculateTrustScore(providerId: string) {
  // Event-driven for near real-time updates without batch DB load
  await this.trustScoreService.recalculate(providerId);
}
```

**Event-driven recalculation** (rather than scheduled batch jobs) is recommended for near real-time score updates with minimal database load.

---

## 📌 Key CEO-Level Decisions Required

| Decision Item | Option A | Option B |
|---------------|----------|----------|
| New Provider starting score | 500 (neutral) | 300 (incentivize upward growth) |
| Recalculation frequency | Real-time event-driven | Daily batch processing |
| Category-specific scores | Include in MVP | Defer to v2 launch |
| Tier drop protection window | 30 days | 14 days |

Given the current MVP timeline, it is recommended to **defer category-specific scores to v2** and include all other features in the MVP launch.