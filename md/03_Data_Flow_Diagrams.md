# AI 기반 서비스 제공자 검증 시스템
## Part 3: 데이터 흐름도 (Data Flow Diagrams)

---

## 1. 신분 인증 데이터 흐름

```mermaid
sequenceDiagram
    participant User as 사용자 (Mobile App)
    participant API as API Gateway
    participant VS as Verification Service
    participant S3 as Cloud Storage (S3)
    participant OCR as OCR Engine (Python)
    participant Face as Face Recognition AI
    participant Gov as PhilSys API
    participant TS as Trust Score Service
    participant DB as PostgreSQL
    participant Notif as Notification Service
    
    User->>API: 1. Upload ID Photo (POST /api/v1/verification/id)
    API->>API: 2. Validate JWT Token
    API->>VS: 3. Forward Request
    
    VS->>S3: 4. Store Original Image
    S3-->>VS: 4a. Return S3 URL
    
    par Parallel Processing
        VS->>OCR: 5a. Extract Text from ID
        OCR->>OCR: Tesseract OCR Processing
        OCR-->>VS: ID Number, Name, DOB, etc.
        
        VS->>Face: 5b. Extract Face & Liveness Check
        Face->>Face: AWS Rekognition Processing
        Face-->>VS: Face Embedding + Liveness Score
    end
    
    VS->>Gov: 6. Verify ID with PhilSys API
    Gov-->>VS: Verification Result
    
    VS->>Face: 7. Compare Selfie vs ID Photo
    Face-->>VS: Match Score (0-100)
    
    VS->>VS: 8. Calculate AI Confidence Score
    
    alt Confidence >= 90%
        VS->>DB: 9a. Save as 'approved'
        VS->>TS: 10a. Update Trust Score (+50)
        VS->>Notif: 11a. Send Success Notification
    else Confidence 70-89%
        VS->>DB: 9b. Save as 'under_review'
        VS->>Notif: 11b. Send Manual Review Notification
    else Confidence < 70%
        VS->>DB: 9c. Save as 'rejected'
        VS->>Notif: 11c. Send Rejection Notification
    end
    
    DB-->>VS: Record Saved
    Notif->>User: 12. Push Notification + SMS
    VS->>API: 13. Return Response
    API->>User: 14. Display Result
```

---

## 2. 작업 완료 검증 데이터 흐름

```mermaid
sequenceDiagram
    participant Provider as 제공자 (Mobile App)
    participant API as API Gateway
    participant TS as Transaction Service
    participant Oracle as AI Oracle Service
    participant Vision as Computer Vision AI
    participant Fraud as Fraud Detection ML
    participant S3 as Cloud Storage
    participant Customer as 고객 (Mobile App)
    participant Escrow as Escrow Service
    participant Score as Trust Score Service
    participant DB as PostgreSQL
    
    Provider->>API: 1. Submit Completion (Photos + Notes)
    API->>TS: 2. Forward to Transaction Service
    
    TS->>DB: 3. Load Job & Contract Details
    DB-->>TS: Job Data + Contract Terms
    
    TS->>S3: 4. Upload Photos to S3
    S3-->>TS: Photo URLs
    
    TS->>Oracle: 5. Request AI Verification
    Note over Oracle: AI Verification Pipeline Starts
    
    par Parallel AI Analysis
        Oracle->>Vision: 6a. Check Image Quality
        Vision-->>Oracle: Quality Scores (Resolution, Sharpness, etc.)
        
        Oracle->>Vision: 6b. Compare Before/After
        Vision-->>Oracle: Improvement Score, SSIM
        
        Oracle->>Vision: 6c. Verify Metadata (EXIF)
        Vision-->>Oracle: Timestamp, GPS, Camera Info
        
        Oracle->>Fraud: 6d. Detect Fraud Patterns
        Fraud-->>Oracle: Fraud Risk Score
    end
    
    Oracle->>Oracle: 7. Calculate Confidence Score
    
    alt Confidence >= 90% (Auto-Approve)
        Oracle-->>TS: 8a. Approved (Confidence: 96%)
        TS->>DB: 9a. Save Completion (status: approved)
        TS->>Customer: 10a. Notify Customer (48h countdown)
        
        alt Customer Confirms within 48h
            Customer->>API: Confirm Completion
            API->>Escrow: 11a. Release Payment
        else 48 hours pass with no objection
            Note over TS: Auto-release timer triggers
            TS->>Escrow: 11b. Auto-release Payment
        end
        
        Escrow->>Provider: 12. Transfer ₱1,600
        Escrow->>Score: 13. Update Trust Score
        Score->>DB: +72 points
        
    else Confidence 70-89% (Customer Review)
        Oracle-->>TS: 8b. Needs Customer Review (Confidence: 82%)
        TS->>DB: 9b. Save Completion (status: pending_review)
        TS->>Customer: 10b. Request Review (6h deadline)
        Customer->>API: Customer Approves/Rejects
        
    else Confidence < 70% (Manual Review)
        Oracle-->>TS: 8c. Needs Manual Review (Confidence: 65%)
        TS->>DB: 9c. Save Completion (status: manual_review)
        Note over TS: Escalate to Human Reviewer
    end
```

