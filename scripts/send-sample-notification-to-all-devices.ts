import { Client } from 'pg';
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

interface DeviceToken {
  id: string;
  user_id: string;
  fcm_token: string;
  app_mode: string;
  platform: string;
  device_id: string | null;
  is_active: boolean;
  created_at: Date;
}

async function sendSampleNotification() {
  let client: Client | null = null;

  try {
    // 1. Initialize database connection
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
    const result = await client.query<DeviceToken>(
      `SELECT id, user_id, fcm_token, app_mode, platform, device_id, is_active, created_at 
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
        `  ${index + 1}. User: ${token.user_id.substring(0, 8)}... | App: ${token.app_mode} | Platform: ${token.platform} | Created: ${token.created_at.toISOString()}`,
      );
    });

    // 3. Initialize Firebase Admin SDK
    // Try to use JSON file first (more reliable), fallback to .env
    const fs = require('fs');
    const jsonPath = path.join(__dirname, '..', 'gig-market-85c5e-firebase-adminsdk-fbsvc-5bbe1ab218.json');
    
    let firebaseConfig: any = null;
    
    if (fs.existsSync(jsonPath)) {
      try {
        const jsonContent = fs.readFileSync(jsonPath, 'utf8');
        const jsonData = JSON.parse(jsonContent);
        // Convert JSON format to Firebase Admin SDK format
        firebaseConfig = {
          projectId: jsonData.project_id,
          privateKey: jsonData.private_key,
          clientEmail: jsonData.client_email,
        };
        console.log('✅ Firebase JSON 파일에서 설정 로드');
      } catch (error) {
        console.log('⚠️  JSON 파일 읽기 실패, .env 사용');
      }
    }
    
    if (!firebaseConfig) {
      // Fallback to .env
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

      if (!projectId || !privateKey || !clientEmail) {
        console.error('❌ Firebase 환경 변수가 설정되지 않았습니다.');
        console.error('   필요한 변수: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL');
        return;
      }

      // Format private key (matching the logic from FcmService)
      let formattedPrivateKey = privateKey;
      formattedPrivateKey = formattedPrivateKey.trim();
      
      // Remove surrounding quotes if present
      if (formattedPrivateKey.startsWith('"') && formattedPrivateKey.endsWith('"')) {
        formattedPrivateKey = formattedPrivateKey.slice(1, -1);
      }
      if (formattedPrivateKey.startsWith("'") && formattedPrivateKey.endsWith("'")) {
        formattedPrivateKey = formattedPrivateKey.slice(1, -1);
      }
      
      // Replace escaped newlines with actual newlines
      // Handle both \\n (from .env file) and \n (if dotenv already processed it)
      formattedPrivateKey = formattedPrivateKey.replace(/\\\\n/g, '\n');  // \\n -> \n
      formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, '\n');     // \n -> actual newline
      formattedPrivateKey = formattedPrivateKey.replace(/\\\r?\n/g, '\n'); // \ followed by actual newline
      
      // Verify the key format
      if (!formattedPrivateKey.includes('BEGIN PRIVATE KEY')) {
        console.error('❌ Private key format appears incorrect. Expected "BEGIN PRIVATE KEY"');
        console.error(`   First 50 chars: ${formattedPrivateKey.substring(0, 50)}`);
        return;
      }
      
      firebaseConfig = {
        projectId,
        privateKey: formattedPrivateKey,
        clientEmail,
      };
      console.log(`✅ Private key parsed from .env (length: ${formattedPrivateKey.length})`);
    }
    
    console.log(`   Project ID: ${firebaseConfig.projectId || 'N/A'}`);
    console.log(`   Client Email: ${firebaseConfig.clientEmail || 'N/A'}`);

    // Initialize Firebase if not already initialized
    if (admin.apps.length === 0) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert(firebaseConfig),
        });
        console.log('✅ Firebase Admin SDK 초기화 완료');
        
        // Verify the credential by trying to get an access token
        const app = admin.app();
        const auth = app.auth();
        console.log('✅ Firebase Auth 모듈 로드 성공');
      } catch (initError: any) {
        console.error('❌ Firebase 초기화 실패:', initError.message);
        if (initError.message.includes('private key')) {
          console.error('   Private key 파싱에 문제가 있을 수 있습니다.');
        }
        throw initError;
      }
    } else {
      console.log('✅ 기존 Firebase 앱 인스턴스 사용');
    }

    // 4. Prepare notification message
    const deviceTokens = activeTokens.map((token) => token.fcm_token);
    const notification = {
      title: '샘플 알림 테스트',
      body: `현재 ${activeTokens.length}개의 활성 디바이스에 테스트 알림을 전송합니다. 이 메시지는 서버에서 자동으로 전송된 샘플 알림입니다.`,
      data: {
        type: 'system',
        test: 'true',
        timestamp: new Date().toISOString(),
        totalDevices: activeTokens.length.toString(),
      },
    };

    console.log(`\n📤 알림 전송 중...`);
    console.log(`   제목: ${notification.title}`);
    console.log(`   내용: ${notification.body}`);
    console.log(`   대상: ${deviceTokens.length}개 디바이스\n`);

    // 5. Send push notifications
    const messaging = admin.messaging();
    const message: admin.messaging.MulticastMessage = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: {
        ...notification.data,
        // Convert all data values to strings (FCM requirement)
        title: notification.title,
        body: notification.body,
      },
      tokens: deviceTokens,
    };

    const response = await messaging.sendEachForMulticast(message);

    // 6. Display results
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 전송 결과:');
    console.log(`   ✅ 성공: ${response.successCount}개`);
    console.log(`   ❌ 실패: ${response.failureCount}개`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (response.failureCount > 0) {
      console.log('❌ 실패한 토큰:');
      for (let idx = 0; idx < response.responses.length; idx++) {
        const resp = response.responses[idx];
        if (!resp.success) {
          const token = activeTokens[idx];
          console.log(`   - User: ${token.user_id.substring(0, 8)}... | App: ${token.app_mode} | Platform: ${token.platform}`);
          console.log(`     에러: ${resp.error?.code} - ${resp.error?.message}`);
          
          // Deactivate invalid tokens
          if (
            resp.error?.code === 'messaging/invalid-registration-token' ||
            resp.error?.code === 'messaging/registration-token-not-registered'
          ) {
            await client.query(
              'UPDATE user_device_tokens SET is_active = false WHERE id = $1',
              [token.id]
            );
            console.log(`     ⚠️  토큰 비활성화됨`);
          }
        }
      }
      console.log('');
    }

    if (response.successCount > 0) {
      console.log('✅ 샘플 알림이 성공적으로 전송되었습니다!');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    if (error instanceof Error) {
      console.error('   메시지:', error.message);
      console.error('   스택:', error.stack);
    }
    process.exit(1);
  } finally {
    // Cleanup
    if (client) {
      await client.end();
      console.log('\n✅ 데이터베이스 연결 종료');
    }
  }
}

// Run the script
sendSampleNotification().catch((error) => {
  console.error('❌ 스크립트 실행 중 오류:', error);
  process.exit(1);
});
