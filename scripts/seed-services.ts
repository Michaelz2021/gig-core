import { DataSource } from 'typeorm';
import { Service } from '../src/modules/services/entities/service.entity';
import { ServiceCategory } from '../src/modules/services/entities/service-category.entity';
import { Provider } from '../src/modules/users/entities/provider.entity';
import { RateType, LocationType } from '../src/modules/services/entities/service.entity';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

// 서비스 데이터 구조 정의
interface ServiceData {
  title: string;
  description: string;
  baseRate: number;
  rateType: RateType;
  minRate?: number;
  maxRate?: number;
  durationMinutes?: number;
  locationType?: LocationType;
  tags?: string[];
}

// General House Cleaning 서비스들
const generalHouseCleaningServices: ServiceData[] = [
  {
    title: 'Regular Cleaning Service',
    description: 'Professional regular cleaning service for your home. Includes dusting, vacuuming, mopping, bathroom cleaning, and kitchen cleaning. Perfect for weekly or bi-weekly maintenance.',
    baseRate: 500,
    rateType: RateType.PER_HOUR,
    minRate: 400,
    maxRate: 800,
    durationMinutes: 120,
    locationType: LocationType.CUSTOMER_LOCATION,
    tags: ['cleaning', 'regular', 'house', 'maintenance'],
  },
  {
    title: 'Deep Cleaning Service',
    description: 'Comprehensive deep cleaning service that covers every corner of your home. Includes detailed scrubbing, baseboard cleaning, inside appliances, and thorough sanitization.',
    baseRate: 1500,
    rateType: RateType.PER_PROJECT,
    minRate: 1200,
    maxRate: 2500,
    durationMinutes: 360,
    locationType: LocationType.CUSTOMER_LOCATION,
    tags: ['cleaning', 'deep', 'thorough', 'sanitization'],
  },
  {
    title: 'Move-in/Move-out Cleaning',
    description: 'Complete cleaning service for moving in or out. Ensures your new or old home is spotless and ready. Includes all rooms, appliances, and detailed attention to every area.',
    baseRate: 2000,
    rateType: RateType.PER_PROJECT,
    minRate: 1500,
    maxRate: 3500,
    durationMinutes: 480,
    locationType: LocationType.CUSTOMER_LOCATION,
    tags: ['cleaning', 'move-in', 'move-out', 'relocation'],
  },
  {
    title: 'Spring Cleaning Service',
    description: 'Seasonal comprehensive spring cleaning service. Perfect for refreshing your home after winter. Includes decluttering, deep cleaning, window washing, and organizing.',
    baseRate: 1800,
    rateType: RateType.PER_PROJECT,
    minRate: 1500,
    maxRate: 3000,
    durationMinutes: 420,
    locationType: LocationType.CUSTOMER_LOCATION,
    tags: ['cleaning', 'spring', 'seasonal', 'decluttering'],
  },
];

// Specialized Cleaning 서비스들
const specializedCleaningServices: ServiceData[] = [
  {
    title: 'Carpet Cleaning Service',
    description: 'Professional carpet cleaning using steam cleaning and specialized equipment. Removes deep stains, odors, and allergens. Perfect for maintaining your carpets.',
    baseRate: 800,
    rateType: RateType.PER_PROJECT,
    minRate: 600,
    maxRate: 1500,
    durationMinutes: 180,
    locationType: LocationType.CUSTOMER_LOCATION,
    tags: ['cleaning', 'carpet', 'steam', 'stain-removal'],
  },
  {
    title: 'Sofa/Upholstery Cleaning',
    description: 'Expert sofa and upholstery cleaning service. Removes stains, odors, and allergens from your furniture. Uses safe cleaning methods suitable for all fabric types.',
    baseRate: 600,
    rateType: RateType.PER_PROJECT,
    minRate: 500,
    maxRate: 1200,
    durationMinutes: 120,
    locationType: LocationType.CUSTOMER_LOCATION,
    tags: ['cleaning', 'sofa', 'upholstery', 'furniture'],
  },
  {
    title: 'Window Cleaning Service',
    description: 'Professional window and glass cleaning service. Includes interior and exterior windows, window frames, and glass doors. Streak-free results guaranteed.',
    baseRate: 400,
    rateType: RateType.PER_HOUR,
    minRate: 300,
    maxRate: 700,
    durationMinutes: 90,
    locationType: LocationType.CUSTOMER_LOCATION,
    tags: ['cleaning', 'window', 'glass', 'streak-free'],
  },
  {
    title: 'Post-construction Cleaning',
    description: 'Comprehensive cleaning service after construction or renovation. Removes dust, debris, paint splatters, and construction materials. Makes your space move-in ready.',
    baseRate: 2500,
    rateType: RateType.PER_PROJECT,
    minRate: 2000,
    maxRate: 4000,
    durationMinutes: 600,
    locationType: LocationType.CUSTOMER_LOCATION,
    tags: ['cleaning', 'construction', 'renovation', 'debris-removal'],
  },
  {
    title: 'Office Cleaning Service',
    description: 'Professional commercial office cleaning service. Includes desks, floors, restrooms, common areas, and kitchen spaces. Available for regular or one-time cleaning.',
    baseRate: 600,
    rateType: RateType.PER_HOUR,
    minRate: 500,
    maxRate: 1000,
    durationMinutes: 180,
    locationType: LocationType.CUSTOMER_LOCATION,
    tags: ['cleaning', 'office', 'commercial', 'business'],
  },
  {
    title: 'Disinfection Services',
    description: 'Professional disinfection and sanitization service. Uses EPA-approved disinfectants to eliminate germs, viruses, and bacteria. Perfect for homes and offices.',
    baseRate: 1000,
    rateType: RateType.PER_PROJECT,
    minRate: 800,
    maxRate: 2000,
    durationMinutes: 120,
    locationType: LocationType.CUSTOMER_LOCATION,
    tags: ['cleaning', 'disinfection', 'sanitization', 'health'],
  },
];

