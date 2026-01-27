import { DataSource } from 'typeorm';
import { Provider } from '../src/modules/users/entities/provider.entity';
import { User } from '../src/modules/users/entities/user.entity';
import { UserProfile } from '../src/modules/users/entities/user-profile.entity';
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
  entities: [Provider, User, UserProfile],
});

async function findUserByProviderId(providerId: string) {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await dataSource.initialize();
    console.log('✅ 데이터베이스 연결 성공\n');

    // provider_id로 user 정보 조회
    const result = await queryRunner.query(`
      SELECT 
        p.id as provider_id,
        p.user_id as provider_user_id,
        p.business_name,
        p.business_type,
        p.years_of_experience,
        p.is_active as provider_is_active,
        p.is_available as provider_is_available,
        p.total_jobs_completed,
        p.completion_rate,
        p.created_at as provider_created_at,
        u.id as user_id,
        u.email,
        u.phone,
        u.first_name,
        u.last_name,
        u.user_type,
        u.profile_photo_url,
        u.status as user_status,
        u.is_email_verified,
        u.is_phone_verified,
        u.kyc_level,
        u.created_at as user_created_at,
        up.id as profile_id,
        up.bio,
        up.city,
        up.province,
        up.country,
        up.latitude,
        up.longitude
      FROM providers p
      INNER JOIN users u ON p.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE p.id = $1
    `, [providerId]);

    if (result.length === 0) {
      console.log(`❌ provider_id "${providerId}"에 해당하는 provider를 찾을 수 없습니다.\n`);
      await queryRunner.release();
      await dataSource.destroy();
      return;
    }

    const data = result[0];

    console.log('='.repeat(100));
    console.log('🔍 Provider ID로 User 정보 조회');
    console.log('='.repeat(100));
    console.log(`\n📋 Provider ID: ${data.provider_id}`);
    console.log(`   Provider User ID: ${data.provider_user_id}`);
    
    console.log(`\n👤 User 정보:`);
    console.log(`   User ID: ${data.user_id}`);
    console.log(`   이름: ${data.first_name} ${data.last_name}`);
    console.log(`   이메일: ${data.email}`);
    console.log(`   전화번호: ${data.phone || 'N/A'}`);
    console.log(`   User Type: ${data.user_type}`);
    console.log(`   상태: ${data.user_status}`);
    console.log(`   이메일 인증: ${data.is_email_verified ? '✅' : '❌'}`);
    console.log(`   전화번호 인증: ${data.is_phone_verified ? '✅' : '❌'}`);
    console.log(`   KYC Level: ${data.kyc_level || 'N/A'}`);
    console.log(`   가입일: ${data.user_created_at || 'N/A'}`);

    console.log(`\n🏢 Provider 정보:`);
    console.log(`   사업자명: ${data.business_name || 'N/A'}`);
    console.log(`   사업자 유형: ${data.business_type || 'N/A'}`);
    console.log(`   경력: ${data.years_of_experience || 0}년`);
    console.log(`   활성화: ${data.provider_is_active ? '✅' : '❌'}`);
    console.log(`   가용 여부: ${data.provider_is_available ? '✅' : '❌'}`);
    console.log(`   완료 작업 수: ${data.total_jobs_completed || 0}건`);
    console.log(`   완료율: ${data.completion_rate || 0}%`);
    console.log(`   생성일: ${data.provider_created_at || 'N/A'}`);

    if (data.profile_id) {
      console.log(`\n📝 User Profile 정보:`);
      console.log(`   Bio: ${data.bio ? (data.bio.substring(0, 100) + (data.bio.length > 100 ? '...' : '')) : 'N/A'}`);
      console.log(`   도시: ${data.city || 'N/A'}`);
      console.log(`   지역: ${data.province || 'N/A'}`);
      console.log(`   국가: ${data.country || 'N/A'}`);
      if (data.latitude && data.longitude) {
        console.log(`   위치: ${data.latitude}, ${data.longitude}`);
      }
    } else {
      console.log(`\n⚠️  User Profile이 없습니다.`);
    }

    // 해당 provider의 auction_bids 조회
    const bids = await queryRunner.query(`
      SELECT 
        id,
        auction_id,
        proposed_price,
        status,
        created_at
      FROM auction_bids
      WHERE provider_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `, [providerId]);

    if (bids.length > 0) {
      console.log(`\n💰 Auction Bids (최근 ${bids.length}개):`);
      bids.forEach((bid: any, index: number) => {
        console.log(`   ${index + 1}. Bid ID: ${bid.id}`);
        console.log(`      Auction ID: ${bid.auction_id}`);
        console.log(`      제안 가격: ${bid.proposed_price || 'N/A'}`);
        console.log(`      상태: ${bid.status || 'N/A'}`);
        console.log(`      생성일: ${bid.created_at || 'N/A'}`);
        console.log('');
      });
    }

    console.log('='.repeat(100));
    console.log('\n✅ 조회 완료!\n');

    await queryRunner.release();
    await dataSource.destroy();
  } catch (error) {
    console.error('❌ 오류:', error);
    await queryRunner.release();
    await dataSource.destroy();
    process.exit(1);
  }
}

// 명령줄 인자로 provider_id 받기
const providerId = process.argv[2];

if (!providerId) {
  console.error('❌ 사용법: npm run find:user-by-provider-id <provider_id>');
  console.error('예시: npm run find:user-by-provider-id 0cc2dcca-5cb0-49e2-959c-ce69063645db');
  process.exit(1);
}

findUserByProviderId(providerId);

