import { DataSource } from 'typeorm';
import { Provider } from '../src/modules/users/entities/provider.entity';
import { User } from '../src/modules/users/entities/user.entity';
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
  entities: [Provider, User],
});

async function showProviders() {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await dataSource.initialize();
    console.log('✅ 데이터베이스 연결 성공\n');

    // Providers 테이블의 모든 데이터 조회 (User 정보와 조인)
    const providers = await queryRunner.query(`
      SELECT 
        p.id,
        p.user_id as "userId",
        p.business_name as "businessName",
        p.business_type as "businessType",
        p.government_id_type as "governmentIdType",
        p.government_id_number as "governmentIdNumber",
        p.tin_number as "tinNumber",
        p.years_of_experience as "yearsOfExperience",
        p.certifications,
        p.portfolio_photos as "portfolioPhotos",
        p.instant_booking_enabled as "instantBookingEnabled",
        p.service_radius_km as "serviceRadiusKm",
        p.response_time_minutes as "responseTimeMinutes",
        p.completion_rate as "completionRate",
        p.total_jobs_completed as "totalJobsCompleted",
        p.is_active as "isActive",
        p.is_featured as "isFeatured",
        p.created_at as "createdAt",
        p.updated_at as "updatedAt",
        u.id as "user_id",
        u.email as "user_email",
        u.first_name as "user_firstName",
        u.last_name as "user_lastName",
        u.phone as "user_phone",
        u.status as "user_status"
      FROM providers p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `);

    if (!providers || providers.length === 0) {
      console.log('⚠️  Providers 테이블에 데이터가 없습니다.\n');
      await queryRunner.release();
      await dataSource.destroy();
      return;
    }

    console.log(`📊 총 ${providers.length}개의 Provider 레코드를 찾았습니다.\n`);
    console.log('='.repeat(100));
    
    providers.forEach((provider: any, index: number) => {
      console.log(`\n[${index + 1}] Provider ID: ${provider.id}`);
      console.log('-'.repeat(100));
      console.log('👤 사용자 정보:');
      console.log(`   User ID: ${provider.user_id || 'N/A'}`);
      console.log(`   Email: ${provider.user_email || 'N/A'}`);
      console.log(`   이름: ${provider.user_firstName || ''} ${provider.user_lastName || ''}`.trim() || 'N/A');
      console.log(`   전화번호: ${provider.user_phone || 'N/A'}`);
      console.log(`   상태: ${provider.user_status || 'N/A'}`);
      console.log('\n🏢 사업자 정보:');
      console.log(`   사업자명: ${provider.businessName || 'N/A'}`);
      console.log(`   사업자 유형: ${provider.businessType || 'N/A'}`);
      console.log(`   경력: ${provider.yearsOfExperience || 0}년`);
      console.log('\n📋 인증 정보:');
      console.log(`   신분증 유형: ${provider.governmentIdType || 'N/A'}`);
      console.log(`   신분증 번호: ${provider.governmentIdNumber ? '***' : 'N/A'}`);
      console.log(`   TIN 번호: ${provider.tinNumber ? '***' : 'N/A'}`);
      console.log('\n📜 자격증:');
      if (provider.certifications) {
        const certs = typeof provider.certifications === 'string' 
          ? JSON.parse(provider.certifications)
          : provider.certifications;
        if (Array.isArray(certs) && certs.length > 0) {
          certs.forEach((cert: any, idx: number) => {
            console.log(`   ${idx + 1}. ${cert.name || 'N/A'} (발급기관: ${cert.issuer || 'N/A'})`);
          });
        } else {
          console.log('   없음');
        }
      } else {
        console.log('   없음');
      }
      console.log('\n📸 포트폴리오 사진:');
      if (provider.portfolioPhotos) {
        const photos = typeof provider.portfolioPhotos === 'string' 
          ? JSON.parse(provider.portfolioPhotos)
          : provider.portfolioPhotos;
        if (Array.isArray(photos) && photos.length > 0) {
          console.log(`   총 ${photos.length}장`);
          photos.forEach((photo: any, idx: number) => {
            console.log(`   ${idx + 1}. ${photo.url || 'N/A'} - ${photo.caption || '설명 없음'}`);
          });
        } else {
          console.log('   없음');
        }
      } else {
        console.log('   없음');
      }
      console.log('\n⚙️  서비스 설정:');
      console.log(`   즉시 예약 가능: ${provider.instantBookingEnabled ? '예' : '아니오'}`);
      console.log(`   서비스 반경: ${provider.serviceRadiusKm || 0}km`);
      console.log(`   평균 응답 시간: ${provider.responseTimeMinutes || 'N/A'}분`);
      console.log(`   완료율: ${provider.completionRate || 0}%`);
      console.log(`   완료 작업 수: ${provider.totalJobsCompleted || 0}건`);
      console.log('\n📊 상태:');
      console.log(`   활성화: ${provider.isActive ? '예' : '아니오'}`);
      console.log(`   추천 제공자: ${provider.isFeatured ? '예' : '아니오'}`);
      console.log(`   생성일: ${provider.createdAt || 'N/A'}`);
      console.log(`   수정일: ${provider.updatedAt || 'N/A'}`);
      console.log('='.repeat(100));
    });

    // 요약 정보
    console.log('\n📈 요약 정보:');
    const activeCount = providers.filter((p: any) => p.isActive).length;
    const featuredCount = providers.filter((p: any) => p.isFeatured).length;
    const totalJobs = providers.reduce((sum: number, p: any) => sum + (p.totalJobsCompleted || 0), 0);
    const avgCompletionRate = providers.reduce((sum: number, p: any) => sum + (p.completionRate || 0), 0) / providers.length;
    
    console.log(`   총 Provider 수: ${providers.length}`);
    console.log(`   활성화된 Provider: ${activeCount}`);
    console.log(`   추천 Provider: ${featuredCount}`);
    console.log(`   총 완료 작업 수: ${totalJobs}건`);
    console.log(`   평균 완료율: ${avgCompletionRate.toFixed(2)}%\n`);

    await queryRunner.release();
    await dataSource.destroy();
  } catch (error) {
    console.error('❌ 오류:', error);
    await queryRunner.release();
    await dataSource.destroy();
    process.exit(1);
  }
}

showProviders();

