# S3 Bucket 설정 가이드

이 문서는 gig-core 프로젝트를 위한 AWS S3 버킷 설정 옵션을 제공합니다.

---

## 1. 버킷 이름 규칙

### 권장 명명 규칙
```
{project-name}-{environment}-{purpose}-{region}
```

### 예시
- **프로덕션**: `gig-core-prod-storage-ap-southeast-1`
- **스테이징**: `gig-core-staging-storage-ap-southeast-1`
- **개발**: `gig-core-dev-storage-ap-southeast-1`

### 명명 규칙 고려사항
- ✅ 전역적으로 고유해야 함 (모든 AWS 계정에서)
- ✅ 소문자, 숫자, 하이픈(-)만 사용
- ✅ 3-63자 길이
- ✅ IP 주소 형식 불가
- ✅ `xn--` 또는 `sthree-`로 시작 불가

---

## 2. 리전 선택

### 권장 리전: `ap-southeast-1` (싱가포르)

**이유:**
- 한국 사용자에게 낮은 지연시간
- RFQ/Quote 파일 저장에 적합
- 비용 효율적
- 데이터 주권 준수 (필요시)

### 대안 리전
- `ap-northeast-2` (서울) - 한국 사용자에게 가장 빠름
- `us-east-1` (버지니아) - 가장 저렴하지만 지연시간 높음

---

## 3. 버킷 설정 옵션

### 3.1 버전 관리 (Versioning)

**권장: 활성화**

```json
{
  "Status": "Enabled",
  "MfaDelete": "Disabled"
}
```

**이유:**
- 실수로 삭제된 파일 복구 가능
- 파일 변경 이력 추적
- RFQ/Quote 파일의 무결성 보장

**비용 고려:**
- 모든 버전이 저장되므로 스토리지 비용 증가
- 라이프사이클 정책으로 오래된 버전 자동 삭제 권장

---

### 3.2 서버 측 암호화 (Server-Side Encryption)

**권장: AWS KMS (SSE-KMS)**

```json
{
  "Rules": [
    {
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "aws:kms",
        "KMSMasterKeyID": "arn:aws:kms:ap-southeast-1:ACCOUNT_ID:key/KEY_ID"
      },
      "BucketKeyEnabled": true
    }
  ]
}
```

**옵션 비교:**

| 옵션 | 보안 | 성능 | 비용 | 권장 |
|------|------|------|------|------|
| **SSE-S3** | 높음 | 빠름 | 낮음 | 개발/테스트 |
| **SSE-KMS** | 매우 높음 | 보통 | 중간 | **프로덕션 권장** |
| **SSE-C** | 높음 | 빠름 | 낮음 | 클라이언트 관리 복잡 |

**SSE-KMS 선택 이유:**
- 암호화 키 세밀한 제어
- CloudTrail로 키 사용 추적
- 규정 준수 요구사항 충족
- Bucket Key로 비용 절감

---

### 3.3 퍼블릭 액세스 차단 (Block Public Access)

**권장: 모든 설정 활성화**

```
✅ Block all public access: ON
  ✅ Block public access to buckets and objects granted through new access control lists (ACLs)
  ✅ Block public access to buckets and objects granted through any access control lists (ACLs)
  ✅ Block public access to buckets and objects granted through new public bucket or access point policies
  ✅ Block public access to buckets and objects granted through any public bucket or access point policies
```

**이유:**
- 보안 강화
- 실수로 공개되는 것 방지
- 필요한 파일은 Presigned URL로 제공

---

### 3.4 객체 소유권 (Object Ownership)

**권장: ACLs 비활성화 (Bucket owner enforced)**

```
Object Ownership: Bucket owner enforced
```

**이유:**
- 간단한 권한 관리
- ACL 복잡성 제거
- 버킷 소유자가 모든 객체 소유

---

### 3.5 CORS 설정 (Cross-Origin Resource Sharing)

**프로덕션 설정:**

