# ⚠️ Provider Penalty & Score Deduction System
## GigMarket — Trust Score Negative Enforcement Framework

---

## Design Philosophy

The penalty system is built on **three tiers of severity**: Behavioral Warnings (bad habits), Active Violations (contract breaches), and Platform Integrity Violations (bypassing the platform). Each tier carries progressively stronger consequences — from score deductions up to permanent account termination.

---

## 🔴 TIER 1 — Behavioral Penalties
*Poor service habits that damage consumer experience*

| # | Violation | Trust Score | Reward Credits | Additional Action |
|---|-----------|-------------|----------------|-------------------|
| 1.1 | No-show after contract confirmation | **-50 pts** | -5 credits | 7-day booking suspension |
| 1.2 | Cancellation < 12 hrs before service | **-30 pts** | -3 credits | Warning issued |
| 1.3 | Cancellation 12–24 hrs before service | **-20 pts** | -2 credits | Logged on record |
| 1.4 | Late arrival > 30 minutes (unnotified) | **-15 pts** | -1 credit | Consumer notified |
| 1.5 | Incomplete service delivery | **-25 pts** | -2 credits | Escrow frozen, dispute opened |
| 1.6 | Failure to submit completion report | **-10 pts** | 0 | Report marked missing |
| 1.7 | Low quality completion report (AI-scored) | **-5 pts** | 0 | Feedback sent to provider |
| 1.8 | Unresponsive during active contract (> 4 hrs) | **-10 pts** | -1 credit | Admin alert triggered |
| 1.9 | Consecutive low ratings (3 × ≤ 2.5★) | **-20 pts** | -3 credits | Quality review initiated |

---

## 🟠 TIER 2 — Active Violations
*Direct breaches of platform rules and contract obligations*

| # | Violation | Trust Score | Reward Credits | Additional Action |
|---|-----------|-------------|----------------|-------------------|
| 2.1 | Losing a confirmed dispute (provider at fault) | **-40 pts** | -5 credits | Escrow released to consumer |
| 2.2 | Fraudulent completion report (false photos/data) | **-80 pts** | -10 credits | 30-day suspension |
| 2.3 | Requesting payment outside platform (1st offense) | **-60 pts** | -8 credits | Formal warning + ToS notice |
| 2.4 | Requesting payment outside platform (2nd offense) | **-100 pts** | -15 credits | 90-day suspension |
| 2.5 | Fake certifications / falsified documents | **-150 pts** | -20 credits | Permanent ban (account flagged) |
| 2.6 | Abusive behavior toward consumer (reported + verified) | **-70 pts** | -10 credits | 30-day suspension + review |
| 2.7 | Soliciting reviews / manipulating ratings | **-60 pts** | -8 credits | Reviews invalidated |
| 2.8 | Multiple accounts (duplicate registration) | **-100 pts** | All credits forfeited | Secondary account banned |

---

## 🔴 TIER 3 — Platform Integrity Violations
*Off-platform transactions and circumvention — the most serious category*

### 3.1 Off-Platform (Direct Deal) Detection

This is the most critical threat to GigMarket's business model. The platform must use multiple detection signals:

**Detection Signals (Server-Side):**

```
Signal A — Chat Message Analysis (AI keyword scan)
  → Detects: phone numbers, GCash numbers, Viber/WhatsApp 
    handles, bank account numbers shared in-chat

Signal B — Suspicious Transaction Pattern
  → Provider accepted bid → Contract signed → 
    Consumer did NOT proceed with Xendit escrow payment →
    Yet provider marked job "completed" externally

Signal C — Consumer Report
  → Consumer files "solicited off-platform payment" complaint
  → Consumer provides screenshot evidence

Signal D — Payment Amount Mismatch
  → Escrow payment ≠ quoted amount (partial payment only)
    suggests remainder paid outside platform

Signal E — Repeat Non-Conversion Pattern
  → Provider wins bid consistently but payment conversion 
    rate is abnormally low (< 40% of accepted bids paid via escrow)
```

**Penalty Structure:**

| Offense | Trust Score | Reward Credits | Additional Action |
|---------|-------------|----------------|-------------------|
| 1st detection (warning) | **-80 pts** | -10 credits | Formal warning + ToS reminder |
| 2nd detection (confirmed) | **-150 pts** | -20 credits | 90-day suspension + admin review |
| 3rd detection | **-300 pts** | All credits forfeited | **Permanent account termination** |

---

## 🌙 TIER 4 — Inactivity Decay
*Long-term platform dormancy — passive score reduction*

A provider who stops using the platform still holds their Trust Score, which could mislead consumers. Gradual decay maintains score accuracy.

| Inactivity Period | Score Decay | Notification Sent |
|-------------------|-------------|-------------------|
| 30–60 days no login | **-5 pts/week** | Push: "Your score is decaying — log in to maintain it" |
| 61–90 days no login | **-10 pts/week** | Push + SMS re-engagement message |
| 91–180 days no login | **-15 pts/week** | Email + SMS: "Account going dormant" |
| 180+ days no login | Profile marked **Inactive** | Hidden from search results |
| 365+ days no activity | Score reset to **New tier floor** (400 pts) | Final email notification |

