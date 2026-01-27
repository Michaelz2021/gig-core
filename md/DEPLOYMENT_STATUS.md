# 배포 상태 확인 및 문제 해결

## 현재 문제

로그에서 `column User.password does not exist` 오류가 발생하고 있습니다.

## 원인

1. **엔티티 수정 후 재배포 필요**: User 엔티티를 수정했지만 EC2 서버에 배포되지 않았습니다.
2. **데이터베이스 스키마와 엔티티 불일치**: 데이터베이스는 `password_hash` 컬럼을 사용하지만, 배포된 코드는 여전히 `password`를 찾고 있습니다.

## 해결 방법

### 1. 로컬에서 다시 배포 (권장)

```bash
# 배포 스크립트 실행
./scripts/deploy-to-ec2.sh 43.201.114.64 /Users/michaeljang/Downloads/OJT.pem
```

### 2. EC2 서버에서 직접 업데이트

EC2 서버에 SSH 접속 후:

```bash
cd /var/www/gig-core

# 최신 코드 가져오기 (Git 사용 시)
git pull

# 또는 로컬에서 rsync로 다시 전송
# 로컬에서:
rsync -avz --progress \
  -e "ssh -i ~/.ssh/OJT.pem" \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.env' \
  --exclude 'logs' \
  --exclude '*.log' \
  --exclude 'coverage' \
  --exclude '.DS_Store' \
  ./ ubuntu@43.201.114.64:/var/www/gig-core/

# dist 디렉토리 전송
rsync -avz --progress \
  -e "ssh -i ~/.ssh/OJT.pem" \
  dist/ ubuntu@43.201.114.64:/var/www/gig-core/dist/

# EC2에서:
cd /var/www/gig-core
npm ci --production
pm2 restart gig-core
```

### 3. 수동으로 파일 확인

EC2 서버에서 엔티티 파일이 올바르게 수정되었는지 확인:

```bash
# EC2 서버에서
cat /var/www/gig-core/src/modules/users/entities/user.entity.ts | grep -A 2 "password"
```

다음과 같이 표시되어야 합니다:
```typescript
@Column({ name: 'password_hash' })
password: string;
```

만약 `@Column()`만 있다면, 파일을 수동으로 수정하거나 다시 배포해야 합니다.

## 배포 확인

배포 후 다음을 확인하세요:

```bash
# PM2 로그 확인
pm2 logs gig-core

# Health Check
curl http://localhost:3000/api/v1/health

# 로그인 API 테스트
curl -X POST http://43.201.114.64/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

## 수정된 엔티티 필드

다음 필드들이 데이터베이스 스키마에 맞게 수정되었습니다:

- `password` → `password_hash`
- `firstName` → `first_name`
- `lastName` → `last_name`
- `userType` → `user_type`
- `profileImage` → `profile_photo_url`
- `dateOfBirth` → `date_of_birth`
- `trustScore` → `trust_score`
- `kycStatus` → `kyc_status`
- `kycLevel` → `kyc_level`
- `isEmailVerified` → `is_email_verified`
- `isPhoneVerified` → `is_phone_verified`
- `isIdVerified` → `is_id_verified`
- `twoFactorEnabled` → `two_factor_enabled`
- `lastLoginAt` → `last_login_at`
- `createdAt` → `created_at`
- `updatedAt` → `updated_at`
- `deletedAt` → `deleted_at`

