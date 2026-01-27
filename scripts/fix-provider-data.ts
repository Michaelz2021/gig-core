import { DataSource } from 'typeorm';
import { User, UserType } from '../src/modules/users/entities/user.entity';
import { UserProfile } from '../src/modules/users/entities/user-profile.entity';
import { Provider, BusinessType } from '../src/modules/users/entities/provider.entity';
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
  entities: [User, UserProfile, Provider],
});

// 필리핀 도시 및 주소 샘플 데이터
const philippineCities = [
  { city: 'Manila', province: 'Metro Manila', postalCode: '1000', lat: 14.5995, lng: 120.9842 },
  { city: 'Quezon City', province: 'Metro Manila', postalCode: '1100', lat: 14.6760, lng: 121.0437 },
  { city: 'Makati', province: 'Metro Manila', postalCode: '1200', lat: 14.5547, lng: 121.0244 },
  { city: 'Cebu City', province: 'Cebu', postalCode: '6000', lat: 10.3157, lng: 123.8854 },
  { city: 'Davao City', province: 'Davao del Sur', postalCode: '8000', lat: 7.1907, lng: 125.4553 },
  { city: 'Iloilo City', province: 'Iloilo', postalCode: '5000', lat: 10.7202, lng: 122.5621 },
  { city: 'Baguio', province: 'Benguet', postalCode: '2600', lat: 16.4023, lng: 120.5960 },
  { city: 'Bacolod', province: 'Negros Occidental', postalCode: '6100', lat: 10.6769, lng: 122.9503 },
];

