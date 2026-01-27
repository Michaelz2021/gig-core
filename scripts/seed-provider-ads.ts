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

async function seedProviderAds() {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await dataSource.initialize();
    console.log('✅ 데이터베이스 연결 성공\n');

    // Provider ID들 조회
    const providers = await queryRunner.query(`
      SELECT id, user_id, business_name 
      FROM providers 
      WHERE is_active = true 
      LIMIT 10;
    `);

    if (providers.length === 0) {
      console.log('❌ 활성화된 Provider가 없습니다.');
      return;
    }

    console.log(`📋 발견된 Provider 수: ${providers.length}\n`);

    // provider_ads 테이블 존재 확인 및 생성
    const tableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'provider_ads'
      );
    `);

    if (!tableExists[0].exists) {
      console.log('📋 provider_ads 테이블 생성 중...');
      await queryRunner.query(`
        CREATE TABLE provider_ads (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
          background_image_url TEXT,
          provider_name VARCHAR(255) NOT NULL,
          service_area VARCHAR(255),
          service_categories TEXT[] DEFAULT '{}',
          promo_message TEXT,
          promo_title VARCHAR(255),
          has_discount BOOLEAN DEFAULT FALSE,
          discount_percentage DECIMAL(5,2),
          discount_amount DECIMAL(10,2),
          discount_description VARCHAR(255),
          discount_start_date TIMESTAMP,
          discount_end_date TIMESTAMP,
          start_date TIMESTAMP,
          end_date TIMESTAMP,
          action_url TEXT,
          action_text VARCHAR(50) DEFAULT 'Learn More',
          priority INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX idx_provider_ads_provider_id ON provider_ads(provider_id);
        CREATE INDEX idx_provider_ads_is_active ON provider_ads(is_active);
        CREATE INDEX idx_provider_ads_dates ON provider_ads(start_date, end_date);
      `);
      console.log('✅ provider_ads 테이블 생성 완료\n');
    }

    // 샘플 ProviderAd 데이터
    const sampleAds = [
      {
        provider_id: providers[0].id,
        provider_name: providers[0].business_name || 'Professional Services Co.',
        background_image_url: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=400&fit=crop',
        service_area: 'Home Services',
        service_categories: ['Moving', 'Cleaning', 'Repair'],
        promo_title: 'Special Offer 1',
        promo_message: 'Professional moving services with care and attention to detail',
        has_discount: true,
        discount_percentage: 20.00,
        discount_description: 'Get up to 20% off',
        discount_start_date: new Date(),
        discount_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일 후
        action_text: 'Learn More',
        action_url: `/providers/${providers[0].id}`,
        priority: 5,
        is_active: true,
      },
      {
        provider_id: providers[1]?.id || providers[0].id,
        provider_name: providers[1]?.business_name || 'Home Solutions Inc.',
        background_image_url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=400&fit=crop',
        service_area: 'Personal Care',
        service_categories: ['Personal', 'Beauty', 'Wellness'],
        promo_title: 'Special Offer 2',
        promo_message: 'Premium personal care services at your doorstep',
        has_discount: true,
        discount_percentage: 15.00,
        discount_description: 'Get up to 15% off',
        discount_start_date: new Date(),
        discount_end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60일 후
        action_text: 'Book Now',
        action_url: `/providers/${providers[1]?.id || providers[0].id}`,
        priority: 4,
        is_active: true,
      },
      {
        provider_id: providers[2]?.id || providers[0].id,
        provider_name: providers[2]?.business_name || 'Event Masters',
        background_image_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=400&fit=crop',
        service_area: 'Event Services',
        service_categories: ['Wedding', 'Corporate', 'Party'],
        promo_title: 'Event Planning Special',
        promo_message: 'Make your events unforgettable with our professional team',
        has_discount: true,
        discount_percentage: 25.00,
        discount_description: 'Get up to 25% off',
        discount_start_date: new Date(),
        discount_end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90일 후
        action_text: 'Learn More',
        action_url: `/providers/${providers[2]?.id || providers[0].id}`,
        priority: 3,
        is_active: true,
      },
      {
        provider_id: providers[3]?.id || providers[0].id,
        provider_name: providers[3]?.business_name || 'Digital Experts',
        background_image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop',
        service_area: 'Digital Services',
        service_categories: ['Web Design', 'IT Support', 'Marketing'],
        promo_title: 'Digital Solutions',
        promo_message: 'Transform your business with our digital expertise',
        has_discount: false,
        action_text: 'Contact Us',
        action_url: `/providers/${providers[3]?.id || providers[0].id}`,
        priority: 2,
        is_active: true,
      },
      {
        provider_id: providers[4]?.id || providers[0].id,
        provider_name: providers[4]?.business_name || 'Complete Home Services',
        background_image_url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=400&fit=crop',
        service_area: 'Home Services',
        service_categories: ['Plumbing', 'Electrical', 'Carpentry'],
        promo_title: 'Home Maintenance Package',
        promo_message: 'Keep your home in perfect condition with our maintenance services',
        has_discount: true,
        discount_percentage: 10.00,
        discount_amount: 500.00,
        discount_description: 'Get 10% off or ₱500 discount',
        discount_start_date: new Date(),
        discount_end_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45일 후
        action_text: 'Learn More',
        action_url: `/providers/${providers[4]?.id || providers[0].id}`,
        priority: 1,
        is_active: true,
      },
    ];

    // 기존 샘플 데이터 삭제 (선택사항)
    try {
      console.log('🗑️  기존 샘플 데이터 삭제 중...');
      await queryRunner.query(`DELETE FROM provider_ads WHERE provider_name LIKE 'Professional Services%' OR provider_name LIKE 'Home Solutions%' OR provider_name LIKE 'Event Masters%' OR provider_name LIKE 'Digital Experts%' OR provider_name LIKE 'Complete Home%';`);
      console.log('✅ 기존 샘플 데이터 삭제 완료\n');
    } catch (error) {
      console.log('ℹ️  기존 데이터 없음 (건너뜀)\n');
    }

    // 샘플 데이터 삽입
    console.log('📝 샘플 ProviderAd 데이터 삽입 중...\n');

    for (let i = 0; i < sampleAds.length; i++) {
      const ad = sampleAds[i];
      
      await queryRunner.query(`
        INSERT INTO provider_ads (
          provider_id,
          provider_name,
          background_image_url,
          service_area,
          service_categories,
          promo_title,
          promo_message,
          has_discount,
          discount_percentage,
          discount_amount,
          discount_description,
          discount_start_date,
          discount_end_date,
          start_date,
          end_date,
          action_url,
          action_text,
          priority,
          is_active,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW()
        )
      `, [
        ad.provider_id,
        ad.provider_name,
        ad.background_image_url,
        ad.service_area,
        ad.service_categories,
        ad.promo_title,
        ad.promo_message,
        ad.has_discount,
        ad.discount_percentage || null,
        ad.discount_amount || null,
        ad.discount_description || null,
        ad.discount_start_date || null,
        ad.discount_end_date || null,
        null, // start_date
        null, // end_date
        ad.action_url,
        ad.action_text,
        ad.priority,
        ad.is_active,
      ]);

      console.log(`✅ 샘플 ${i + 1} 삽입 완료: ${ad.promo_title} - ${ad.provider_name}`);
    }

    console.log(`\n✅ 총 ${sampleAds.length}개의 샘플 ProviderAd 데이터 삽입 완료!`);

    // 삽입된 데이터 확인
    const insertedAds = await queryRunner.query(`
      SELECT id, provider_name, promo_title, is_active, priority 
      FROM provider_ads 
      ORDER BY priority DESC, created_at DESC 
      LIMIT 10;
    `);

    console.log('\n📋 삽입된 데이터 확인:');
    insertedAds.forEach((ad: any, index: number) => {
      console.log(`  ${index + 1}. [Priority: ${ad.priority}] ${ad.promo_title} - ${ad.provider_name}`);
    });

  } catch (error) {
    console.error('❌ 에러 발생:', error);
    throw error;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

// 스크립트 실행
seedProviderAds()
  .then(() => {
    console.log('\n✅ 샘플 데이터 삽입 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 샘플 데이터 삽입 실패:', error);
    process.exit(1);
  });