---

## 3. Trust Score 계산 데이터 흐름

```mermaid
flowchart TD
    Start([Daily Cron Job<br/>Every Day at Midnight]) --> FetchUsers[Fetch All Active Providers]
    
    FetchUsers --> LoopUsers{For Each Provider}
    
    LoopUsers -->|User ID| FetchData[Fetch Transaction Data<br/>Last 90 Days]
    
    FetchData --> CalcComponents[Calculate Score Components]
    
    CalcComponents --> Completion[Completion Rate Score<br/>0-400 points]
    CalcComponents --> Response[Response Time Score<br/>0-200 points]
    CalcComponents --> Rating[Average Rating Score<br/>0-200 points]
    CalcComponents --> Dispute[Dispute History Score<br/>0-100 points]
    CalcComponents --> Volume[Transaction Volume Score<br/>0-100 points]
    
    Completion --> ApplyWeights[Apply Time-Based Weights]
    Response --> ApplyWeights
    Rating --> ApplyWeights
    Dispute --> ApplyWeights
    Volume --> ApplyWeights
    
    ApplyWeights --> SumScore[Sum All Components<br/>Total: 0-1000]
    
    SumScore --> DetectChange{Score Change<br/>> 50 points?}
    
    DetectChange -->|Yes| SendAlert[Send Alert Notification]
    DetectChange -->|No| CheckLevel[Check Level Requirements]
    
    SendAlert --> CheckLevel
    
    CheckLevel --> Level1{Eligible for<br/>Level 1→2<br/>Upgrade?}
    Level1 -->|Yes| Upgrade1[Auto-Upgrade to Level 2]
    Level1 -->|No| Level2{Eligible for<br/>Level 2→3?}
    
    Upgrade1 --> SaveDB
    
    Level2 -->|Yes| QueueReview[Queue for Manual Review]
    Level2 -->|No| CheckDemotion{Score < 300?}
    
    QueueReview --> SaveDB
    
    CheckDemotion -->|Yes| FlagAccount[Flag for Account Review]
    CheckDemotion -->|No| SaveDB[Save New Score to DB]
    
    FlagAccount --> SaveDB
    
    SaveDB --> RecordHistory[Record in Trust Score History]
    RecordHistory --> UpdateCache[Update Redis Cache]
    UpdateCache --> NextUser{More Users?}
    
    NextUser -->|Yes| LoopUsers
    NextUser -->|No| End([End])
    
    style Start fill:#90EE90
    style End fill:#FFB6C1
    style Upgrade1 fill:#FFD700
    style FlagAccount fill:#FF6347
```

---

## 4. 서비스 옥션 매칭 데이터 흐름

