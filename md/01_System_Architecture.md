# AI 기반 서비스 제공자 검증 시스템
## Part 1: 시스템 아키텍처

---

## 1. 전체 시스템 아키텍처 개요

### 1.1 레이어 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND LAYER                             │
│  - Mobile App (React Native / Flutter)                          │
│  - Web Portal (React)                                           │
│  - Admin Dashboard                                              │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                    API GATEWAY LAYER                            │
│  - Kong / AWS API Gateway                                       │
│  - Authentication/Authorization (JWT)                           │
│  - Rate Limiting                                                │
│  - Request Routing                                              │
│  - Load Balancing                                               │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│               MICROSERVICES LAYER (Node.js/NestJS)              │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ User        │  │ Provider    │  │ Verification│            │
│  │ Service     │  │ Service     │  │ Service     │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ Trust Score │  │ Transaction │  │ AI Oracle   │            │
│  │ Service     │  │ Service     │  │ Service     │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ Dispute     │  │ Notification│  │ Analytics   │            │
│  │ Service     │  │ Service     │  │ Service     │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│              AI/ML PROCESSING LAYER (Python)                    │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐ │
│  │ Document OCR    │  │ Image Analysis  │  │ NLP Engine     │ │
│  │ & Verification  │  │ & Computer      │  │ (GPT-4)        │ │
│  │                 │  │ Vision          │  │                │ │
│  │ • Tesseract OCR │  │ • TensorFlow    │  │ • Chatbot      │ │
│  │ • ID Validation │  │ • OpenCV        │  │ • Sentiment    │ │
│  │ • Cert Check    │  │ • Forensics     │  │ • Analysis     │ │
│  └─────────────────┘  └─────────────────┘  └────────────────┘ │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐ │
│  │ Fraud Detection │  │ Trust Score ML  │  │ Quality        │ │
│  │ ML Model        │  │ Model           │  │ Assessment AI  │ │
│  │                 │  │                 │  │                │ │
│  │ • Anomaly Det   │  │ • XGBoost       │  │ • Before/After │ │
│  │ • Pattern Recog │  │ • Feature Eng   │  │ • Quality Score│ │
│  │ • Risk Scoring  │  │ • Real-time     │  │ • Auto-approval│ │
│  └─────────────────┘  └─────────────────┘  └────────────────┘ │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                       DATA LAYER                                │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐ │
│  │ PostgreSQL      │  │ MongoDB         │  │ Redis Cache    │ │
│  │ (Primary DB)    │  │ (Documents)     │  │                │ │
│  │                 │  │                 │  │ • Sessions     │ │
│  │ • Users         │  │ • Portfolios    │  │ • Trust Score  │ │
│  │ • Transactions  │  │ • Reviews       │  │ • Rate Limit   │ │
│  │ • Trust Scores  │  │ • Chat Logs     │  │ • ML Results   │ │
│  └─────────────────┘  └─────────────────┘  └────────────────┘ │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐ │
│  │ S3/Cloud        │  │ Blockchain      │  │ ElasticSearch  │ │
│  │ Storage         │  │ Ledger          │  │                │ │
│  │                 │  │                 │  │ • Full-text    │ │
│  │ • Images        │  │ • Polygon/BSC   │  │ • Logs         │ │
│  │ • Documents     │  │ • Smart Contract│  │ • Analytics    │ │
│  │ • Videos        │  │ • Audit Trail   │  │ • Search       │ │
│  └─────────────────┘  └─────────────────┘  └────────────────┘ │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                 EXTERNAL INTEGRATIONS                           │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Payment  │  │ SMS/Email│  │ Gov APIs │  │ Cloud AI      │  │
│  │ Gateways │  │ Services │  │          │  │ Services      │  │
│  │          │  │          │  │          │  │               │  │
│  │ • GCash  │  │ • Twilio │  │ • PhilSys│  │ • AWS Rekogn  │  │
│  │ • PayMaya│  │ • SendGrd│  │ • PRC    │  │ • Google Vis  │  │
│  │ • PayMong│  │ • Firebas│  │ • SEC    │  │ • OpenAI API  │  │
│  └──────────┘  └──────────┘  └──────────┘  └───────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. 마이크로서비스 상세 구조

