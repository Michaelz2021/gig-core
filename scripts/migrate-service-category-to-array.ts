/**
 * users.service_category_id (단일) → service_category_ids (JSONB 배열) 마이그레이션
 * 트랜스크립트(589be382) 복구용. 이미 컬럼이 있으면 스킵.
 */
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

async function migrateServiceCategoryToArray() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || process.env.DB_NAME || 'ai_trusttrade',
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('✅ 데이터베이스 연결 성공\n');

    const oldColumnExists = await dataSource.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'service_category_id'
    `);
    const newColumnExists = await dataSource.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'service_category_ids'
    `);

    if (newColumnExists?.length === 0) {
      await dataSource.query(`
        ALTER TABLE users ADD COLUMN service_category_ids JSONB DEFAULT '[]'::jsonb
      `);
      console.log('✅ service_category_ids 컬럼 추가 완료\n');
    } else {
      console.log('⚠️  service_category_ids 컬럼이 이미 존재합니다.\n');
    }

    if (oldColumnExists?.length > 0) {
      await dataSource.query(`
        UPDATE users SET service_category_ids = CASE
          WHEN service_category_id IS NOT NULL THEN jsonb_build_array(service_category_id::text)
          ELSE '[]'::jsonb
        END
        WHERE service_category_id IS NOT NULL AND (service_category_ids IS NULL OR service_category_ids = '[]'::jsonb)
      `);

      await dataSource.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_service_category`);
      await dataSource.query(`DROP INDEX IF EXISTS idx_users_service_category_id`);
      await dataSource.query(`ALTER TABLE users DROP COLUMN IF EXISTS service_category_id`);
      console.log('✅ 기존 service_category_id 제거 및 데이터 마이그레이션 완료\n');
    }

    const ginExists = await dataSource.query(`
      SELECT indexname FROM pg_indexes WHERE tablename = 'users' AND indexname = 'idx_users_service_category_ids_gin'
    `);
    if (ginExists?.length === 0) {
      await dataSource.query(`CREATE INDEX idx_users_service_category_ids_gin ON users USING GIN (service_category_ids)`);
      console.log('✅ GIN 인덱스 추가 완료\n');
    }

    console.log('✅ 마이그레이션 완료');
  } catch (error) {
    console.error('❌ 오류:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

migrateServiceCategoryToArray()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
