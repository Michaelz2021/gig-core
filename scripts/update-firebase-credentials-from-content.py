#!/usr/bin/env python3
"""
Update Firebase credentials in .env file and JSON file from new JSON content
This script can be used when you paste the JSON content directly
"""

import json
import re
import sys
import os
from pathlib import Path

def update_firebase_credentials(json_content_or_file):
    """Update Firebase credentials from JSON content or file path"""
    
    project_root = Path(__file__).parent.parent
    
    # Load JSON
    if os.path.isfile(json_content_or_file):
        # It's a file path
        with open(json_content_or_file, 'r') as f:
            config = json.load(f)
        json_file_path = json_content_or_file
    else:
        # It's JSON content as string
        config = json.loads(json_content_or_file)
        json_file_path = None
    
    project_id = config['project_id']
    client_email = config['client_email']
    private_key = config['private_key']
    
    print(f"✅ JSON 정보 추출 완료:")
    print(f"   Project ID: {project_id}")
    print(f"   Client Email: {client_email}")
    print(f"   Private Key: {len(private_key)} characters")
    print()
    
    # Backup .env
    env_file = project_root / '.env'
    if env_file.exists():
        backup_file = project_root / f'.env.backup.{os.popen("date +%Y%m%d_%H%M%S").read().strip()}'
        import shutil
        shutil.copy(env_file, backup_file)
        print(f"💾 .env 백업 완료: {backup_file.name}")
    
    # Update .env file
    print("📝 .env 파일 업데이트 중...")
    with open(env_file, 'r') as f:
        env_content = f.read()
    
    # Update FIREBASE_PROJECT_ID
    env_content = re.sub(
        r'^FIREBASE_PROJECT_ID=.*$',
        f'FIREBASE_PROJECT_ID={project_id}',
        env_content,
        flags=re.MULTILINE
    )
    
    # Update FIREBASE_CLIENT_EMAIL
    env_content = re.sub(
        r'^FIREBASE_CLIENT_EMAIL=.*$',
        f'FIREBASE_CLIENT_EMAIL={client_email}',
        env_content,
        flags=re.MULTILINE
    )
    
    # Update FIREBASE_PRIVATE_KEY
    # Escape newlines for .env file
    escaped_key = private_key.replace('\\', '\\\\').replace('\n', '\\n').replace('"', '\\"')
    env_content = re.sub(
        r'^FIREBASE_PRIVATE_KEY=.*$',
        f'FIREBASE_PRIVATE_KEY="{escaped_key}"',
        env_content,
        flags=re.MULTILINE
    )
    
    with open(env_file, 'w') as f:
        f.write(env_content)
    
    print("✅ .env 파일 업데이트 완료")
    
    # Save JSON file
    if json_file_path:
        # Copy the file
        import shutil
        new_json_file = project_root / os.path.basename(json_file_path)
        shutil.copy(json_file_path, new_json_file)
        print(f"✅ JSON 파일 복사 완료: {new_json_file.name}")
    else:
        # Save JSON content to file
        new_json_file = project_root / f"{project_id}-firebase-adminsdk-{client_email.split('@')[0].split('-')[-1]}-{config.get('private_key_id', 'new')[:12]}.json"
        with open(new_json_file, 'w') as f:
            json.dump(config, f, indent=2)
        print(f"✅ JSON 파일 저장 완료: {new_json_file.name}")
    
    print()
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("✅ Firebase 인증서 업데이트 완료!")
    print()
    print("📋 다음 단계:")
    print("   1. 서버 재시작: pm2 restart gig-core")
    print("   2. 테스트 실행: npx ts-node scripts/send-sample-notification-to-all-devices.ts")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("사용법:")
        print(f"  {sys.argv[0]} <json-file-path>")
        print(f"  또는 JSON 내용을 직접 입력하려면 파일 경로를 제공하세요")
        sys.exit(1)
    
    update_firebase_credentials(sys.argv[1])