### 2.1 Verification Service (검증 서비스)

**책임:**
- 신분증/자격증 OCR 및 검증
- 포트폴리오 진위성 확인
- 스킬 테스트 관리
- 검증 레벨 업그레이드/다운그레이드

**API 엔드포인트:**
```
POST   /api/v1/verification/id              - 신분증 검증
POST   /api/v1/verification/certificate     - 자격증 검증
POST   /api/v1/verification/portfolio       - 포트폴리오 검증
POST   /api/v1/verification/skill-test      - 스킬 테스트 제출
GET    /api/v1/verification/status/:userId  - 검증 상태 조회
```

**데이터베이스 스키마:**
```sql
CREATE TABLE verifications (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    verification_type VARCHAR(50), -- 'id', 'certificate', 'portfolio'
    status VARCHAR(20), -- 'pending', 'approved', 'rejected'
    level INT, -- 0, 1, 2, 3
    document_url TEXT,
    ai_confidence_score DECIMAL(5,2),
    verified_at TIMESTAMP,
    expires_at TIMESTAMP,
    verified_by UUID, -- AI or human reviewer
    metadata JSONB
);

CREATE TABLE skill_tests (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    category VARCHAR(100),
    test_type VARCHAR(50), -- 'quiz', 'video', 'practical'
    score INT,
    passed BOOLEAN,
    taken_at TIMESTAMP,
    answers JSONB
);
```

---

### 2.2 Trust Score Service (신뢰도 점수 서비스)

**책임:**
- Trust Score 실시간 계산
- ML 모델 실행 및 업데이트
- 성과 기반 점수 조정
- 이력 추적

**API 엔드포인트:**
```
GET    /api/v1/trust-score/:userId          - Trust Score 조회
POST   /api/v1/trust-score/calculate        - 점수 재계산 (트리거)
GET    /api/v1/trust-score/history/:userId  - 점수 이력 조회
GET    /api/v1/trust-score/breakdown/:userId - 점수 상세 분석
```

**계산 알고리즘:**
```python
def calculate_trust_score(user_id):
    """
    Trust Score = 완료율(40%) + 응답속도(20%) + 평점(20%) 
                + 분쟁이력(10%) + 거래량(10%)
    """
    user_data = get_user_transaction_data(user_id, days=90)
    
    # 1. 완료율 (0-400점)
    completion_rate = user_data['completed'] / user_data['total_jobs']
    completion_score = completion_rate * 400
    
    # 2. 응답 속도 (0-200점)
    avg_response_time = user_data['avg_response_time_minutes']
    if avg_response_time <= 10:
        response_score = 200
    elif avg_response_time <= 30:
        response_score = 150
    elif avg_response_time <= 60:
        response_score = 100
    else:
        response_score = 50
    
    # 3. 평균 평점 (0-200점)
    avg_rating = user_data['avg_rating']  # 0-5
    rating_score = (avg_rating / 5.0) * 200
    
    # 4. 분쟁 이력 (0-100점, 역점수)
    dispute_count = user_data['dispute_count']
    if dispute_count == 0:
        dispute_score = 100
    elif dispute_count <= 2:
        dispute_score = 70
    elif dispute_count <= 5:
        dispute_score = 40
    else:
        dispute_score = 0
    
    # 5. 거래량 (0-100점)
    total_jobs = user_data['total_jobs']
    if total_jobs >= 100:
        volume_score = 100
    elif total_jobs >= 50:
        volume_score = 80
    elif total_jobs >= 20:
        volume_score = 60
    elif total_jobs >= 10:
        volume_score = 40
    else:
        volume_score = 20
    
    # 시간 가중치 적용 (최근 활동 중요)
    recent_30days_weight = 1.0
    recent_60days_weight = 0.7
    recent_90days_weight = 0.4
    
    total_score = (
        completion_score + 
        response_score + 
        rating_score + 
        dispute_score + 
        volume_score
    )
    
    # 0-1000 범위로 정규화
    final_score = min(1000, max(0, int(total_score)))
    
    return final_score
```

