#!/bin/bash

# EC2 서버에서 User 엔티티 파일 수정 스크립트
# EC2 서버에서 실행: bash /tmp/fix-user-entity-on-ec2.sh

set -e

APP_DIR="/var/www/gig-core"
ENTITY_FILE="$APP_DIR/src/modules/users/entities/user.entity.ts"

echo "=========================================="
echo "User 엔티티 파일 수정"
echo "=========================================="

cd "$APP_DIR"

# 파일 백업
cp "$ENTITY_FILE" "$ENTITY_FILE.backup"

# sed를 사용하여 수정
sed -i "s/@Column()$/@Column({ name: 'password_hash' })/" "$ENTITY_FILE"
sed -i "s/@Column()$/@Column({ name: 'first_name' })/" "$ENTITY_FILE" | head -1
sed -i "s/@Column()$/@Column({ name: 'last_name' })/" "$ENTITY_FILE" | head -1

# 더 정확한 수정을 위해 Python 스크립트 사용
python3 << 'PYTHON_SCRIPT'
import re

file_path = "/var/www/gig-core/src/modules/users/entities/user.entity.ts"

with open(file_path, 'r') as f:
    content = f.read()

# password 필드 수정
content = re.sub(
    r'(@Column\(\)\s+password: string;)',
    r'@Column({ name: \'password_hash\' })\n  password: string;',
    content
)

# firstName 필드 수정
content = re.sub(
    r'(@Column\(\)\s+firstName: string;)',
    r'@Column({ name: \'first_name\' })\n  firstName: string;',
    content
)

# lastName 필드 수정
content = re.sub(
    r'(@Column\(\)\s+lastName: string;)',
    r'@Column({ name: \'last_name\' })\n  lastName: string;',
    content
)

# userType 필드 수정
content = re.sub(
    r'(@Column\(\{[^}]*type: \'enum\',[^}]*enum: UserType,[^}]*default: UserType\.CONSUMER,[^}]*\}\)\s+userType: UserType;)',
    r'@Column({\n    name: \'user_type\',\n    type: \'enum\',\n    enum: UserType,\n    default: UserType.CONSUMER,\n  })\n  userType: UserType;',
    content,
    flags=re.DOTALL
)

# profileImage 필드 수정
content = re.sub(
    r'(@Column\(\{ nullable: true \}\)\s+profileImage: string;)',
    r'@Column({ name: \'profile_photo_url\', nullable: true })\n  profileImage: string;',
    content
)

# dateOfBirth 필드 수정
content = re.sub(
    r'(@Column\(\{ nullable: true \}\)\s+dateOfBirth: Date;)',
    r'@Column({ name: \'date_of_birth\', nullable: true })\n  dateOfBirth: Date;',
    content
)

# trustScore 필드 수정
content = re.sub(
    r'(@Column\(\{ type: \'decimal\', precision: 3, scale: 1, default: 0 \}\)\s+trustScore: number;)',
    r'@Column({ name: \'trust_score\', type: \'decimal\', precision: 3, scale: 1, default: 0, nullable: true })\n  trustScore: number;',
    content
)

# kycStatus 필드 수정
content = re.sub(
    r'(@Column\(\{[^}]*type: \'enum\',[^}]*enum: KYCStatus,[^}]*default: KYCStatus\.UNVERIFIED,[^}]*\}\)\s+kycStatus: KYCStatus;)',
    r'@Column({\n    name: \'kyc_status\',\n    type: \'enum\',\n    enum: KYCStatus,\n    default: KYCStatus.UNVERIFIED,\n    nullable: true,\n  })\n  kycStatus: KYCStatus;',
    content,
    flags=re.DOTALL
)

# kycLevel 필드 수정
content = re.sub(
    r'(@Column\(\{[^}]*type: \'enum\',[^}]*enum: KYCLevel,[^}]*nullable: true,[^}]*\}\)\s+kycLevel: KYCLevel;)',
    r'@Column({\n    name: \'kyc_level\',\n    type: \'enum\',\n    enum: KYCLevel,\n    nullable: true,\n  })\n  kycLevel: KYCLevel;',
    content,
    flags=re.DOTALL
)

# isEmailVerified 필드 수정
content = re.sub(
    r'(@Column\(\{ default: false \}\)\s+isEmailVerified: boolean;)',
    r'@Column({ name: \'is_email_verified\', default: false })\n  isEmailVerified: boolean;',
    content
)

# isPhoneVerified 필드 수정
content = re.sub(
    r'(@Column\(\{ default: false \}\)\s+isPhoneVerified: boolean;)',
    r'@Column({ name: \'is_phone_verified\', default: false })\n  isPhoneVerified: boolean;',
    content
)

# isIdVerified 필드 수정
content = re.sub(
    r'(@Column\(\{ default: false \}\)\s+isIdVerified: boolean;)',
    r'@Column({ name: \'is_id_verified\', default: false })\n  isIdVerified: boolean;',
    content
)

# twoFactorEnabled 필드 수정
content = re.sub(
    r'(@Column\(\{ default: false \}\)\s+twoFactorEnabled: boolean;)',
    r'@Column({ name: \'two_factor_enabled\', default: false })\n  twoFactorEnabled: boolean;',
    content
)

# status 필드 수정
content = re.sub(
    r'(@Column\(\{[^}]*type: \'enum\',[^}]*enum: UserStatus,[^}]*default: UserStatus\.ACTIVE,[^}]*\}\)\s+status: UserStatus;)',
    r'@Column({\n    name: \'status\',\n    type: \'enum\',\n    enum: UserStatus,\n    default: UserStatus.ACTIVE,\n  })\n  status: UserStatus;',
    content,
    flags=re.DOTALL
)

# isActive 필드 수정
content = re.sub(
    r'(@Column\(\{ default: true \}\)\s+isActive: boolean;)',
    r'@Column({ name: \'is_active\', default: true, nullable: true })\n  isActive: boolean;',
    content
)

# lastLoginAt 필드 수정
content = re.sub(
    r'(@Column\(\{ nullable: true \}\)\s+lastLoginAt: Date;)',
    r'@Column({ name: \'last_login_at\', nullable: true })\n  lastLoginAt: Date;',
    content
)

# createdAt 필드 수정
content = re.sub(
    r'(@CreateDateColumn\(\))',
    r'@CreateDateColumn({ name: \'created_at\' })',
    content
)

# updatedAt 필드 수정
content = re.sub(
    r'(@UpdateDateColumn\(\))',
    r'@UpdateDateColumn({ name: \'updated_at\' })',
    content
)

# deletedAt 필드 수정
content = re.sub(
    r'(@DeleteDateColumn\(\))',
    r'@DeleteDateColumn({ name: \'deleted_at\' })',
    content
)

with open(file_path, 'w') as f:
    f.write(content)

print("✅ 엔티티 파일 수정 완료!")
PYTHON_SCRIPT

echo ""
echo "빌드 중..."
npm run build

echo ""
echo "PM2 재시작 중..."
pm2 restart gig-core

echo ""
echo "=========================================="
echo "완료!"
echo "=========================================="
echo ""
echo "로그 확인:"
echo "  pm2 logs gig-core"
echo ""

