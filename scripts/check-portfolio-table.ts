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

async function checkPortfolioTable() {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await dataSource.initialize();
    console.log('✅ 데이터베이스 연결 성공\n');

    // Portfolio 테이블이 있는지 확인
    const tableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'portfolios'
      );
    `);

    console.log('📋 Portfolio 테이블 존재 여부:', tableExists[0].exists);

    if (tableExists[0].exists) {
      // 테이블 스키마 확인
      console.log('\n📊 Portfolio 테이블 스키마:');
      const tableInfo = await queryRunner.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = 'portfolios'
        ORDER BY ordinal_position;
      `);
      
      console.table(tableInfo);

      // 샘플 데이터 확인
      const sampleData = await queryRunner.query(`
        SELECT * FROM portfolios LIMIT 5;
      `);
      
      if (sampleData.length > 0) {
        console.log('\n📸 샘플 데이터:');
        console.log(JSON.stringify(sampleData, null, 2));
      } else {
        console.log('\n⚠️  포트폴리오 데이터가 없습니다.');
      }
    } else {
      // portfolios와 유사한 이름의 테이블 찾기
      console.log('\n🔍 유사한 테이블명 검색:');
      const similarTables = await queryRunner.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name LIKE '%portfolio%'
        ORDER BY table_name;
      `);
      
      if (similarTables.length > 0) {
        console.table(similarTables);
      } else {
        console.log('Portfolio 관련 테이블을 찾을 수 없습니다.');
      }
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

checkPortfolioTable();