**데이터베이스 스키마:**
```sql
CREATE TABLE trust_scores (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) UNIQUE,
    current_score INT CHECK (current_score BETWEEN 0 AND 1000),
    completion_rate_score INT,
    response_time_score INT,
    rating_score INT,
    dispute_score INT,
    transaction_volume_score INT,
    level INT, -- 0, 1, 2, 3
    calculated_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE trust_score_history (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    score INT,
    change_reason TEXT,
    transaction_id UUID,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_trust_scores_user ON trust_scores(user_id);
CREATE INDEX idx_trust_score_history_user ON trust_score_history(user_id);
```

---

### 2.3 AI Oracle Service (AI 검증 서비스)

**책임:**
- 작업 완료 증명 자동 검증
- 이미지/비디오 품질 분석
- Before/After 비교
- 자동 승인 여부 판단

**API 엔드포인트:**
```
POST   /api/v1/oracle/verify-completion     - 완료 증명 검증
POST   /api/v1/oracle/analyze-images        - 이미지 분석
POST   /api/v1/oracle/detect-fraud          - 사기 패턴 탐지
GET    /api/v1/oracle/confidence/:jobId     - 신뢰도 점수 조회
```

**이미지 분석 파이프라인:**
```python
class CompletionVerificationPipeline:
    """작업 완료 검증 파이프라인"""
    
    def __init__(self):
        self.vision_model = load_computer_vision_model()
        self.fraud_detector = load_fraud_detection_model()
        
    def verify_completion(self, job_id, images_before, images_after, metadata):
        """
        메인 검증 함수
        Returns: {
            'approved': bool,
            'confidence': float,
            'quality_score': int,
            'issues': list,
            'recommendation': str
        }
        """
        results = {
            'quality_check': self.check_image_quality(images_before + images_after),
            'comparison': self.compare_before_after(images_before, images_after),
            'metadata': self.verify_metadata(images_before, images_after, metadata),
            'fraud_check': self.detect_fraud_patterns(images_before, images_after),
            'scope_check': self.verify_scope(job_id, images_after)
        }
        
        # 종합 평가
        confidence = self.calculate_confidence(results)
        quality_score = self.calculate_quality_score(results)
        
        # 자동 승인 결정
        if confidence >= 0.90 and quality_score >= 85:
            recommendation = 'auto_approve'
        elif confidence >= 0.70:
            recommendation = 'customer_review'
        else:
            recommendation = 'manual_review'
        
        return {
            'approved': confidence >= 0.90,
            'confidence': confidence,
            'quality_score': quality_score,
            'issues': results.get('issues', []),
            'recommendation': recommendation,
            'details': results
        }
    
    def check_image_quality(self, images):
        """이미지 품질 검사"""
        quality_scores = []
        
        for img in images:
            # 해상도 확인
            resolution = img.shape[0] * img.shape[1]
            resolution_score = min(100, (resolution / (1920 * 1080)) * 100)
            
            # 선명도 확인 (Laplacian variance)
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            sharpness = cv2.Laplacian(gray, cv2.CV_64F).var()
            sharpness_score = min(100, (sharpness / 500) * 100)
            
            # 조명 확인
            brightness = np.mean(gray)
            if 50 <= brightness <= 200:
                lighting_score = 100
            else:
                lighting_score = 60
            
            # 블러 탐지
            blur_score = 100 - self.detect_blur(img) * 100
            
            quality_scores.append({
                'resolution': resolution_score,
                'sharpness': sharpness_score,
                'lighting': lighting_score,
                'blur': blur_score,
                'overall': np.mean([resolution_score, sharpness_score, 
                                   lighting_score, blur_score])
            })
        
        return {
            'scores': quality_scores,
            'average': np.mean([s['overall'] for s in quality_scores]),
            'passed': all(s['overall'] >= 70 for s in quality_scores)
        }
    
    def compare_before_after(self, images_before, images_after):
        """Before/After 비교 분석"""
        comparisons = []
        
        for before, after in zip(images_before, images_after):
            # Structural Similarity Index (SSIM)
            similarity = self.calculate_ssim(before, after)
            
            # 변화 탐지
            diff = cv2.absdiff(before, after)
            change_percentage = (np.sum(diff > 30) / diff.size) * 100
            
            # 개선도 평가
            cleanliness_before = self.assess_cleanliness(before)
            cleanliness_after = self.assess_cleanliness(after)
            improvement = cleanliness_after - cleanliness_before
            
            comparisons.append({
                'similarity': similarity,
                'change_percentage': change_percentage,
                'cleanliness_before': cleanliness_before,
                'cleanliness_after': cleanliness_after,
                'improvement': improvement,
                'significant_change': change_percentage > 10
            })
        
        return {
            'comparisons': comparisons,
            'avg_improvement': np.mean([c['improvement'] for c in comparisons]),
            'passed': all(c['improvement'] > 20 for c in comparisons)
        }
    
    def verify_metadata(self, images_before, images_after, job_metadata):
        """메타데이터 검증"""
        issues = []
        
        # 촬영 시간 확인
        for idx, img in enumerate(images_before + images_after):
            exif_data = self.extract_exif(img)
            
            if exif_data:
                photo_time = exif_data.get('DateTime')
                if not self.is_within_job_timeframe(photo_time, job_metadata):
                    issues.append(f"Image {idx}: Photo taken outside job timeframe")
                
                # GPS 위치 확인
                gps = exif_data.get('GPS')
                if gps and not self.is_near_job_location(gps, job_metadata['location']):
                    issues.append(f"Image {idx}: Photo location doesn't match job address")
                
                # 카메라 일관성
                camera = exif_data.get('Model')
                # 모든 사진이 동일 카메라에서 촬영되었는지 확인
        
        return {
            'issues': issues,
            'passed': len(issues) == 0
        }
    
    def detect_fraud_patterns(self, images_before, images_after):
        """사기 패턴 탐지"""
        fraud_signals = []
        
        # 1. 이미지 역검색 (stock image 탐지)
        for img in images_after:
            if self.is_stock_image(img):
                fraud_signals.append("Stock image detected")
        
        # 2. 과거 작업물 재사용 검사
        for img in images_after:
            if self.is_duplicate_from_history(img):
                fraud_signals.append("Image reused from past job")
        
        # 3. 포토샵 조작 탐지
        for img in images_after:
            if self.detect_photoshop_manipulation(img):
                fraud_signals.append("Image manipulation detected")
        
        return {
            'signals': fraud_signals,
            'risk_score': len(fraud_signals) * 0.3,  # 0-1 scale
            'passed': len(fraud_signals) == 0
        }
```