**Re-activation Path:**
A returning provider can recover their dormant score by completing 3 jobs with ≥ 4.0 stars within 30 days of reactivation. This prevents the score decay from permanently discouraging returning providers.

---

## 📊 Penalty Accumulation & Escalation Logic

```
Infraction Points System (separate from Trust Score):

Minor Violation  = 1 Infraction Point
Moderate         = 3 Infraction Points  
Serious          = 5 Infraction Points
Critical         = 10 Infraction Points

Thresholds:
  5  pts → Formal Warning (automated)
  10 pts → 7-day feature restriction
  15 pts → 30-day suspension
  20 pts → 90-day suspension
  25 pts → Permanent account review

Infraction points expire after 12 months if no new violations.
```

---

## 🛡️ Provider Appeal & Due Process

Fairness is essential — providers must have a path to contest penalties.

```
Appeal Window:    48 hours after penalty notification
Appeal Cost:      No fee for 1st appeal per quarter;
                  ₱200 appeal fee for subsequent appeals
Review Period:    5 business days
Evidence Allowed: Screenshots, chat logs, photos, timestamps
Outcome Options:  Full reversal / Partial reduction / Upheld
```

This protects GigMarket from legal liability under **RA 8792 (E-Commerce Act)** and ensures fair treatment consistent with Philippine consumer and labor protection norms.

---

## 🗄️ PostgreSQL Schema for Penalty Tracking

```sql
CREATE TABLE provider_violations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id       UUID NOT NULL REFERENCES providers(id),
  
  violation_tier    VARCHAR(10) NOT NULL,   -- 'TIER1' | 'TIER2' | 'TIER3' | 'TIER4'
  violation_code    VARCHAR(50) NOT NULL,
  -- e.g. 'NO_SHOW', 'OFF_PLATFORM_DEAL', 'FRAUD_REPORT', 'INACTIVITY_DECAY'
  
  detection_method  VARCHAR(50),
  -- 'AI_CHAT_SCAN' | 'CONSUMER_REPORT' | 'ADMIN_REVIEW' | 'AUTO_SYSTEM'
  
  trust_score_deduction   INTEGER NOT NULL DEFAULT 0,
  reward_credit_deduction INTEGER NOT NULL DEFAULT 0,
  infraction_points       INTEGER NOT NULL DEFAULT 0,
  
  -- Linked evidence
  contract_id       UUID REFERENCES contracts(id),
  dispute_id        UUID REFERENCES disputes(id),
  
  -- Status
  status            VARCHAR(20) DEFAULT 'APPLIED',
  -- 'APPLIED' | 'APPEALED' | 'REVERSED' | 'UPHELD'
  
  appeal_deadline   TIMESTAMP,
  resolved_at       TIMESTAMP,
  notes             TEXT,
  
  created_at        TIMESTAMP DEFAULT NOW()
);

-- Inactivity tracking
CREATE TABLE provider_activity_log (
  provider_id       UUID NOT NULL REFERENCES providers(id),
  last_login_at     TIMESTAMP,
  last_job_at       TIMESTAMP,
  inactivity_days   INTEGER GENERATED ALWAYS AS (
                      EXTRACT(DAY FROM NOW() - last_login_at)
                    ) STORED,
  decay_active      BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (provider_id)
);
```

---

## ⚡ NestJS Event Triggers

```typescript
// Auto-triggered penalty events
@OnEvent('contract.no_show')
async penalizeNoShow(providerId: string, contractId: string) {
  await this.penaltyService.apply(providerId, 'NO_SHOW', {
    trustScoreDeduction: 50,
    creditDeduction: 5,
    infractionPoints: 5,
    suspensionDays: 7
  });
}

@OnEvent('chat.offplatform_detected')
async flagOffPlatformDeal(providerId: string, evidence: any) {
  const priorOffenses = await this.violationRepo.count({
    provider_id: providerId,
    violation_code: 'OFF_PLATFORM_DEAL'
  });
  // Escalating penalty based on repeat offense count
  await this.penaltyService.applyOffPlatformPenalty(
    providerId, priorOffenses + 1, evidence
  );
}

// Inactivity decay — runs nightly via @nestjs/schedule
@Cron('0 2 * * *')
async applyInactivityDecay() {
  await this.penaltyService.processInactivityDecay();
}
```

---

## 📌 CEO-Level Summary

| Threat | Detection Method | Max Consequence |
|--------|-----------------|-----------------|
| Poor service quality | Star ratings + disputes | Tier demotion + suspension |
| Off-platform bypass | AI chat scan + pattern analysis | **Permanent ban** |
| Long-term inactivity | Cron job nightly | Score reset + hidden profile |
| Fraudulent reporting | AI validation + admin review | **Permanent ban** |
| Duplicate accounts | Phone/ID matching at registration | Secondary account banned |

The off-platform bypass detection is the most strategically critical feature. Even a basic **AI keyword scanner on in-app chat** (detecting phone numbers and GCash references) can deter most circumvention attempts and is strongly recommended for MVP.