```mermaid
flowchart TD
    Customer[Customer Creates Job] --> AIChat[AI Chatbot Interaction]
    
    AIChat --> ExtractDetails[Extract Service Details]
    ExtractDetails --> Categories[Category, Location, Budget, Timeline]
    
    Categories --> AIEstimate[AI Price Estimation Engine]
    AIEstimate --> FairPrice[Calculate Fair Price Range<br/>Based on Market Data]
    
    FairPrice --> CreateAuction[Create Auction in DB]
    CreateAuction --> SetDeadline[Set 24h Bidding Deadline]
    
    SetDeadline --> RunMatcher[AI Matching Algorithm]
    
    RunMatcher --> FetchProviders[Fetch All Eligible Providers]
    FetchProviders --> FilterBasic{Basic Filters}
    
    FilterBasic -->|Pass| CalcMatch[Calculate Match Score<br/>for Each Provider]
    FilterBasic -->|Fail| Exclude[Exclude Provider]
    
    CalcMatch --> SkillMatch[Skill Match 35%]
    CalcMatch --> LocationMatch[Location Proximity 25%]
    CalcMatch --> TrustMatch[Trust Score 25%]
    CalcMatch --> PriceMatch[Price Fit 10%]
    CalcMatch --> SuccessRate[Past Success Rate 5%]
    
    SkillMatch --> TotalScore[Sum Match Score<br/>0-100]
    LocationMatch --> TotalScore
    TrustMatch --> TotalScore
    PriceMatch --> TotalScore
    SuccessRate --> TotalScore
    
    TotalScore --> RankProviders[Rank Providers by Score]
    RankProviders --> Top20[Select Top 20 Providers]
    
    Top20 --> SendNotif[Send Push Notifications]
    SendNotif --> ProviderView[Providers View Auction]
    
    ProviderView --> ProviderDecision{Provider Decision}
    
    ProviderDecision -->|Bid| CheckCredits{Has Reward Credits?}
    ProviderDecision -->|Ignore| NoAction[No Action]
    
    CheckCredits -->|Yes| DeductCredit[Deduct 1 Credit]
    CheckCredits -->|No| CantBid[Cannot Bid]
    
    DeductCredit --> SubmitBid[Submit Bid to DB]
    SubmitBid --> AIQualityCheck[AI Checks Bid Quality]
    
    AIQualityCheck --> BidValid{Valid Bid?}
    BidValid -->|Yes| NotifyCustomer[Notify Customer]
    BidValid -->|No| RejectBid[Reject Bid]
    
    NotifyCustomer --> AuctionEnds{Auction Deadline<br/>Reached?}
    
    AuctionEnds -->|No| ProviderView
    AuctionEnds -->|Yes| CustomerReview[Customer Reviews Bids]
    
    CustomerReview --> SelectProvider[Customer Selects Provider]
    SelectProvider --> CreateContract[Generate Smart Contract]
    
    CreateContract --> SignContract[Both Parties Sign]
    SignContract --> EscrowPayment[Process Escrow Payment]
    
    EscrowPayment --> JobStart[Job Begins]
    
    style Customer fill:#87CEEB
    style AIChat fill:#FFD700
    style CreateContract fill:#98FB98
    style JobStart fill:#90EE90
```

---

## 5. 분쟁 해결 데이터 흐름

```mermaid
sequenceDiagram
    participant Party as 분쟁 제기자<br/>(고객 or 제공자)
    participant App as Mobile App
    participant API as API Gateway
    participant DS as Dispute Service
    participant Oracle as AI Oracle Service
    participant Mediator as Human Mediator
    participant ES as Escrow Service
    participant TS as Trust Score Service
    participant DB as Database
    participant Both as 양측 당사자
    
    Party->>App: 1. File Dispute
    App->>API: 2. Submit Dispute (Type, Evidence)
    API->>DS: 3. Create Dispute Record
    
    DS->>DB: 4. Save Dispute (status: pending)
    DS->>DS: 5. Load Job, Contract, Messages
    
    DS->>Oracle: 6. Request AI Analysis
    Note over Oracle: AI Dispute Analysis
    
    Oracle->>Oracle: 7a. Analyze Evidence (Photos, Chats)
    Oracle->>Oracle: 7b. Compare with Contract Terms
    Oracle->>Oracle: 7c. Search Similar Past Cases
    Oracle->>Oracle: 7d. Calculate Breach Probability
    
    Oracle-->>DS: 8. AI Recommendation<br/>(Confidence: 78%)
    
    alt AI Confidence >= 85%
        DS->>Both: 9a. Propose AI Solution
        Both->>DS: Accept/Reject
        
        alt Both Accept
            DS->>ES: 10. Execute Resolution (Refund/Release)
            DS->>TS: 11. Update Trust Scores
        else Either Rejects
            DS->>Mediator: 12. Escalate to Human
        end
        
    else AI Confidence < 85%
        DS->>Mediator: 9b. Assign Human Mediator
        Note over Mediator: Human Review Process
        
        Mediator->>Mediator: 10. Review Evidence
        Mediator->>Both: 11. Request Additional Info (if needed)
        Both->>Mediator: Provide More Evidence
        
        Mediator->>Mediator: 12. Make Decision
        Mediator->>DS: 13. Submit Resolution
    end
    
    DS->>ES: 14. Execute Payment Action
    alt Favor Customer
        ES->>Party: 15a. Refund to Customer
        DS->>TS: Penalty to Provider (-100 Trust Score)
    else Favor Provider
        ES->>Party: 15b. Release to Provider
        DS->>TS: Penalty to Customer (-50 Trust Score)
    else Split Resolution
        ES->>Both: 15c. Split Amount
        DS->>TS: Minor Penalty to Both
    end
    
    DS->>DB: 16. Update Dispute (status: resolved)
    DS->>Both: 17. Notify Resolution
    
    DS->>DS: 18. Record for ML Training
    Note over DS: Future AI learns from this case
```