```json
[
  {
    "AllowedHeaders": [
      "Authorization",
      "Content-Length",
      "Content-Type",
      "x-amz-date",
      "x-amz-security-token"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedOrigins": [
      "https://yourdomain.com",
      "https://www.yourdomain.com",
      "https://app.yourdomain.com"
    ],
    "ExposeHeaders": [
      "ETag",
      "x-amz-request-id"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

**개발 환경:**

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000"
    ],
    "ExposeHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

---

### 3.6 라이프사이클 정책 (Lifecycle Policies)

**권장 설정:**

```json
{
  "Rules": [
    {
      "Id": "DeleteOldVersions",
      "Status": "Enabled",
      "NoncurrentVersionExpiration": {
        "NoncurrentDays": 30
      }
    },
    {
      "Id": "TransitionToIA",
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 90,
          "StorageClass": "STANDARD_IA"
        }
      ],
      "Filter": {
        "Prefix": "rfqs/"
      }
    },
    {
      "Id": "TransitionToGlacier",
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 365,
          "StorageClass": "GLACIER"
        }
      ],
      "Filter": {
        "Prefix": "rfqs/"
      }
    },
    {
      "Id": "DeleteIncompleteMultipartUploads",
      "Status": "Enabled",
      "AbortIncompleteMultipartUpload": {
        "DaysAfterInitiation": 7
      }
    }
  ]
}
```

**설명:**
- **30일 후**: 오래된 버전 자동 삭제
- **90일 후**: Infrequent Access로 전환 (비용 50% 절감)
- **365일 후**: Glacier로 전환 (비용 80% 절감)
- **7일 후**: 불완전한 멀티파트 업로드 삭제

---

### 3.7 로깅 (Server Access Logging)

**권장: 활성화**

```
Target bucket: gig-core-prod-logs-ap-southeast-1
Target prefix: s3-access-logs/
```

**이유:**
- 보안 감사
- 액세스 패턴 분석
- 문제 해결
- 규정 준수

**주의:**
- 별도 버킷 필요 (무한 루프 방지)
- 로그 파일 저장 비용 발생

---

### 3.8 이벤트 알림 (Event Notifications)

**권장 이벤트:**

```json
{
  "Events": [
    "s3:ObjectCreated:*",
    "s3:ObjectRemoved:*"
  ],
  "Filter": {
    "Key": {
      "FilterRules": [
        {
          "Name": "prefix",
          "Value": "rfqs/"
        }
      ]
    }
  }
}
```

**대상:**
- SNS Topic (알림)
- SQS Queue (비동기 처리)
- Lambda Function (자동화)

**사용 사례:**
- RFQ 파일 업로드 시 알림
- Quote 생성 시 워크플로우 트리거
- 파일 삭제 시 감사 로그

---

### 3.9 버킷 정책 (Bucket Policy)

**최소 권한 원칙 적용:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowAppServerAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT_ID:role/gig-core-app-role"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::gig-core-prod-storage-ap-southeast-1",
        "arn:aws:s3:::gig-core-prod-storage-ap-southeast-1/*"
      ]
    },
    {
      "Sid": "DenyPublicAccess",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::gig-core-prod-storage-ap-southeast-1",
        "arn:aws:s3:::gig-core-prod-storage-ap-southeast-1/*"
      ],
      "Condition": {
        "Bool": {
          "aws:PublicAccess": "true"
        }
      }
    }
  ]
}
```

---

### 3.10 태그 (Tags)

**권장 태그:**

```
Key: Environment, Value: production
Key: Project, Value: gig-core
Key: Purpose, Value: rfq-quote-storage
Key: ManagedBy, Value: terraform (또는 manual)
Key: CostCenter, Value: engineering
Key: DataClassification, Value: internal
```

**이유:**
- 비용 추적
- 리소스 관리
- 정책 적용

---

### 3.11 요청 결제 (Request Payer)

**권장: 버킷 소유자**

```
Request Payer: Bucket owner
```

**이유:**
- 일반적인 설정
- 버킷 소유자가 모든 비용 부담

---

### 3.12 전송 가속화 (Transfer Acceleration)

