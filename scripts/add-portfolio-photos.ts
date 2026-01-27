import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 환경 변수 로드
dotenv.config();

// 샘플 이미지 URL들
const sampleImages = [
  'https://thumbs.dreamstime.com/b/portrait-man-cleaning-equipment-cleaning-house-30014330.jpg',
  'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400',
  'https://images.unsplash.com/photo-1556912172-45b7abe8b7e4?w=400',
  'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400',
  'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400',
  'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400',
  'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
];

const sampleCaptions = [
  'Professional cleaning service',
  'Home maintenance portfolio',
  'Quality service showcase',
  'Expert work demonstration',
  'Customer satisfaction project',
  'Before and after results',
  'Professional service delivery',
  'Quality craftsmanship',
];

async function addPortfolioPhotos() {
  // 데이터베이스 연결 설정 (entities 없이 raw query만 사용)
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || 'gig_core',
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connected successfully');

    // 모든 providers 조회
    const providers = await dataSource.query(`
      SELECT id, user_id, portfolio_photos
      FROM providers
    `);

    console.log(`📊 Found ${providers.length} providers\n`);

    // 각 provider에 대해 랜덤하게 1~4개의 포트폴리오 사진 추가
    for (const provider of providers) {
      // 랜덤하게 1~4개 선택
      const count = Math.floor(Math.random() * 4) + 1;
      
      // 기존 portfolio_photos 가져오기
      let existingPhotos: any[] = [];
      if (provider.portfolio_photos) {
        try {
          if (Array.isArray(provider.portfolio_photos)) {
            existingPhotos = provider.portfolio_photos;
          } else if (typeof provider.portfolio_photos === 'string') {
            existingPhotos = JSON.parse(provider.portfolio_photos);
          } else if (typeof provider.portfolio_photos === 'object') {
            // 단일 객체인 경우 배열로 변환
            existingPhotos = [provider.portfolio_photos];
          }
        } catch (e) {
          console.error(`⚠️  Error parsing existing photos for provider ${provider.id}:`, e);
          existingPhotos = [];
        }
      }

      // 새로운 포트폴리오 사진 생성
      const newPhotos = [];
      for (let i = 0; i < count; i++) {
        const randomImageIndex = Math.floor(Math.random() * sampleImages.length);
        const randomCaptionIndex = Math.floor(Math.random() * sampleCaptions.length);
        
        // 시간을 조금씩 다르게 설정
        const uploadDate = new Date();
        uploadDate.setMinutes(uploadDate.getMinutes() - (count - i) * 10);
        
        newPhotos.push({
          url: sampleImages[randomImageIndex],
          caption: `${sampleCaptions[randomCaptionIndex]} ${i + 1}`,
          uploadedAt: uploadDate.toISOString(),
        });
      }

      // 기존 사진과 새 사진 합치기
      const allPhotos = [...existingPhotos, ...newPhotos];

      // 데이터베이스 업데이트
      await dataSource.query(
        `UPDATE providers 
         SET portfolio_photos = $1::jsonb, updated_at = NOW()
         WHERE id = $2`,
        [JSON.stringify(allPhotos), provider.id]
      );

      console.log(`✅ Provider ${provider.id}: Added ${count} photos (Total: ${allPhotos.length})`);
    }

    console.log('\n🎉 All providers updated successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await dataSource.destroy();
    console.log('🔌 Database connection closed');
  }
}

// 스크립트 실행
addPortfolioPhotos()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
