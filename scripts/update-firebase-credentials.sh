#!/bin/bash

# Script to update Firebase credentials from new JSON file
# Usage: ./scripts/update-firebase-credentials.sh [path-to-new-json-file]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# Check if new JSON file path is provided
if [ -z "$1" ]; then
    echo "❌ 사용법: $0 <새-json-파일-경로>"
    echo "   예: $0 gig-market-85c5e-firebase-adminsdk-fbsvc-2e9a70daf5.json"
    exit 1
fi

NEW_JSON_FILE="$1"

# If relative path, make it absolute or check in project root
if [ ! -f "$NEW_JSON_FILE" ]; then
    # Try in project root
    if [ -f "$PROJECT_ROOT/$NEW_JSON_FILE" ]; then
        NEW_JSON_FILE="$PROJECT_ROOT/$NEW_JSON_FILE"
    else
        echo "❌ 파일을 찾을 수 없습니다: $NEW_JSON_FILE"
        exit 1
    fi
fi

echo "📋 새 Firebase 키 파일: $NEW_JSON_FILE"
echo ""

# Validate JSON file
if ! python3 -m json.tool "$NEW_JSON_FILE" > /dev/null 2>&1; then
    echo "❌ JSON 파일 형식이 올바르지 않습니다."
    exit 1
fi

# Extract values from JSON
echo "🔍 JSON 파일에서 정보 추출 중..."
PROJECT_ID=$(python3 -c "import json; f=open('$NEW_JSON_FILE'); data=json.load(f); print(data['project_id'])")
CLIENT_EMAIL=$(python3 -c "import json; f=open('$NEW_JSON_FILE'); data=json.load(f); print(data['client_email'])")
PRIVATE_KEY=$(python3 -c "import json; f=open('$NEW_JSON_FILE'); data=json.load(f); print(data['private_key'])")

if [ -z "$PROJECT_ID" ] || [ -z "$CLIENT_EMAIL" ] || [ -z "$PRIVATE_KEY" ]; then
    echo "❌ JSON 파일에서 필요한 정보를 찾을 수 없습니다."
    exit 1
fi

echo "✅ 추출된 정보:"
echo "   Project ID: $PROJECT_ID"
echo "   Client Email: $CLIENT_EMAIL"
echo "   Private Key: ${#PRIVATE_KEY} characters"
echo ""

# Backup existing files
echo "💾 기존 파일 백업 중..."
if [ -f ".env" ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo "   ✅ .env 백업 완료"
fi

if [ -f "gig-market-85c5e-firebase-adminsdk-fbsvc-5bbe1ab218.json" ]; then
    cp gig-market-85c5e-firebase-adminsdk-fbsvc-5bbe1ab218.json gig-market-85c5e-firebase-adminsdk-fbsvc-5bbe1ab218.json.backup.$(date +%Y%m%d_%H%M%S)
    echo "   ✅ 기존 JSON 파일 백업 완료"
fi

# Update .env file
echo ""
echo "📝 .env 파일 업데이트 중..."

# Escape private key for .env file (replace newlines with \n)
ESCAPED_PRIVATE_KEY=$(echo "$PRIVATE_KEY" | sed 's/\\/\\\\/g' | sed 's/$/\\n/' | tr -d '\n' | sed 's/\\n$//')

# Update .env file
python3 << EOF
import re

# Read .env file
with open('.env', 'r') as f:
    env_content = f.read()

# Update FIREBASE_PROJECT_ID
env_content = re.sub(
    r'^FIREBASE_PROJECT_ID=.*$',
    f'FIREBASE_PROJECT_ID={PROJECT_ID}',
    env_content,
    flags=re.MULTILINE
)

# Update FIREBASE_CLIENT_EMAIL
env_content = re.sub(
    r'^FIREBASE_CLIENT_EMAIL=.*$',
    f'FIREBASE_CLIENT_EMAIL={CLIENT_EMAIL}',
    env_content,
    flags=re.MULTILINE
)

# Update FIREBASE_PRIVATE_KEY
# Escape the private key properly
escaped_key = """$PRIVATE_KEY""".replace('\n', '\\n').replace('"', '\\"')
env_content = re.sub(
    r'^FIREBASE_PRIVATE_KEY=.*$',
    f'FIREBASE_PRIVATE_KEY="{escaped_key}"',
    env_content,
    flags=re.MULTILINE
)

# Write back
with open('.env', 'w') as f:
    f.write(env_content)

print("✅ .env 파일 업데이트 완료")
EOF

# Copy new JSON file
NEW_JSON_FILENAME=$(basename "$NEW_JSON_FILE")
cp "$NEW_JSON_FILE" "$PROJECT_ROOT/$NEW_JSON_FILENAME"
echo "✅ 새 JSON 파일 복사 완료: $NEW_JSON_FILENAME"

# Also keep the old filename for compatibility (optional)
# cp "$NEW_JSON_FILE" "$PROJECT_ROOT/gig-market-85c5e-firebase-adminsdk-fbsvc-5bbe1ab218.json"
# echo "✅ 호환성을 위해 기존 파일명으로도 복사 완료"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Firebase 인증서 업데이트 완료!"
echo ""
echo "📋 다음 단계:"
echo "   1. 서버 재시작: pm2 restart gig-core"
echo "   2. 테스트 실행: npx ts-node scripts/send-sample-notification-to-all-devices.ts"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