**권장: 비활성화 (필요시 활성화)**

**활성화 조건:**
- 전 세계 사용자
- 대용량 파일 업로드
- 낮은 지연시간 필요

**비용:**
- 추가 데이터 전송 비용 발생

---

## 4. IAM 역할 및 정책

### 4.1 애플리케이션용 IAM 역할

**역할 이름:** `gig-core-s3-access-role`

**신뢰 정책:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

**권한 정책:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3BucketAccess",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::gig-core-prod-storage-ap-southeast-1",
        "arn:aws:s3:::gig-core-prod-storage-ap-southeast-1/*"
      ]
    },
    {
      "Sid": "KMSKeyAccess",
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt",
        "kms:Encrypt",
        "kms:GenerateDataKey"
      ],
      "Resource": "arn:aws:kms:ap-southeast-1:ACCOUNT_ID:key/KEY_ID"
    }
  ]
}
```

---

## 5. KMS 키 설정 (SSE-KMS 사용 시)

### 5.1 KMS 키 생성

**키 유형:** Symmetric
**키 사용:** Encrypt and decrypt
**키 관리:** AWS managed key 또는 Customer managed key

**Customer managed key 권장 설정:**

```json
{
  "KeyPolicy": {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "Enable IAM User Permissions",
        "Effect": "Allow",
        "Principal": {
          "AWS": "arn:aws:iam::ACCOUNT_ID:root"
        },
        "Action": "kms:*",
        "Resource": "*"
      },
      {
        "Sid": "Allow S3 Service",
        "Effect": "Allow",
        "Principal": {
          "Service": "s3.amazonaws.com"
        },
        "Action": [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ],
        "Resource": "*"
      }
    ]
  }
}
```

---

## 6. 비용 최적화

### 6.1 스토리지 클래스 선택

| 스토리지 클래스 | 용도 | 비용 (GB/월) | 접근 시간 |
|----------------|------|--------------|-----------|
| **Standard** | 자주 접근 | $0.023 | 즉시 |
| **Standard-IA** | 가끔 접근 | $0.0125 | 즉시 |
| **Glacier Instant Retrieval** | 아카이브 (즉시 필요) | $0.004 | 즉시 |
| **Glacier Flexible Retrieval** | 아카이브 | $0.0036 | 1-5분 |
| **Glacier Deep Archive** | 장기 아카이브 | $0.00099 | 12시간 |

**권장:**
- 활성 RFQ/Quote: Standard
- 90일 이상: Standard-IA
- 1년 이상: Glacier

### 6.2 비용 모니터링

**CloudWatch 메트릭:**
- `BucketSizeBytes`
- `NumberOfObjects`
- `AllRequests`

**비용 알림:**
- 월 예산 초과 시 SNS 알림 설정

---

## 7. 보안 체크리스트

- [ ] 버전 관리 활성화
- [ ] 서버 측 암호화 활성화 (SSE-KMS)
- [ ] 퍼블릭 액세스 차단 활성화
- [ ] MFA 삭제 활성화 (선택사항)
- [ ] 버킷 정책으로 최소 권한 적용
- [ ] CORS 설정 (필요한 도메인만)
- [ ] 로깅 활성화
- [ ] 라이프사이클 정책 설정
- [ ] 태그 추가
- [ ] 정기적인 액세스 감사

---

## 8. 환경별 설정 요약

### 프로덕션

```yaml
Bucket Name: gig-core-prod-storage-ap-southeast-1
Region: ap-southeast-1
Versioning: Enabled
Encryption: SSE-KMS
Public Access: Blocked
CORS: Production domains only
Lifecycle: 90 days → IA, 365 days → Glacier
Logging: Enabled
MFA Delete: Enabled (optional)
```

### 스테이징

```yaml
Bucket Name: gig-core-staging-storage-ap-southeast-1
Region: ap-southeast-1
Versioning: Enabled
Encryption: SSE-S3 (비용 절감)
Public Access: Blocked
CORS: Staging domains + localhost
Lifecycle: 30 days → IA
Logging: Enabled
MFA Delete: Disabled
```

### 개발

```yaml
Bucket Name: gig-core-dev-storage-ap-southeast-1
Region: ap-southeast-1
Versioning: Disabled (비용 절감)
Encryption: SSE-S3
Public Access: Blocked
CORS: All localhost ports
Lifecycle: None
Logging: Disabled
MFA Delete: Disabled
```

---

## 9. AWS CLI 명령어 예시

### 버킷 생성

```bash
aws s3api create-bucket \
  --bucket gig-core-prod-storage-ap-southeast-1 \
  --region ap-southeast-1 \
  --create-bucket-configuration LocationConstraint=ap-southeast-1