async function seedServices() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'ai_trusttrade',
    entities: [path.join(__dirname, '../src/**/*.entity{.ts,.js}')],
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('✅ 데이터베이스 연결 성공');

    const serviceRepository = dataSource.getRepository(Service);
    const categoryRepository = dataSource.getRepository(ServiceCategory);
    const providerRepository = dataSource.getRepository(Provider);

    // 카테고리 찾기
    console.log('🔍 카테고리 찾는 중...');
    const generalHouseCleaningCategory = await categoryRepository.findOne({
      where: { slug: 'general-house-cleaning' },
    });

    const specializedCleaningCategory = await categoryRepository.findOne({
      where: { slug: 'specialized-cleaning' },
    });

    if (!generalHouseCleaningCategory) {
      throw new Error('General House Cleaning 카테고리를 찾을 수 없습니다.');
    }
    if (!specializedCleaningCategory) {
      throw new Error('Specialized Cleaning 카테고리를 찾을 수 없습니다.');
    }

    console.log(`  ✓ General House Cleaning 카테고리 ID: ${generalHouseCleaningCategory.id}`);
    console.log(`  ✓ Specialized Cleaning 카테고리 ID: ${specializedCleaningCategory.id}`);

    // Provider 찾기 또는 생성
    console.log('🔍 Provider 찾는 중...');
    let provider = await providerRepository
      .createQueryBuilder('provider')
      .select(['provider.id'])
      .where('provider.is_active = :isActive', { isActive: true })
      .getOne();

    if (!provider) {
      console.log('⚠️  활성화된 Provider를 찾을 수 없습니다. 첫 번째 Provider를 사용합니다.');
      provider = await providerRepository
        .createQueryBuilder('provider')
        .select(['provider.id'])
        .limit(1)
        .getOne();
      
      if (!provider) {
        throw new Error('Provider를 찾을 수 없습니다. 먼저 Provider를 생성해주세요.');
      }
    }

    console.log(`  ✓ Provider ID: ${provider.id}`);

    // General House Cleaning 서비스 추가 (3개만)
    console.log('\n📝 General House Cleaning 서비스 추가 중...');
    for (const serviceData of generalHouseCleaningServices.slice(0, 3)) {
      await serviceRepository.query(
        `INSERT INTO services (
          provider_id, category_id, title, description, 
          base_rate, rate_type, min_rate, max_rate, 
          duration_minutes, location_type, 
          is_active, is_featured, average_rating, total_reviews, 
          views_count, bookings_count
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          provider.id,
          generalHouseCleaningCategory.id,
          serviceData.title,
          serviceData.description,
          serviceData.baseRate,
          serviceData.rateType,
          serviceData.minRate || null,
          serviceData.maxRate || null,
          serviceData.durationMinutes || null,
          serviceData.locationType || null,
          true,
          false,
          0,
          0,
          0,
          0,
        ]
      );
      console.log(`  ✓ ${serviceData.title}`);
    }

    // Specialized Cleaning 서비스 추가 (3개만)
    console.log('\n📝 Specialized Cleaning 서비스 추가 중...');
    for (const serviceData of specializedCleaningServices.slice(0, 3)) {
      await serviceRepository.query(
        `INSERT INTO services (
          provider_id, category_id, title, description, 
          base_rate, rate_type, min_rate, max_rate, 
          duration_minutes, location_type, 
          is_active, is_featured, average_rating, total_reviews, 
          views_count, bookings_count
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          provider.id,
          specializedCleaningCategory.id,
          serviceData.title,
          serviceData.description,
          serviceData.baseRate,
          serviceData.rateType,
          serviceData.minRate || null,
          serviceData.maxRate || null,
          serviceData.durationMinutes || null,
          serviceData.locationType || null,
          true,
          false,
          0,
          0,
          0,
          0,
        ]
      );
      console.log(`  ✓ ${serviceData.title}`);
    }

    console.log('\n✅ 서비스 시드 데이터 삽입 완료!');
    const totalCount = await serviceRepository.count({
      where: {
        categoryId: generalHouseCleaningCategory.id,
      },
    });
    const specializedCount = await serviceRepository.count({
      where: {
        categoryId: specializedCleaningCategory.id,
      },
    });
    console.log(`📊 General House Cleaning: ${totalCount}개 서비스`);
    console.log(`📊 Specialized Cleaning: ${specializedCount}개 서비스`);

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ 에러 발생:', error);
    process.exit(1);
  }
}

seedServices();
