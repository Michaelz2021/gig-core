/**
 * 기존 instant_invoice 행에서 listing_id, consumer_id, provider_id를 사용해
 * listing_name, consumer_name, provider_name을 채웁니다.
 * (마이그레이션 018 추가 컬럼 백필)
 *
 * 실행: npx ts-node -r tsconfig-paths/register scripts/backfill-instant-invoice-display-names.ts
 * 또는: npm run script:backfill-instant-invoice-names
 */
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'ai_trusttrade',
  entities: [],
});

async function backfill() {
  const queryRunner = dataSource.createQueryRunner();

  try {
    await dataSource.initialize();
    console.log('✅ DB 연결 성공\n');

    // 백필 대상 행 수 확인 (listing_name, consumer_name, provider_name 중 하나라도 NULL)
    const countResult = await queryRunner.query(`
      SELECT COUNT(*) AS cnt
      FROM instant_invoice
      WHERE listing_name IS NULL OR consumer_name IS NULL OR provider_name IS NULL
    `);
    const toUpdate = parseInt(countResult[0]?.cnt ?? '0', 10);
    if (toUpdate === 0) {
      console.log('ℹ️  백필할 행이 없습니다. (이미 모두 채워져 있음)');
      return;
    }
    console.log(`📋 백필 대상: ${toUpdate}건\n`);

    // listing_id → service_listings.title
    // consumer_id → users.first_name, last_name
    // provider_id → providers.business_name 또는 providers.user → users.first_name, last_name
    const updateResult = await queryRunner.query(`
      UPDATE instant_invoice i
      SET
        listing_name = COALESCE(i.listing_name, sub.listing_title),
        consumer_name = COALESCE(i.consumer_name, sub.consumer_display_name),
        provider_name = COALESCE(i.provider_name, sub.provider_display_name)
      FROM (
        SELECT
          i2.id,
          s.title AS listing_title,
          TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) AS consumer_display_name,
          COALESCE(
            NULLIF(TRIM(COALESCE(p.business_name, '')), ''),
            TRIM(CONCAT(COALESCE(u2.first_name, ''), ' ', COALESCE(u2.last_name, '')))
          ) AS provider_display_name
        FROM instant_invoice i2
        LEFT JOIN service_listings s ON s.id = i2.listing_id
        LEFT JOIN users u ON u.id = i2.consumer_id
        LEFT JOIN providers p ON p.id = i2.provider_id
        LEFT JOIN users u2 ON u2.id = p.user_id
        WHERE i2.listing_name IS NULL OR i2.consumer_name IS NULL OR i2.provider_name IS NULL
      ) sub
      WHERE i.id = sub.id
    `);

    const rowCount = (updateResult as { rowCount?: number })?.rowCount ?? 0;
    console.log(`✅ 업데이트 완료. (영향받은 행: ${rowCount})\n`);

    // 여전히 NULL인 컬럼이 있는 행이 있는지 확인 (삭제된 listing/user/provider 등)
    const stillNull = await queryRunner.query(`
      SELECT id, listing_id, consumer_id, provider_id,
             listing_name, consumer_name, provider_name
      FROM instant_invoice
      WHERE listing_name IS NULL OR consumer_name IS NULL OR provider_name IS NULL
      LIMIT 10
    `);
    if (stillNull.length > 0) {
      console.log('⚠️  일부 행은 참조(listing/user/provider)가 없어 이름을 채우지 못했습니다. (최대 10건 샘플):');
      stillNull.forEach((r: any) => {
        console.log(`   id=${r.id} listing_name=${r.listing_name ?? 'NULL'} consumer_name=${r.consumer_name ?? 'NULL'} provider_name=${r.provider_name ?? 'NULL'}`);
      });
    }
  } catch (e) {
    console.error('❌ 오류:', e);
    throw e;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

backfill();
