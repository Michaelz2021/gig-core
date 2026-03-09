/**
 * Instant booking 푸시가 안 나갈 때, 특정 service_category_id 기준으로
 * 어느 단계에서 끊기는지 DB에서 확인하는 진단 스크립트.
 *
 * 사용법: npx ts-node -r tsconfig-paths/register scripts/diagnose-instant-booking-push.ts <service_category_id>
 * 예: npx ts-node -r tsconfig-paths/register scripts/diagnose-instant-booking-push.ts a98a4eb5-4b1e-4851-99c6-f92806ae5f61
 */
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  const categoryId = process.argv[2];
  if (!categoryId) {
    console.error('Usage: npx ts-node -r tsconfig-paths/register scripts/diagnose-instant-booking-push.ts <service_category_id>');
    process.exit(1);
  }

  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || process.env.DB_NAME || 'ai_trusttrade',
  });

  await client.connect();
  console.log('DB 연결됨. category_id:', categoryId);
  console.log('');

  try {
    // Step 1: service_listings (category_id, is_active=true)
    const listingsRes = await client.query(
      `SELECT id, provider_id FROM service_listings WHERE category_id = $1 AND is_active = true`,
      [categoryId],
    );
    const listings = listingsRes.rows;
    const providerIds = [...new Set(listings.map((r: { provider_id: string }) => r.provider_id))];

    console.log('[Step 1] service_listings (category_id, is_active=true)');
    console.log('  listings 개수:', listings.length);
    console.log('  unique provider_id 개수:', providerIds.length);
    if (providerIds.length === 0) {
      console.log('  → 여기서 끊김: 해당 카테고리의 활성 리스팅이 없음. 푸시 대상 없음.');
      return;
    }
    console.log('  provider_id 샘플:', providerIds.slice(0, 3).join(', '));
    console.log('');

    // Step 2: providers에서 user_id 조회
    const placeholders = providerIds.map((_, i) => `$${i + 1}`).join(',');
    const providersRes = await client.query(
      `SELECT id, user_id FROM providers WHERE id IN (${placeholders})`,
      providerIds,
    );
    const providers = providersRes.rows;
    const userIds = providers.map((r: { user_id: string }) => r.user_id).filter(Boolean);

    console.log('[Step 2] providers → user_id');
    console.log('  providers 개수:', providers.length);
    console.log('  user_id 개수 (non-null):', userIds.length);
    if (userIds.length === 0) {
      console.log('  → 여기서 끊김: provider에 user_id가 없음. 푸시 대상 없음.');
      return;
    }
    console.log('  user_id 샘플:', userIds.slice(0, 3).join(', '));
    console.log('');

    // Step 3: user_device_tokens (user_id, app_mode='provider', is_active=true)
    const userPlaceholders = userIds.map((_, i) => `$${i + 1}`).join(',');
    const tokensRes = await client.query(
      `SELECT user_id, app_mode, platform, LEFT(fcm_token, 20) as token_preview
       FROM user_device_tokens
       WHERE user_id IN (${userPlaceholders}) AND app_mode = 'provider' AND is_active = true`,
      userIds,
    );
    const tokens = tokensRes.rows;

    console.log('[Step 3] user_device_tokens (app_mode=provider, is_active=true)');
    console.log('  토큰 행 개수:', tokens.length);
    if (tokens.length === 0) {
      console.log('  → 여기서 끊김: provider 앱으로 등록된 FCM 토큰이 없음.');
      console.log('  → 프로바이더가 provider 앱에서 로그인/토큰 등록을 해야 함.');
      return;
    }
    tokens.forEach((t: { user_id: string; app_mode: string; platform: string; token_preview: string }, i: number) => {
      console.log(`    ${i + 1}. user_id=${t.user_id?.slice(0, 8)}... app_mode=${t.app_mode} platform=${t.platform} token=${t.token_preview}...`);
    });
    console.log('');

    console.log('[결론] Step 1~3 모두 통과. 푸시는', tokens.length, '개 디바이스로 전송 대상.');
    console.log('  서버 로그에 [InstantBooking] / [InstantBooking Push] 가 안 보이면: 배포/재시작 여부 확인.');
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