---

## 3. 데이터 흐름

### 3.1 신분 인증 데이터 흐름

```
[사용자] 
    │
    │ 1. 신분증 사진 촬영
    │
    ▼
[Mobile App]
    │
    │ 2. 이미지 업로드 (Base64 or Multipart)
    │
    ▼
[API Gateway]
    │
    │ 3. JWT 토큰 검증
    │
    ▼
[Verification Service]
    │
    │ 4. S3에 원본 이미지 저장
    │
    ├─────────────────┐
    │                 │
    ▼                 ▼
[OCR Engine]    [Fraud Detector]
    │                 │
    │ 5. 텍스트 추출  │ 6. 위조 탐지
    │                 │
    ▼                 ▼
[PhilSys API]   [Face Recognition]
    │                 │
    │ 7. 신분 확인    │ 8. 얼굴 매칭
    │                 │
    └────────┬────────┘
             │
             ▼
    [Trust Score Service]
             │
             │ 9. Trust Score 업데이트
             │
             ▼
       [PostgreSQL]
             │
             │ 10. 검증 결과 저장
             │
             ▼
    [Notification Service]
             │
             │ 11. 사용자에게 알림 발송
             │
             ▼
        [사용자]
```

---

### 3.2 작업 완료 검증 데이터 흐름