// 샘플 bio 텍스트
const sampleBios = [
  '저는 5년 이상의 경험을 가진 전문 서비스 제공자입니다. 고객 만족을 최우선으로 하며, 신뢰할 수 있는 서비스를 제공합니다. 다양한 프로젝트를 성공적으로 완료했으며, 항상 최선을 다해 일합니다.',
  '전문적이고 신뢰할 수 있는 서비스 제공자로서, 고객의 요구사항을 정확히 이해하고 최고의 결과를 제공합니다. 풍부한 경험과 전문 지식을 바탕으로 고품질 서비스를 보장합니다.',
  '고객 중심의 서비스 제공자로, 세심한 주의와 전문성을 바탕으로 모든 프로젝트를 완벽하게 완료합니다. 시간 약속을 지키고, 투명한 커뮤니케이션을 통해 고객과의 신뢰를 구축합니다.',
  '다양한 분야에서의 경험을 바탕으로, 고객의 다양한 요구사항을 충족시킬 수 있는 전문 서비스 제공자입니다. 항상 최신 기술과 방법론을 적용하여 최고의 결과를 제공합니다.',
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomPhoneNumber(): string {
  const prefixes = ['912', '915', '917', '918', '919', '920', '921', '922', '923', '925', '926', '927', '928', '929', '930', '931', '932', '933', '934', '935', '936', '937', '938', '939', '940', '941', '942', '943', '944', '945', '946', '947', '948', '949', '950', '951', '952', '953', '954', '955', '956', '957', '958', '959', '960', '961', '962', '963', '964', '965', '966', '967', '968', '969', '970', '971', '972', '973', '974', '975', '976', '977', '978', '979', '980', '981', '982', '983', '984', '985', '986', '987', '988', '989', '990', '991', '992', '993', '994', '995', '996', '997', '998', '999'];
  const prefix = getRandomElement(prefixes);
  const suffix = Math.floor(1000000 + Math.random() * 9000000).toString();
  return `+63${prefix}${suffix}`;
}

async function fixProviderData() {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await dataSource.initialize();
    console.log('✅ 데이터베이스 연결 성공\n');

    // 1. user_type이 'provider' 또는 'both'인 모든 사용자 조회
    console.log('🔍 Provider 타입 사용자 조회 중...\n');
    const providerUsers = await queryRunner.query(`
      SELECT 
        id,
        email,
        phone,
        first_name,
        last_name,
        user_type,
        created_at
      FROM users
      WHERE user_type IN ('provider', 'both')
        AND deleted_at IS NULL
      ORDER BY created_at DESC
    `);

    if (providerUsers.length === 0) {
      console.log('⚠️  Provider 타입 사용자가 없습니다.\n');
      await queryRunner.release();
      await dataSource.destroy();
      return;
    }

    console.log(`📊 총 ${providerUsers.length}명의 Provider 타입 사용자를 찾았습니다.\n`);

    let userProfilesCreated = 0;
    let userProfilesUpdated = 0;
    let providersCreated = 0;
    let providersUpdated = 0;

    // 2. 각 사용자에 대해 user_profiles와 providers 데이터 확인 및 생성
    for (const user of providerUsers) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`👤 사용자: ${user.first_name} ${user.last_name} (${user.email})`);
      console.log(`   User ID: ${user.id}`);
      console.log(`   User Type: ${user.user_type}`);

      // user_profiles 확인
      const existingProfile = await queryRunner.query(
        `SELECT id, user_id FROM user_profiles WHERE user_id = $1`,
        [user.id]
      );

      if (existingProfile.length === 0) {
        // user_profiles 생성
        const location = getRandomElement(philippineCities);
        const bio = getRandomElement(sampleBios);
        
        await queryRunner.query(
          `INSERT INTO user_profiles (
            id, user_id, bio, address_line1, city, province, postal_code, country,
            latitude, longitude, preferred_language, preferred_currency,
            notification_email, notification_sms, notification_push,
            created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW()
          )`,
          [
            user.id,
            bio,
            `${Math.floor(Math.random() * 999) + 1} Sample Street`,
            location.city,
            location.province,
            location.postalCode,
            'PH',
            location.lat,
            location.lng,
            'en',
            'PHP',
            true,
            true,
            true,
          ]
        );
        console.log(`   ✅ user_profiles 생성 완료`);
        userProfilesCreated++;
      } else {
        console.log(`   ✓ user_profiles 이미 존재함`);
        // 기존 프로필이 있지만 필수 필드가 비어있는 경우 업데이트
        const profile = existingProfile[0];
        const profileDetails = await queryRunner.query(
          `SELECT bio, city, province FROM user_profiles WHERE id = $1`,
          [profile.id]
        );
        
        if (!profileDetails[0]?.bio || !profileDetails[0]?.city) {
          const location = getRandomElement(philippineCities);
          const bio = profileDetails[0]?.bio || getRandomElement(sampleBios);
          
          await queryRunner.query(
            `UPDATE user_profiles SET
              bio = COALESCE(bio, $1),
              address_line1 = COALESCE(address_line1, $2),
              city = COALESCE(city, $3),
              province = COALESCE(province, $4),
              postal_code = COALESCE(postal_code, $5),
              latitude = COALESCE(latitude, $6),
              longitude = COALESCE(longitude, $7),
              updated_at = NOW()
            WHERE id = $8`,
            [
              bio,
              `${Math.floor(Math.random() * 999) + 1} Sample Street`,
              location.city,
              location.province,
              location.postalCode,
              location.lat,
              location.lng,
              profile.id,
            ]
          );
          console.log(`   ✅ user_profiles 업데이트 완료`);
          userProfilesUpdated++;
        }
      }

      // providers 확인
      const existingProvider = await queryRunner.query(
        `SELECT id, user_id FROM providers WHERE user_id = $1`,
        [user.id]
      );

      if (existingProvider.length === 0) {
        // providers 생성
        const yearsOfExperience = Math.floor(Math.random() * 10) + 1;
        const availableDays = [1, 2, 3, 4, 5]; // 월~금
        const startHour = `${8 + Math.floor(Math.random() * 2)}:00`;
        const endHour = `${17 + Math.floor(Math.random() * 3)}:00`;

        await queryRunner.query(
          `INSERT INTO providers (
            id, user_id, business_type, years_of_experience,
            available_days, available_hours_start, available_hours_end,
            service_radius_km, is_available, is_active,
            total_jobs_completed, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4::integer[], $5, $6, $7, $8, $9, $10, NOW(), NOW()
          )`,
          [
            user.id,
            BusinessType.INDIVIDUAL,
            yearsOfExperience,
            availableDays,
            startHour,
            endHour,
            10,
            true,
            true,
            0,
          ]
        );
        console.log(`   ✅ providers 생성 완료`);
        providersCreated++;
      } else {
        console.log(`   ✓ providers 이미 존재함`);
        // 기존 provider가 있지만 필수 필드가 비어있는 경우 업데이트
        const provider = existingProvider[0];
        const providerDetails = await queryRunner.query(
          `SELECT business_type, years_of_experience, is_active FROM providers WHERE id = $1`,
          [provider.id]
        );
        
        if (!providerDetails[0]?.business_type || providerDetails[0]?.is_active === null) {
          await queryRunner.query(
            `UPDATE providers SET
              business_type = COALESCE(business_type, $1),
              years_of_experience = COALESCE(years_of_experience, $2),
              is_active = COALESCE(is_active, $3),
              is_available = COALESCE(is_available, $4),
              updated_at = NOW()
            WHERE id = $5`,
            [
              BusinessType.INDIVIDUAL,
              Math.floor(Math.random() * 10) + 1,
              true,
              true,
              provider.id,
            ]
          );
          console.log(`   ✅ providers 업데이트 완료`);
          providersUpdated++;
        }
      }
    }

    // 요약 출력
    console.log(`\n\n${'='.repeat(60)}`);
    console.log('📊 작업 요약');
    console.log('='.repeat(60));
    console.log(`총 Provider 타입 사용자: ${providerUsers.length}명`);
    console.log(`\nuser_profiles:`);
    console.log(`  - 새로 생성: ${userProfilesCreated}개`);
    console.log(`  - 업데이트: ${userProfilesUpdated}개`);
    console.log(`\nproviders:`);
    console.log(`  - 새로 생성: ${providersCreated}개`);
    console.log(`  - 업데이트: ${providersUpdated}개`);
    console.log('='.repeat(60));
    console.log('\n✅ 모든 작업이 완료되었습니다!\n');

    await queryRunner.release();
    await dataSource.destroy();
  } catch (error) {
    console.error('❌ 오류:', error);
    await queryRunner.release();
    await dataSource.destroy();
    process.exit(1);
  }
}

fixProviderData();

