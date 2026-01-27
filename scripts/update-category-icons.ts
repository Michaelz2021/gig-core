import { DataSource } from 'typeorm';
import { ServiceCategory } from '../src/modules/services/entities/service-category.entity';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

// URL과 카테고리 이름 매핑 (실제 DB 카테고리 이름 기준)
const iconUrlMapping: { url: string; categoryName: string }[] = [
  // Business Services (FREELANCE & DIGITAL SERVICES 하위)
  {
    url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Business+Services/accouting+%26+bookkeeping+services.png',
    categoryName: 'Accounting & Bookkeeping', // 실제 DB에는 "Accounting & Bookkeeping"
  },
  {
    url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Business+Services/real+state+services.png',
    categoryName: 'Business Services', // Real Estate는 없으므로 Business Services에 매핑
  },
  // Events Services
  {
    url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Events+Services/catering+services.png',
    categoryName: 'Catering Services',
  },
  {
    url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Events+Services/entertainment+services.png',
    categoryName: 'Entertainment Services',
  },
  {
    url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Events+Services/event+planning+services.png',
    categoryName: 'Event Planning', // 실제 DB에는 "Event Planning"
  },
  {
    url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Events+Services/photography+services.png',
    categoryName: 'Photography Services',
  },
  {
    url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Events+Services/videography+services.png',
    categoryName: 'Videography Services',
  },
  // Freelance & Digital Services
  {
    url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Freelance+%26+Digital+Services/content+writing.png',
    categoryName: 'Writing & Content', // 실제 DB에는 "Writing & Content"
  },
  {
    url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Freelance+%26+Digital+Services/digital+marketing+services.png',
    categoryName: 'Digital Marketing', // 실제 DB에는 "Digital Marketing"
  },
  {
    url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Freelance+%26+Digital+Services/graphic+design+services.png',
    categoryName: 'Graphic Design', // 실제 DB에는 "Graphic Design"
  },
  {
    url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Freelance+%26+Digital+Services/video+%26+photo+editing+services.png',
    categoryName: 'Video & Photo Editing', // 실제 DB에는 "Video & Photo Editing"
  },
  {
    url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Freelance+%26+Digital+Services/virtual+assistant.png',
    categoryName: 'Virtual Assistant Services', // 실제 DB에는 "Virtual Assistant Services"
  },
  {
    url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Freelance+%26+Digital+Services/web+development+services.png',
    categoryName: 'Web Development', // 실제 DB에는 "Web Development"
  },
  // Healthcare Services (DB에 없으므로 주석 처리하거나 다른 카테고리에 매핑)
  // {
  //   url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Healthcare+Services/medical+consultation.png',
  //   categoryName: 'Medical Consultation',
  // },
  // {
  //   url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Healthcare+Services/medical+procedures.png',
  //   categoryName: 'Medical Procedures',
  // },
  // {
  //   url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Healthcare+Services/nursing+services.png',
  //   categoryName: 'Nursing Services',
  // },
  // {
  //   url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Healthcare+Services/physical+theraphy.png',
  //   categoryName: 'Physical Therapy',
  // },
  // High-risk Activities (DB에 없으므로 주석 처리)
  // {
  //   url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/High-risk+Activities/extreme+activities.png',
  //   categoryName: 'Extreme Activities',
  // },
  // {
  //   url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/High-risk+Activities/high+altitude.png',
  //   categoryName: 'High Altitude',
  // },
  // {
  //   url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/High-risk+Activities/mountain+climbing.png',
  //   categoryName: 'Mountain Climbing',
  // },
  // {
  //   url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/High-risk+Activities/scuba+diving.png',
  //   categoryName: 'Scuba Diving',
  // },
  // Home Services
  {
    url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/air+conditioning+service.png',
    categoryName: 'Air Conditioning Services', // 실제 DB에는 "Air Conditioning Services"
  },
  {
    url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/appliances+repair.png',
    categoryName: 'Appliance Repair', // 실제 DB에는 "Appliance Repair"
  },
  {
    url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/carpentry.png',
    categoryName: 'Carpentry Services',
  },
  {
    url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/electrical+services.png',
    categoryName: 'Electrical Services',
  },
  {
    url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/gardening+and+landscaping+services.png',
    categoryName: 'Gardening & Landscaping', // 실제 DB에는 "Gardening & Landscaping"
  },
  {
    url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/painting+services.png',
    categoryName: 'Painting Services',
  },
  {
    url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/pest+control+services.png',
    categoryName: 'Pest Control',
  },
  {
    url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/plumbing+services.png',
    categoryName: 'Plumbing Services',
  },
  // Main Services (최상위 카테고리)
  {
    url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Main+Services/business+services.png',
    categoryName: 'Business Services',
  },
  {
    url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Main+Services/event+services.png',
    categoryName: 'EVENTS SERVICES',
  },
  {
    url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Main+Services/freelance+and+digital+services.png',
    categoryName: 'Freelance & Digital Services',
  },
  // Healthcare Services (DB에 없으므로 주석 처리)
  // {
  //   url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Main+Services/healthcare+services.png',
  //   categoryName: 'Healthcare Services',
  // },
  // High-risk Activities (DB에 없으므로 주석 처리)
  // {
  //   url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Main+Services/high-risk+activities.png',
  //   categoryName: 'High-risk Activities',
  // },
  {
    url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Main+Services/home+services.png',
    categoryName: 'Home Services',
  },
  {
    url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Main+Services/legal+services.png',
    categoryName: 'Legal Services (Document Preparation Only)',
  },
  {
    url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Main+Services/personal+services.png',
    categoryName: 'Personal Services',
  },
  // Vehicle Services (DB에 없으므로 주석 처리)
  // {
  //   url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Main+Services/vehicle+services.png',
  //   categoryName: 'Vehicle Services',
  // },
  // Personal Services
  {
    url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Personal+Services/beauty+%26+grooming+services.png',
    categoryName: 'Beauty & Grooming', // 실제 DB에는 "Beauty & Grooming"
  },
  {
    url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Personal+Services/childcare.png',
    categoryName: 'Childcare',
  },
  {
    url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Personal+Services/education+%26+training+services.png',
    categoryName: 'Education & Tutoring', // 실제 DB에는 "Education & Tutoring"
  },
  {
    url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Personal+Services/eldercare+services.png',
    categoryName: 'Eldercare', // 실제 DB에는 "Eldercare"
  },
  {
    url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Personal+Services/fitness+and+wellness+services.png',
    categoryName: 'Fitness & Wellness', // 실제 DB에는 "Fitness & Wellness"
  },
  // Vehicle Services (DB에 없으므로 주석 처리)
  // {
  //   url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Vehicle+Services/car+sales+services.png',
  //   categoryName: 'Car Sales Services',
  // },
  // {
  //   url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Vehicle+Services/car+towing.png',
  //   categoryName: 'Car Towing',
  // },
  // {
  //   url: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Vehicle+Services/vehicle+repair+services.png',
  //   categoryName: 'Vehicle Repair Services',
  // },
];