```

### 버전 관리 활성화

```bash
aws s3api put-bucket-versioning \
  --bucket gig-core-prod-storage-ap-southeast-1 \
  --versioning-configuration Status=Enabled
```

### 암호화 설정

```bash
aws s3api put-bucket-encryption \
  --bucket gig-core-prod-storage-ap-southeast-1 \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "aws:kms",
        "KMSMasterKeyID": "arn:aws:kms:ap-southeast-1:ACCOUNT_ID:key/KEY_ID"
      },
      "BucketKeyEnabled": true
    }]
  }'
```

### 퍼블릭 액세스 차단

```bash
aws s3api put-public-access-block \
  --bucket gig-core-prod-storage-ap-southeast-1 \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

### CORS 설정

```bash
aws s3api put-bucket-cors \
  --bucket gig-core-prod-storage-ap-southeast-1 \
  --cors-configuration file://cors-config.json
```

### 라이프사이클 정책

```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket gig-core-prod-storage-ap-southeast-1 \
  --lifecycle-configuration file://lifecycle-config.json
```

### 버킷 정책

```bash
aws s3api put-bucket-policy \
  --bucket gig-core-prod-storage-ap-southeast-1 \
  --policy file://bucket-policy.json
```

---

## 10. Terraform 설정 예시 (선택사항)

```hcl
resource "aws_s3_bucket" "gig_core_storage" {
  bucket = "gig-core-prod-storage-ap-southeast-1"
  
  tags = {
    Environment = "production"
    Project     = "gig-core"
    Purpose     = "rfq-quote-storage"
  }
}

resource "aws_s3_bucket_versioning" "gig_core_storage" {
  bucket = aws_s3_bucket.gig_core_storage.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "gig_core_storage" {
  bucket = aws_s3_bucket.gig_core_storage.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3_key.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "gig_core_storage" {
  bucket = aws_s3_bucket.gig_core_storage.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "gig_core_storage" {
  bucket = aws_s3_bucket.gig_core_storage.id

  rule {
    id     = "DeleteOldVersions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }

  rule {
    id     = "TransitionToIA"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }

    filter {
      prefix = "rfqs/"
    }
  }
}
```

---

## 11. .env 파일 업데이트

버킷 생성 후 `.env` 파일에 다음을 추가:

```env
# AWS S3 Configuration
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_S3_BUCKET=gig-core-prod-storage-ap-southeast-1

# KMS Key (SSE-KMS 사용 시)
AWS_KMS_KEY_ID=arn:aws:kms:ap-southeast-1:ACCOUNT_ID:key/KEY_ID
```

---

## 12. 테스트 체크리스트

버킷 생성 후 다음을 테스트:

- [ ] 파일 업로드 테스트
- [ ] 파일 다운로드 테스트
- [ ] Presigned URL 생성 테스트
- [ ] 폴더 생성 테스트
- [ ] CORS 동작 확인
- [ ] 암호화 확인 (파일 메타데이터)
- [ ] 버전 관리 확인
- [ ] 라이프사이클 정책 동작 확인
- [ ] 로깅 확인
- [ ] 권한 테스트 (IAM 역할)

---

## 참고 자료

- [AWS S3 Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html)
- [S3 Pricing](https://aws.amazon.com/s3/pricing/)
- [S3 Security](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security.html)
- [S3 Lifecycle Policies](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html)