---

## 6. 실시간 Trust Score 업데이트 흐름

```mermaid
flowchart LR
    Event[거래 이벤트 발생] --> EventType{이벤트 타입}
    
    EventType -->|작업 완료| JobComplete[Job Completed Event]
    EventType -->|리뷰 작성| ReviewPosted[Review Posted Event]
    EventType -->|분쟁 발생| DisputeFiled[Dispute Filed Event]
    EventType -->|분쟁 해결| DisputeResolved[Dispute Resolved Event]
    EventType -->|취소| JobCancelled[Job Cancelled Event]
    
    JobComplete --> Queue[RabbitMQ Event Queue]
    ReviewPosted --> Queue
    DisputeFiled --> Queue
    DisputeResolved --> Queue
    JobCancelled --> Queue
    
    Queue --> TSWorker[Trust Score Worker<br/>Node.js Service]
    
    TSWorker --> FetchUser[Fetch User Current Score]
    FetchUser --> CalcDelta[Calculate Score Change]
    
    CalcDelta --> UpdateDB[(Update PostgreSQL)]
    UpdateDB --> UpdateCache[(Update Redis Cache)]
    
    UpdateCache --> CheckThreshold{Score Change<br/>> 50 points?}
    
    CheckThreshold -->|Yes| SendNotif[Send Notification]
    CheckThreshold -->|No| LogHistory[Log to History Table]
    
    SendNotif --> LogHistory
    LogHistory --> CheckMilestone{Milestone Reached?}
    
    CheckMilestone -->|Level Up| AwardBonus[Award Bonus Credits]
    CheckMilestone -->|Warning Threshold| SendWarning[Send Warning]
    CheckMilestone -->|No| Done[Done]
    
    AwardBonus --> Done
    SendWarning --> Done
    
    style Event fill:#FFE4B5
    style Queue fill:#87CEEB
    style Done fill:#90EE90
```

---

## 7. 사기 탐지 데이터 파이프라인

```mermaid
flowchart TD
    Start[Provider Activity] --> Monitor[Real-time Monitoring System]
    
    Monitor --> CollectData[Collect Behavioral Data]
    
    CollectData --> ProfileCheck[Profile Anomaly Detection]
    CollectData --> BidCheck[Bid Pattern Analysis]
    CollectData --> PhotoCheck[Completion Photo Analysis]
    CollectData --> ReviewCheck[Review Pattern Analysis]
    
    ProfileCheck --> ML[Fraud Detection ML Model]
    BidCheck --> ML
    PhotoCheck --> ML
    ReviewCheck --> ML
    
    ML --> Features[Extract Features]
    
    Features --> F1[Duplicate Certificates]
    Features --> F2[Stolen Portfolio Images]
    Features --> F3[Abnormal Pricing]
    Features --> F4[Reused Completion Photos]
    Features --> F5[Fake Review Patterns]
    Features --> F6[Multiple Account Signals]
    
    F1 --> CalcRisk[Calculate Risk Score<br/>0-1.0]
    F2 --> CalcRisk
    F3 --> CalcRisk
    F4 --> CalcRisk
    F5 --> CalcRisk
    F6 --> CalcRisk
    
    CalcRisk --> RiskLevel{Risk Level}
    
    RiskLevel -->|Low<br/>< 0.3| LogOnly[Log for Monitoring]
    RiskLevel -->|Medium<br/>0.3-0.6| FlagReview[Flag for Manual Review]
    RiskLevel -->|High<br/>0.6-0.8| SuspendBid[Suspend Bidding Ability]
    RiskLevel -->|Critical<br/>> 0.8| SuspendAccount[Suspend Account Immediately]
    
    LogOnly --> UpdateDB[(Update Database)]
    FlagReview --> NotifyReviewer[Notify Review Team]
    SuspendBid --> NotifyProvider[Notify Provider]
    SuspendAccount --> NotifyProvider
    
    NotifyReviewer --> ManualReview[Manual Investigation]
    NotifyProvider --> UpdateDB
    
    ManualReview --> Decision{Reviewer Decision}
    
    Decision -->|Legitimate| RestoreAccount[Restore Account]
    Decision -->|Fraud Confirmed| BanAccount[Permanent Ban]
    Decision -->|Needs More Info| RequestEvidence[Request More Evidence]
    
    RestoreAccount --> UpdateDB
    BanAccount --> UpdateDB
    RequestEvidence --> ManualReview
    
    UpdateDB --> TrainModel[Retrain ML Model<br/>with New Data]
    TrainModel --> End[End]
    
    style Start fill:#FFE4E1
    style ML fill:#87CEEB
    style CalcRisk fill:#FFD700
    style BanAccount fill:#FF6347
    style End fill:#90EE90
```