async function updateCategoryIcons() {
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

    // icon_url 컬럼이 있는지 확인
    const hasIconUrl = await dataSource.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'service_categories' 
      AND column_name = 'icon_url'
    `);

    if (hasIconUrl.length === 0) {
      console.log('📝 icon_url 컬럼 추가 중...');
      await dataSource.query(`
        ALTER TABLE service_categories 
        ADD COLUMN icon_url TEXT
      `);
      console.log('✅ icon_url 컬럼 추가 완료');
    }

    const categoryRepository = dataSource.getRepository(ServiceCategory);

    let updatedCount = 0;
    let notFoundCount = 0;
    const notFoundCategories: string[] = [];

    console.log('\n📝 카테고리 아이콘 URL 업데이트 시작...\n');

    for (const mapping of iconUrlMapping) {
      // 정규화 함수: 대소문자 무시, 특수문자 제거, 공백 정리
      const normalize = (str: string) => {
        return str
          .toLowerCase()
          .replace(/[&+]/g, '')
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
      };

      const normalizedTarget = normalize(mapping.categoryName);

      // DB에서 모든 카테고리 가져오기
      const allCategories = await categoryRepository.find();

      // 정확한 매칭 찾기 (정규화된 이름이 정확히 일치)
      let matchedCategories = allCategories.filter(cat => {
        const normalizedCat = normalize(cat.name);
        return normalizedCat === normalizedTarget;
      });

      // 정확한 매칭이 없으면 유사도 기반 매칭 시도
      if (matchedCategories.length === 0) {
        // 각 카테고리와의 유사도 계산
        const similarities = allCategories.map(cat => {
          const normalizedCat = normalize(cat.name);
          const targetWords = normalizedTarget.split(' ').filter(w => w.length > 2);
          const catWords = normalizedCat.split(' ').filter(w => w.length > 2);
          
          // 공통 단어 수 계산
          const commonWords = targetWords.filter(w => catWords.includes(w)).length;
          const totalWords = Math.max(targetWords.length, catWords.length);
          const similarity = totalWords > 0 ? commonWords / totalWords : 0;
          
          return { category: cat, similarity, normalizedCat };
        });

        // 유사도가 0.8 이상인 것만 선택 (80% 이상 일치)
        const highSimilarity = similarities
          .filter(s => s.similarity >= 0.8)
          .sort((a, b) => b.similarity - a.similarity);

        if (highSimilarity.length > 0) {
          // 가장 유사한 것만 선택
          matchedCategories = [highSimilarity[0].category];
        }
      }

      if (matchedCategories.length === 0) {
        notFoundCount++;
        notFoundCategories.push(mapping.categoryName);
        console.log(`❌ 찾을 수 없음: "${mapping.categoryName}"`);
        continue;
      }

      // 매칭된 카테고리 업데이트 (중복 방지: 같은 카테고리가 여러 URL에 매칭되지 않도록)
      for (const category of matchedCategories) {
        // 이미 icon_url이 설정되어 있고 다른 URL이면 스킵
        const existingCategory = await categoryRepository.findOne({
          where: { id: category.id },
        });
        
        if (existingCategory && (existingCategory as any).iconUrl && (existingCategory as any).iconUrl !== mapping.url) {
          console.log(`⚠️  이미 다른 URL이 설정됨: "${category.name}" (기존: ${(existingCategory as any).iconUrl.substring(0, 50)}...)`);
          continue;
        }

        await categoryRepository.update(category.id, {
          iconUrl: mapping.url,
        } as any);
        updatedCount++;
        console.log(`✅ 업데이트 완료: "${category.name}" -> ${mapping.url.substring(0, 60)}...`);
      }
    }

    console.log('\n📊 업데이트 결과:');
    console.log(`   ✅ 업데이트된 카테고리: ${updatedCount}개`);
    console.log(`   ❌ 찾을 수 없는 카테고리: ${notFoundCount}개`);

    if (notFoundCategories.length > 0) {
      console.log('\n⚠️  찾을 수 없는 카테고리 목록:');
      notFoundCategories.forEach(name => {
        console.log(`   - ${name}`);
      });
      console.log('\n💡 DB에 실제로 존재하는 카테고리 이름을 확인해주세요.');
    }

    // DB에 있는 모든 카테고리 목록 출력 (참고용)
    const allCategories = await categoryRepository.find({
      order: { name: 'ASC' },
    });
    console.log('\n📋 DB에 존재하는 모든 카테고리 목록 (최상위 및 2단계만):');
    const topLevelAndSecondLevel = allCategories.filter(cat => 
      !cat.parentCategoryId || 
      allCategories.find(p => p.id === cat.parentCategoryId && !p.parentCategoryId)
    );
    topLevelAndSecondLevel.forEach(cat => {
      const parent = cat.parentCategoryId ? allCategories.find(p => p.id === cat.parentCategoryId) : null;
      const prefix = parent ? `  └─ ${parent.name} > ` : '';
      console.log(`   ${prefix}${cat.name}`);
    });

    await dataSource.destroy();
    console.log('\n✅ 작업 완료');
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

updateCategoryIcons();

