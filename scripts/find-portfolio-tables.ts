import { DataSource } from 'typeorm';
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
  entities: [],
});

async function findPortfolioTables() {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await dataSource.initialize();
    console.log('✅ 데이터베이스 연결 성공\n');

    // 모든 테이블 목록 가져오기
    const allTables = await queryRunner.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('📋 모든 테이블 목록:');
    console.table(allTables);

    // provider_id를 외래키로 가진 테이블 찾기
    console.log('\n🔍 provider_id를 외래키로 가진 테이블:');
    const tablesWithProviderId = await queryRunner.query(`
      SELECT 
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND (kcu.column_name LIKE '%provider%' OR ccu.table_name = 'providers')
      ORDER BY tc.table_name;
    `);

    if (tablesWithProviderId.length > 0) {
      console.table(tablesWithProviderId);
    } else {
      console.log('provider_id를 외래키로 가진 테이블을 찾을 수 없습니다.');
    }

    // 이미지나 파일 관련 컬럼이 있는 테이블 찾기
    console.log('\n🔍 이미지/파일 관련 컬럼이 있는 테이블:');
    const imageTables = await queryRunner.query(`
      SELECT 
        table_name,
        column_name,
        data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND (
          column_name LIKE '%image%' 
          OR column_name LIKE '%photo%'
          OR column_name LIKE '%file%'
          OR column_name LIKE '%url%'
          OR column_name LIKE '%portfolio%'
        )
      ORDER BY table_name, column_name;
    `);

    if (imageTables.length > 0) {
      console.table(imageTables);
    } else {
      console.log('이미지/파일 관련 컬럼을 찾을 수 없습니다.');
    }

    await queryRunner.release();
    await dataSource.destroy();
  } catch (error) {
    console.error('❌ 오류:', error);
    await queryRunner.release();
    await dataSource.destroy();
    process.exit(1);
  }
}

findPortfolioTables();
