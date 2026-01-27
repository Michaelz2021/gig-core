import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import axios from 'axios';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function testFcmViaServer() {
  let client: Client | null = null;

  try {
    // 1. Get device tokens from database
    client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USERNAME || process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE || process.env.DB_NAME || 'ai_trusttrade',
    });

    await client.connect();
    console.log('✅ 데이터베이스 연결 성공');

    // 2. Query all active device tokens
    const result = await client.query(
      `SELECT user_id, fcm_token, app_mode, platform 
       FROM user_device_tokens 
       WHERE is_active = true 
       ORDER BY created_at DESC`
    );

    const activeTokens = result.rows;

    if (activeTokens.length === 0) {
      console.log('⚠️  활성화된 디바이스 토큰이 없습니다.');
      return;
    }

    console.log(`\n📱 발견된 활성 디바이스 토큰: ${activeTokens.length}개`);
    activeTokens.forEach((token, index) => {
      console.log(
        `  ${index + 1}. User: ${token.user_id.substring(0, 8)}... | App: ${token.app_mode} | Platform: ${token.platform}`,
      );
    });

    // 3. Get a user ID and login to get JWT token
    const userId = activeTokens[0].user_id;
    console.log(`\n🔑 사용자 ID: ${userId}`);
    console.log('⚠️  서버 API를 통해 테스트하려면 JWT 토큰이 필요합니다.');
    console.log('   다음 명령으로 로그인하여 토큰을 얻으세요:');
    console.log(`   curl -X POST http://localhost:3000/api/v1/auth/login \\`);
    console.log(`     -H "Content-Type: application/json" \\`);
    console.log(`     -d '{"email":"your-email","password":"your-password"}'`);
    console.log('\n   또는 서버의 NotificationsService를 직접 사용하는 방법:');
    console.log('   서버 코드에서 NotificationsService.send()를 호출하세요.');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    if (error instanceof Error) {
      console.error('   메시지:', error.message);
    }
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
      console.log('\n✅ 데이터베이스 연결 종료');
    }
  }
}

testFcmViaServer();
