import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

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

interface RankingData {
  name: string;
  businessName?: string;
  primaryCategory: string;
  secondaryCategories: string[];
  totalScore: number;
  trustScore: number;
  ratingScore: number;
  completionRate: number;
  responseTimeMinutes: number;
  yearsOfExperience: number;
  totalJobsCompleted: number;
  ranking: number;
}

const sampleRankings: RankingData[] = [
  {
    name: 'Juan Dela Cruz',
    businessName: 'Juan Dela Cruz Home Services',
    primaryCategory: 'Home Services',
    secondaryCategories: ['Plumbing', 'Electrical'],
    totalScore: 892.5,
    trustScore: 850,
    ratingScore: 4.8,
    completionRate: 98.5,
    responseTimeMinutes: 15,
    yearsOfExperience: 8,
    totalJobsCompleted: 127,
    ranking: 1,
  },
  {
    name: 'Maria Santos',
    primaryCategory: 'Personal Services',
    secondaryCategories: ['Tutoring', 'Language Teaching'],
    totalScore: 875.3,
    trustScore: 820,
    ratingScore: 4.9,
    completionRate: 97.2,
    responseTimeMinutes: 20,
    yearsOfExperience: 6,
    totalJobsCompleted: 98,
    ranking: 2,
  },
  {
    name: 'Roberto Garcia',
    businessName: 'Garcia Events Management',
    primaryCategory: 'Events Services',
    secondaryCategories: ['Event Planning', 'Catering'],
    totalScore: 862.1,
    trustScore: 800,
    ratingScore: 4.7,
    completionRate: 96.8,
    responseTimeMinutes: 25,
    yearsOfExperience: 10,
    totalJobsCompleted: 145,
    ranking: 3,
  },
  {
    name: 'Anna Rodriguez',
    primaryCategory: 'Digital Services',
    secondaryCategories: ['Web Development', 'Graphic Design'],
    totalScore: 855.7,
    trustScore: 780,
    ratingScore: 4.6,
    completionRate: 95.5,
    responseTimeMinutes: 18,
    yearsOfExperience: 5,
    totalJobsCompleted: 89,
    ranking: 4,
  },
  {
    name: 'Carlos Fernandez',
    businessName: 'Fernandez Home Solutions',
    primaryCategory: 'Home Services',
    secondaryCategories: ['HVAC', 'Plumbing'],
    totalScore: 848.2,
    trustScore: 760,
    ratingScore: 4.5,
    completionRate: 94.2,
    responseTimeMinutes: 22,
    yearsOfExperience: 7,
    totalJobsCompleted: 112,
    ranking: 5,
  },
  {
    name: 'Lisa Martinez',
    primaryCategory: 'Personal Services',
    secondaryCategories: ['Personal Training', 'Nutrition Counseling'],
    totalScore: 841.5,
    trustScore: 740,
    ratingScore: 4.4,
    completionRate: 93.8,
    responseTimeMinutes: 30,
    yearsOfExperience: 4,
    totalJobsCompleted: 76,
    ranking: 6,
  },
  {
    name: 'Michael Tan',
    businessName: 'Tan Digital Solutions',
    primaryCategory: 'Digital Services',
    secondaryCategories: ['SEO', 'Social Media Marketing'],
    totalScore: 835.8,
    trustScore: 720,
    ratingScore: 4.3,
    completionRate: 92.5,
    responseTimeMinutes: 35,
    yearsOfExperience: 6,
    totalJobsCompleted: 94,
    ranking: 7,
  },
  {
    name: 'Sarah Lopez',
    businessName: 'Lopez Event Services',
    primaryCategory: 'Events Services',
    secondaryCategories: ['Photography', 'Videography'],
    totalScore: 829.4,
    trustScore: 700,
    ratingScore: 4.2,
    completionRate: 91.2,
    responseTimeMinutes: 40,
    yearsOfExperience: 5,
    totalJobsCompleted: 83,
    ranking: 8,
  },
  {
    name: 'Jose Reyes',
    businessName: 'Reyes Home Maintenance',
    primaryCategory: 'Home Services',
    secondaryCategories: ['Carpentry', 'Painting'],
    totalScore: 823.1,
    trustScore: 680,
    ratingScore: 4.1,
    completionRate: 90.5,
    responseTimeMinutes: 28,
    yearsOfExperience: 9,
    totalJobsCompleted: 105,
    ranking: 9,
  },
  {
    name: 'Jennifer Cruz',
    primaryCategory: 'Personal Services',
    secondaryCategories: ['Beauty Services', 'Hair Styling'],
    totalScore: 817.6,
    trustScore: 660,
    ratingScore: 4.0,
    completionRate: 89.8,
    responseTimeMinutes: 45,
    yearsOfExperience: 3,
    totalJobsCompleted: 68,
    ranking: 10,
  },
];