---

## 8. 전체 시스템 컴포넌트 관계도

```mermaid
graph TB
    subgraph Frontend
        Mobile[Mobile App<br/>React Native]
        Web[Web Portal<br/>React]
        Admin[Admin Dashboard]
    end
    
    subgraph API_Layer
        Gateway[API Gateway<br/>Kong]
    end
    
    subgraph Services
        User[User Service]
        Provider[Provider Service]
        Verify[Verification Service]
        Trust[Trust Score Service]
        Trans[Transaction Service]
        Oracle[AI Oracle Service]
        Dispute[Dispute Service]
        Notif[Notification Service]
        Analytics[Analytics Service]
    end
    
    subgraph AI_ML
        OCR[OCR Engine]
        Vision[Computer Vision]
        NLP[NLP/GPT-4]
        Fraud[Fraud Detection]
        TrustML[Trust Score ML]
        QualityAI[Quality Assessment]
    end
    
    subgraph Data
        Postgres[(PostgreSQL)]
        Mongo[(MongoDB)]
        Redis[(Redis)]
        S3[S3 Storage]
        Blockchain[Blockchain]
        Elastic[(ElasticSearch)]
    end
    
    subgraph External
        Payment[Payment Gateways]
        SMS[SMS/Email]
        Gov[Gov APIs]
        CloudAI[Cloud AI Services]
    end
    
    Mobile --> Gateway
    Web --> Gateway
    Admin --> Gateway
    
    Gateway --> User
    Gateway --> Provider
    Gateway --> Verify
    Gateway --> Trust
    Gateway --> Trans
    Gateway --> Oracle
    Gateway --> Dispute
    Gateway --> Notif
    Gateway --> Analytics
    
    Verify --> OCR
    Verify --> Vision
    Verify --> Gov
    
    Oracle --> Vision
    Oracle --> QualityAI
    Oracle --> Fraud
    
    Trust --> TrustML
    
    User --> Postgres
    Provider --> Postgres
    Verify --> Postgres
    Trust --> Postgres
    Trans --> Postgres
    Dispute --> Postgres
    
    Provider --> Mongo
    Notif --> Mongo
    
    Trust --> Redis
    Gateway --> Redis
    
    Verify --> S3
    Oracle --> S3
    
    Trans --> Blockchain
    
    Analytics --> Elastic
    
    Trans --> Payment
    Notif --> SMS
    Vision --> CloudAI
    
    style Gateway fill:#FFD700
    style Verify fill:#87CEEB
    style Oracle fill:#87CEEB
    style Trust fill:#98FB98
    style TrustML fill:#98FB98
```

---

이 문서는 Part 3입니다. 모든 주요 데이터 흐름을 Mermaid 다이어그램으로 시각화했습니다.

추가 문서:
- Part 4: API 명세서
- Part 5: 배포 및 모니터링 가이드

이 다이어그램들은 Markdown을 지원하는 도구(GitHub, GitLab, VS Code, Notion 등)에서 자동으로 렌더링됩니다.
