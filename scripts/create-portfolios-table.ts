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

async function createPortfoliosTable() {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await dataSource.initialize();
    console.log('✅ 데이터베이스 연결 성공\n');

    // portfolios 테이블 생성
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS portfolios (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        caption TEXT,
        description TEXT,
        display_order INTEGER,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ portfolios 테이블 생성 완료');

    // 인덱스 생성
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_portfolios_provider_id ON portfolios(provider_id);
      CREATE INDEX IF NOT EXISTS idx_portfolios_is_active ON portfolios(is_active);
      CREATE INDEX IF NOT EXISTS idx_portfolios_display_order ON portfolios(display_order);
    `);

    console.log('✅ 인덱스 생성 완료');

    // 기존 providers 테이블의 portfolio_photos 데이터를 portfolios 테이블로 마이그레이션
    console.log('\n📦 기존 portfolio_photos 데이터 마이그레이션 중...');
    
    const providersWithPortfolio = await queryRunner.query(`
      SELECT id, portfolio_photos
      FROM providers
      WHERE portfolio_photos IS NOT NULL
        AND portfolio_photos != 'null'::jsonb
        AND jsonb_array_length(portfolio_photos) > 0;
    `);

    let migratedCount = 0;
    for (const provider of providersWithPortfolio) {
      try {
        const portfolioPhotos = typeof provider.portfolio_photos === 'string' 
          ? JSON.parse(provider.portfolio_photos)
          : provider.portfolio_photos;

        if (Array.isArray(portfolioPhotos)) {
          for (let i = 0; i < portfolioPhotos.length; i++) {
            const photo = portfolioPhotos[i];
            if (photo && photo.url) {
              await queryRunner.query(`
                INSERT INTO portfolios (provider_id, image_url, caption, display_order, is_active, created_at)
                VALUES ($1, $2, $3, $4, TRUE, COALESCE($5::timestamp, CURRENT_TIMESTAMP))
                ON CONFLICT DO NOTHING;
              `, [
                provider.id,
                photo.url,
                photo.caption || null,
                i + 1,
                photo.uploadedAt || null
              ]);
              migratedCount++;
            }
          }
        }
      } catch (error) {
        console.error(`⚠️  Provider ${provider.id} 마이그레이션 실패:`, error);
      }
    }

    console.log(`✅ ${migratedCount}개의 포트폴리오 항목 마이그레이션 완료`);

    await queryRunner.release();
    await dataSource.destroy();
    console.log('\n✅ 완료!');
  } catch (error) {
    console.error('❌ 오류:', error);
    await queryRunner.release();
    await dataSource.destroy();
    process.exit(1);
  }
}

createPortfoliosTable();