async function seedTopTierRanking() {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await dataSource.initialize();
    console.log('✅ 데이터베이스 연결 성공\n');

    // 기존 랭킹 데이터 삭제 (선택적)
    console.log('🧹 기존 랭킹 데이터 확인 중...');
    const existingCount = await queryRunner.query(
      'SELECT COUNT(*) as count FROM top_tier_providers_ranking'
    );
    console.log(`   현재 랭킹 데이터: ${existingCount[0].count}개\n`);

    // 카테고리 매핑 (이름으로 찾기)
    const categoryMap = new Map<string, string>();
    const categories = await queryRunner.query(
      "SELECT id, name FROM service_categories WHERE is_active = true"
    );
    categories.forEach((cat: any) => {
      categoryMap.set(cat.name.toLowerCase(), cat.id);
    });

    console.log('📋 샘플 Provider 및 랭킹 데이터 생성 중...\n');

    let createdCount = 0;
    let skippedCount = 0;

    for (const rankingData of sampleRankings) {
      try {
        // 1. User 생성 (또는 찾기)
        const email = `${rankingData.name.toLowerCase().replace(/\s+/g, '.')}@example.com`;
        const phone = `+63917${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`;
        
        let userId: string;
        const existingUser = await queryRunner.query(
          'SELECT id FROM users WHERE email = $1',
          [email]
        );

        if (existingUser.length > 0) {
          userId = existingUser[0].id;
          console.log(`   ⚠️  User 이미 존재: ${rankingData.name} (${email})`);
        } else {
          // User 생성
          const [firstName, ...lastNameParts] = rankingData.name.split(' ');
          const lastName = lastNameParts.join(' ') || firstName;
          
          const hashedPassword = await bcrypt.hash('Password123!', 10);
          
          const userResult = await queryRunner.query(
            `INSERT INTO users (
              id, email, phone, password_hash, first_name, last_name, user_type,
              is_email_verified, is_phone_verified, status, created_at, updated_at
            ) VALUES (
              gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
            ) RETURNING id`,
            [
              email,
              phone,
              hashedPassword,
              firstName,
              lastName,
              'provider',
              true,
              true,
              'active',
            ]
          );
          userId = userResult[0].id;
          console.log(`   ✅ User 생성: ${rankingData.name}`);
        }

        // 2. Provider 생성 (또는 찾기)
        let providerId: string;
        const existingProvider = await queryRunner.query(
          'SELECT id FROM providers WHERE user_id = $1',
          [userId]
        );

        if (existingProvider.length > 0) {
          providerId = existingProvider[0].id;
          console.log(`   ⚠️  Provider 이미 존재: ${rankingData.name}`);
        } else {
          // Provider 생성
          const providerResult = await queryRunner.query(
            `INSERT INTO providers (
              id, user_id, business_name, years_of_experience, is_active, is_available,
              created_at, updated_at
            ) VALUES (
              gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW()
            ) RETURNING id`,
            [
              userId,
              rankingData.businessName || null,
              rankingData.yearsOfExperience,
              true,
              true,
            ]
          );
          providerId = providerResult[0].id;
          console.log(`   ✅ Provider 생성: ${rankingData.name}`);
        }

        // 3. Trust Score 생성 (없으면)
        const existingTrustScore = await queryRunner.query(
          'SELECT id FROM trust_scores WHERE user_id = $1',
          [userId]
        );

        if (existingTrustScore.length === 0) {
          await queryRunner.query(
            `INSERT INTO trust_scores (
              id, user_id, current_score, score_category, last_calculated_at, updated_at
            ) VALUES (
              gen_random_uuid(), $1, $2, $3, NOW(), NOW()
            )`,
            [
              userId,
              rankingData.trustScore,
              rankingData.trustScore >= 850 ? 'excellent' :
              rankingData.trustScore >= 700 ? 'very_good' :
              rankingData.trustScore >= 500 ? 'good' :
              rankingData.trustScore >= 300 ? 'fair' : 'poor',
            ]
          );
          console.log(`   ✅ Trust Score 생성: ${rankingData.trustScore}`);
        } else {
          // Trust Score 업데이트
          await queryRunner.query(
            `UPDATE trust_scores SET current_score = $1, updated_at = NOW() WHERE user_id = $2`,
            [rankingData.trustScore, userId]
          );
        }

        // 4. 카테고리 ID 찾기
        const primaryCategoryId = categoryMap.get(rankingData.primaryCategory.toLowerCase());
        const primaryCategoryName = primaryCategoryId ? rankingData.primaryCategory : null;

        // 점수 계산 (calculate_provider_ranking 함수와 동일한 로직)
        const completionRateScore = Math.min(rankingData.completionRate, 100);
        const responseTimeScore = rankingData.responseTimeMinutes === 0 
          ? 100 
          : Math.max(0, 100 - (rankingData.responseTimeMinutes * 2));
        const experienceScore = Math.min(rankingData.yearsOfExperience * 10, 100);
        const transactionVolumeScore = Math.floor(Math.min(rankingData.totalJobsCompleted / 10, 100));

        // 5. 랭킹 데이터 직접 INSERT
        await queryRunner.query(
          `INSERT INTO top_tier_providers_ranking (
            provider_id, user_id, name, business_name, display_name,
            primary_category, secondary_categories,
            total_score, trust_score, rating_score,
            completion_rate_score, response_time_score, experience_score, transaction_volume_score,
            total_jobs_completed, average_rating, completion_rate,
            response_time_minutes, years_of_experience,
            ranking_position, last_calculated_at, calculation_version, is_active,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW(), 'v1.0', true, NOW(), NOW()
          )
          ON CONFLICT (provider_id) DO UPDATE SET
            user_id = EXCLUDED.user_id,
            name = EXCLUDED.name,
            business_name = EXCLUDED.business_name,
            display_name = EXCLUDED.display_name,
            primary_category = EXCLUDED.primary_category,
            secondary_categories = EXCLUDED.secondary_categories,
            total_score = EXCLUDED.total_score,
            trust_score = EXCLUDED.trust_score,
            rating_score = EXCLUDED.rating_score,
            completion_rate_score = EXCLUDED.completion_rate_score,
            response_time_score = EXCLUDED.response_time_score,
            experience_score = EXCLUDED.experience_score,
            transaction_volume_score = EXCLUDED.transaction_volume_score,
            total_jobs_completed = EXCLUDED.total_jobs_completed,
            average_rating = EXCLUDED.average_rating,
            completion_rate = EXCLUDED.completion_rate,
            response_time_minutes = EXCLUDED.response_time_minutes,
            years_of_experience = EXCLUDED.years_of_experience,
            ranking_position = EXCLUDED.ranking_position,
            last_calculated_at = EXCLUDED.last_calculated_at,
            updated_at = NOW()`,
          [
            providerId,
            userId,
            rankingData.name,
            rankingData.businessName || null,
            rankingData.businessName || rankingData.name,
            primaryCategoryName,
            rankingData.secondaryCategories,
            rankingData.totalScore,
            rankingData.trustScore,
            rankingData.ratingScore,
            completionRateScore,
            responseTimeScore,
            experienceScore,
            transactionVolumeScore,
            rankingData.totalJobsCompleted,
            rankingData.ratingScore,
            rankingData.completionRate,
            rankingData.responseTimeMinutes,
            rankingData.yearsOfExperience,
            rankingData.ranking, // ranking_position
          ]
        );

        console.log(`   ✅ 랭킹 데이터 생성: ${rankingData.ranking}위 - ${rankingData.name} (점수: ${rankingData.totalScore})\n`);
        createdCount++;

      } catch (error: any) {
        console.error(`   ❌ 오류 발생 (${rankingData.name}):`, error.message);
        skippedCount++;
        continue;
      }
    }

    console.log(`\n✨ 완료!`);
    console.log(`   생성됨: ${createdCount}개`);
    console.log(`   건너뜀: ${skippedCount}개`);

    // 최종 확인
    const finalCount = await queryRunner.query(
      'SELECT COUNT(*) as count FROM top_tier_providers_ranking'
    );
    console.log(`   총 랭킹 데이터: ${finalCount[0].count}개\n`);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

// 스크립트 실행
seedTopTierRanking()
  .then(() => {
    console.log('✅ 작업 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 작업 실패:', error);
    process.exit(1);
  });

