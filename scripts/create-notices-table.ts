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
  synchronize: false,
  logging: true,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false,
  } : false,
});

async function createNoticesTable() {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await dataSource.initialize();
    console.log('✅ 데이터베이스 연결 성공\n');

    // NoticeType ENUM 생성 (이미 존재하면 무시)
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "notice_type_enum" AS ENUM('notice', 'news');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    console.log('✅ notice_type_enum 타입 확인 완료');

    // notices 테이블 생성
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type notice_type_enum NOT NULL,
        title VARCHAR NOT NULL,
        content TEXT NOT NULL,
        summary TEXT,
        images JSONB,
        "isActive" BOOLEAN DEFAULT true,
        "viewCount" INTEGER DEFAULT 0,
        "createdBy" UUID,
        "publishedAt" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ notices 테이블 생성 완료');

    // 인덱스 생성
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_notices_type_isActive_createdAt" 
      ON notices(type, "isActive", "created_at");
      
      CREATE INDEX IF NOT EXISTS "idx_notices_type" ON notices(type);
      CREATE INDEX IF NOT EXISTS "idx_notices_isActive" ON notices("isActive");
      CREATE INDEX IF NOT EXISTS "idx_notices_createdAt" ON notices("created_at");
    `);

    console.log('✅ 인덱스 생성 완료\n');
    console.log('✅ 모든 작업이 완료되었습니다!');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
    console.log('데이터베이스 연결 종료');
  }
}

createNoticesTable()
  .then(() => {
    console.log('테이블 생성 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('테이블 생성 실패:', error);
    process.exit(1);
  });
