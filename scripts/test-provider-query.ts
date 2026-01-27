import { DataSource } from 'typeorm';
import { Provider } from '../src/modules/users/entities/provider.entity';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'trusttrade',
  password: process.env.DB_PASSWORD || 'secure_password_123',
  database: process.env.DB_DATABASE || 'ai_trusttrade',
  entities: [Provider],
});

async function testProviderQuery() {
  const queryRunner = dataSource.createQueryRunner();
  const providerId = '0cc2dcca-5cb0-49e2-959c-ce69063645db';
  
  try {
    await dataSource.initialize();
    console.log('✅ 데이터베이스 연결 성공\n');

    // 방법 1: providers.id로 검색
    console.log(`🔍 방법 1: providers.id = '${providerId}'로 검색`);
    const result1 = await queryRunner.query(`
      SELECT 
        p.id,
        p.user_id,
        p.business_name,
        p.is_active
      FROM providers p
      WHERE p.id = $1
    `, [providerId]);

    console.log('결과:', result1.length > 0 ? '✅ 찾음' : '❌ 없음');
    if (result1.length > 0) {
      console.log('데이터:', JSON.stringify(result1[0], null, 2));
    }

    // 방법 2: providers.user_id로 검색
    console.log(`\n🔍 방법 2: providers.user_id = '${providerId}'로 검색`);
    const result2 = await queryRunner.query(`
      SELECT 
        p.id,
        p.user_id,
        p.business_name,
        p.is_active
      FROM providers p
      WHERE p.user_id = $1
    `, [providerId]);

    console.log('결과:', result2.length > 0 ? '✅ 찾음' : '❌ 없음');
    if (result2.length > 0) {
      console.log('데이터:', JSON.stringify(result2[0], null, 2));
    }

    // 전체 providers 목록 확인
    console.log(`\n📋 전체 providers 목록 (최근 5개):`);
    const allProviders = await queryRunner.query(`
      SELECT 
        p.id,
        p.user_id,
        p.business_name,
        p.is_active
      FROM providers p
      ORDER BY p.created_at DESC
      LIMIT 5
    `);
    allProviders.forEach((p: any, idx: number) => {
      console.log(`${idx + 1}. id: ${p.id}, user_id: ${p.user_id}, business_name: ${p.business_name || 'N/A'}, is_active: ${p.is_active}`);
    });

    await queryRunner.release();
    await dataSource.destroy();
  } catch (error) {
    console.error('❌ 오류:', error);
    await queryRunner.release();
    await dataSource.destroy();
    process.exit(1);
  }
}

testProviderQuery();