```
[제공자]
    │
    │ 1. Before/After 사진 + 메모 제출
    │
    ▼
[Mobile App]
    │
    │ 2. 이미지 업로드 + 메타데이터
    │
    ▼
[API Gateway]
    │
    ▼
[Transaction Service]
    │
    │ 3. Job ID 및 계약 조건 로드
    │
    ▼
[AI Oracle Service]
    │
    ├──────────────────────────┬──────────────────┐
    │                          │                  │
    ▼                          ▼                  ▼
[Image Quality]         [Before/After]      [Metadata]
[Checker]               [Comparator]        [Validator]
    │                          │                  │
    │ 4. 품질 검사             │ 5. 개선도 분석   │ 6. EXIF 검증
    │                          │                  │
    └──────────────┬───────────┴──────────────────┘
                   │
                   ▼
         [Fraud Detection ML]
                   │
                   │ 7. 사기 패턴 탐지
                   │
                   ▼
          [Confidence Calculator]
                   │
                   │ 8. 종합 신뢰도 계산
                   │
                   ├───────────┬────────────┬──────────────┐
                   │           │            │              │
                   ▼           ▼            ▼              ▼
            [>90%]       [70-89%]      [<70%]       [Fraud]
        자동 승인       고객 확인      수동 리뷰      거부
                   │           │            │              │
                   └───────────┴────────────┴──────────────┘
                                │
                                ▼
                        [고객에게 알림]
                                │
                                ▼
                          [고객 확인]
                                │
                                ▼
                         [에스크로 릴리스]
                                │
                                ▼
                      [Trust Score 업데이트]
```

---

## 4. 기술 스택 상세

### 4.1 Backend

**Node.js/NestJS Microservices:**
- **User Service**: Express, TypeORM, JWT
- **Provider Service**: NestJS, TypeORM, WebSocket
- **Verification Service**: NestJS, Bull (Job Queue)
- **Trust Score Service**: NestJS, TensorFlow.js
- **Transaction Service**: NestJS, TypeORM, Blockchain SDK
- **AI Oracle Service**: Python FastAPI (not Node.js)
- **Notification Service**: NestJS, Firebase Cloud Messaging, Twilio
- **Analytics Service**: NestJS, ElasticSearch

**Communication:**
- REST APIs for synchronous communication
- RabbitMQ for asynchronous messaging
- Redis Pub/Sub for real-time events
- gRPC for inter-service communication (high performance)

---

### 4.2 AI/ML Stack

**Python Services:**
- **Framework**: FastAPI, Flask
- **ML Libraries**: 
  - TensorFlow 2.x (Computer Vision)
  - scikit-learn (Classical ML)
  - XGBoost (Trust Score Model)
  - OpenCV (Image Processing)
  - Tesseract OCR (Text Extraction)
- **NLP**: OpenAI GPT-4 API, Hugging Face Transformers
- **Model Deployment**: TensorFlow Serving, TorchServe
- **Model Training**: Jupyter Notebooks, MLflow

---

### 4.3 Infrastructure

**Cloud Provider**: AWS / Google Cloud / Azure

**Compute:**
- ECS/EKS for container orchestration
- EC2 for ML model training
- Lambda for serverless functions

**Storage:**
- S3 for images/documents
- CloudFront CDN for static assets

**Networking:**
- VPC with private subnets for services
- Application Load Balancer
- CloudFlare for DDoS protection

**Monitoring:**
- CloudWatch / Datadog for metrics
- Sentry for error tracking
- ELK Stack for log aggregation

---

이 문서는 Part 1입니다. 다음 문서들이 이어집니다:
- Part 2: 작업 흐름도 (Workflow Diagrams)
- Part 3: 데이터베이스 스키마
- Part 4: API 설계
- Part 5: 배포 및 확장 전략
