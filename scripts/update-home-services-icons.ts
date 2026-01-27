import { DataSource } from 'typeorm';
import { ServiceCategory } from '../src/modules/services/entities/service-category.entity';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

// 제공된 아이콘 URL 리스트
const iconUrls = [
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/air+conditioning+service.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Aircon+Repair+and+Maintenance.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/appliances+repair.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/carpentry.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/CCTV+Installation.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Ceiling+Work.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Circuit+Breaker+Repair.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Compresssor+Replacement.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Custom+Furniture+Making.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Deck+Construction.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Drain+Unclogging.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Duct+Cleaning.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Electrical+Safety+Inspection.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/electrical+services.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Electrical+Troubleshooting.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Faucet+and+Fixture+Installation.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Furniture+Services.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Garden+Maintenance.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/gardening+and+landscaping+services.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/General+Electrical.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/General+Handyman+Services.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/General+Plumbing.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Generator+Installation+and+Repair.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Landscaping+Design.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Lawn+Mowing.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Leak+Repair.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Light+Fixtrure+Installation.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Masonry+Works.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/painting+services.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Partition+Installation.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/pest+control+services.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Pipe+Installation+and+Replacement.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Plant+Care.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/plumbing+services.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Septic+Tank+Services.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Shelving+Installation.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Smart+Home+Installation.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Solar+Panel+Installation.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Specialized+Plumbing.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Switch+and+Outlets+Installation.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Tiling+Services.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Toilet+Repair+and+Replacement.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Tree+Trimming.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Troubleshooting+and+Diagnostics.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Water+Heater+Installation+and+Repair.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Water+Pump+Services.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Waterproofing.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Welding+Services.png',
];

// 카테고리 이름과 아이콘 URL 직접 매핑 테이블
const categoryIconMapping: { [key: string]: string } = {
  // Cleaning Services
  'Cleaning Services': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/gardening+and+landscaping+services.png', // 임시, 정확한 매칭 없음
  
  // Plumbing Services
  'Plumbing Services': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/plumbing+services.png',
  'General Plumbing': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/General+Plumbing.png',
  'Leak Repairs': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Leak+Repair.png',
  'Pipe Installation/Replacement': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Pipe+Installation+and+Replacement.png',
  'Drain Unclogging': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Drain+Unclogging.png',
  'Faucet/Fixture Installation': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Faucet+and+Fixture+Installation.png',
  'Toilet Repair/Replacement': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Toilet+Repair+and+Replacement.png',
  'Specialized Plumbing': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Specialized+Plumbing.png',
  
  // Electrical Services
  'Electrical Services': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/electrical+services.png',
  'General Electrical': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/General+Electrical.png',
  'Specialized Electrical': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/electrical+services.png',
  'Electrical Troubleshooting': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Electrical+Troubleshooting.png',
  'Electrical Safety Inspection': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Electrical+Safety+Inspection.png',
  'Switch and Outlets Installation': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Switch+and+Outlets+Installation.png',
  'Switch/Outlet Installation': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Switch+and+Outlets+Installation.png',
  'Light Fixture Installation': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Light+Fixtrure+Installation.png',
  'Circuit Breaker Repair': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Circuit+Breaker+Repair.png',
  'Wiring Installation/Repair': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/General+Electrical.png',
  
  // HVAC Services
  'HVAC Services': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/air+conditioning+service.png',
  'Air Conditioning Services': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/air+conditioning+service.png',
  'Air Conditioning Service': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/air+conditioning+service.png',
  'Aircon Repair & Maintenance': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Aircon+Repair+and+Maintenance.png',
  'Aircon Repair and Maintenance': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Aircon+Repair+and+Maintenance.png',
  'Duct Cleaning': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Duct+Cleaning.png',
  'Compressor Replacement': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Compresssor+Replacement.png',
  'Aircon Cleaning': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/air+conditioning+service.png',
  'Basic Cleaning': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/air+conditioning+service.png',
  'Deep Cleaning/Chemical Wash': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Aircon+Repair+and+Maintenance.png',
  
  // Handyman Services
  'Handyman Services': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/General+Handyman+Services.png',
  'General Handyman Services': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/General+Handyman+Services.png',
  
  // Painting Services
  'Painting Services': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/painting+services.png',
  
  // Carpentry Services
  'Carpentry Services': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/carpentry.png',
  'Custom Furniture Making': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Custom+Furniture+Making.png',
  'Furniture Services': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Furniture+Services.png',
  
  // Gardening & Landscaping
  'Gardening & Landscaping': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/gardening+and+landscaping+services.png',
  'Garden Maintenance': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Garden+Maintenance.png',
  'Landscaping Design': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Landscaping+Design.png',
  'Lawn Mowing': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Lawn+Mowing.png',
  'Plant Care': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Plant+Care.png',
  'Tree Trimming': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Tree+Trimming.png',
  
  // Pest Control
  'Pest Control Services': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/pest+control+services.png',
  
  // Appliances
  'Appliances Repair': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/appliances+repair.png',
  
  // Other Services
  'Home Improvement': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/General+Handyman+Services.png',
  'Tiling Services': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Tiling+Services.png',
  'Masonry Works': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Masonry+Works.png',
  'Ceiling Work': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Ceiling+Work.png',
  'Partition Installation': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Partition+Installation.png',
  'Shelving Installation': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Shelving+Installation.png',
  'Waterproofing': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Waterproofing.png',
  'Welding Services': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Welding+Services.png',
  'Water Heater Installation and Repair': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Water+Heater+Installation+and+Repair.png',
  'Water Pump Services': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Water+Pump+Services.png',
  'Septic Tank Services': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Septic+Tank+Services.png',
  'Generator Installation and Repair': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Generator+Installation+and+Repair.png',
  'Smart Home Installation': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Smart+Home+Installation.png',
  'CCTV Installation': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/CCTV+Installation.png',
  'Solar Panel Installation': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Solar+Panel+Installation.png',
  'Deck Construction': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Deck+Construction.png',
  'Troubleshooting and Diagnostics': 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/Troubleshooting+and+Diagnostics.png',
};

// URL에서 카테고리 이름 추출 및 정규화 함수
function extractCategoryNameFromUrl(url: string): string {
  const filename = url.split('/').pop()?.replace('.png', '') || '';
  return filename
    .split('+')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// 카테고리 이름 매칭 함수
function findBestMatch(categoryName: string, iconUrls: string[]): { url: string; score: number } | null {
  // 1. 직접 매핑 테이블에서 찾기
  if (categoryIconMapping[categoryName]) {
    return { url: categoryIconMapping[categoryName], score: 100 };
  }
  
  // 2. 부분 매칭 (카테고리 이름이 매핑 키에 포함되거나 그 반대)
  for (const [key, url] of Object.entries(categoryIconMapping)) {
    const categoryLower = categoryName.toLowerCase();
    const keyLower = key.toLowerCase();
    
    if (categoryLower.includes(keyLower) || keyLower.includes(categoryLower)) {
      return { url, score: 80 };
    }
  }
  
  // 3. 키워드 기반 매칭
  const categoryLower = categoryName.toLowerCase().trim();
  let bestMatch: { url: string; score: number } | null = null;
  let bestScore = 0;

  for (const url of iconUrls) {
    const iconName = extractCategoryNameFromUrl(url).toLowerCase();
    let score = 0;

    // 키워드 매칭
    const categoryWords = categoryLower.split(/\s+/);
    const iconWords = iconName.split(/\s+/);
    const matchingWords = categoryWords.filter(word => 
      word.length > 2 && iconWords.some(iconWord => iconWord.includes(word) || word.includes(iconWord))
    );
    score = (matchingWords.length / Math.max(categoryWords.length, iconWords.length)) * 60;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = { url, score };
    }
  }

  // 최소 점수 50 이상만 반환
  return bestScore >= 50 ? bestMatch : null;
}

async function updateHomeServicesIcons() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'ai_trusttrade',
    entities: [path.join(__dirname, '../src/**/*.entity{.ts,.js}')],
    synchronize: false,
    logging: true,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false,
    } : false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ 데이터베이스 연결 성공\n');

    const categoryRepository = dataSource.getRepository(ServiceCategory);

    // Home Services 관련 카테고리 찾기 (직접 또는 부모가 Home Services인 것들)
    // 먼저 "Home Services" 또는 "Home Services"를 포함하는 카테고리 찾기
    const homeServicesCategories = await categoryRepository
      .createQueryBuilder('category')
      .where('category.name ILIKE :name', { name: '%Home Services%' })
      .orWhere('category.name ILIKE :name2', { name2: '%Home Service%' })
      .getMany();

    console.log(`📋 Found ${homeServicesCategories.length} Home Services related categories\n`);

    // Home Services의 ID 찾기
    const homeServicesId = homeServicesCategories.find(cat => 
      (cat.name.toLowerCase().includes('home service') || cat.name === 'HOME SERVICES') && !cat.parentCategoryId
    )?.id;

    // Home Services 하위 카테고리 찾기 (재귀적으로 모든 하위 카테고리 포함)
    let allHomeServicesCategories: ServiceCategory[] = [...homeServicesCategories];
    
    if (homeServicesId) {
      // 모든 하위 카테고리를 재귀적으로 찾기
      const findAllChildren = async (parentId: string): Promise<ServiceCategory[]> => {
        const children = await categoryRepository
          .createQueryBuilder('category')
          .where('category.parent_category_id = :parentId', { parentId })
          .getMany();
        
        let allChildren = [...children];
        for (const child of children) {
          const grandChildren = await findAllChildren(child.id);
          allChildren = [...allChildren, ...grandChildren];
        }
        return allChildren;
      };
      
      const childCategories = await findAllChildren(homeServicesId);
      allHomeServicesCategories = [...allHomeServicesCategories, ...childCategories];
    }

    // icon_url이 NULL인 카테고리만 필터링
    const categoriesWithoutIcon = allHomeServicesCategories.filter(
      cat => !cat.iconUrl || cat.iconUrl.trim() === ''
    );

    console.log(`📝 Found ${categoriesWithoutIcon.length} categories without icon_url\n`);

    let updatedCount = 0;
    let notMatchedCount = 0;
    const notMatched: string[] = [];
    const matched: Array<{ category: string; url: string; score: number }> = [];

    console.log('🔄 매칭 및 업데이트 시작...\n');

    for (const category of categoriesWithoutIcon) {
      const match = findBestMatch(category.name, iconUrls);
      
      if (match && match.score >= 40) {
        category.iconUrl = match.url;
        await categoryRepository.save(category);
        updatedCount++;
        matched.push({ category: category.name, url: match.url, score: match.score });
        console.log(`✓ [${match.score.toFixed(0)}%] ${category.name} → ${match.url.split('/').pop()}`);
      } else {
        notMatchedCount++;
        notMatched.push(category.name);
        console.log(`✗ No match found for: ${category.name}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 업데이트 결과');
    console.log('='.repeat(60));
    console.log(`✅ 업데이트 완료: ${updatedCount}개`);
    console.log(`❌ 매칭 실패: ${notMatchedCount}개`);
    
    if (notMatched.length > 0) {
      console.log('\n매칭되지 않은 카테고리:');
      notMatched.forEach(name => console.log(`  - ${name}`));
    }

    if (matched.length > 0) {
      console.log('\n매칭된 카테고리:');
      matched.forEach(({ category, url, score }) => {
        console.log(`  - ${category} (${score.toFixed(0)}%) → ${url.split('/').pop()}`);
      });
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  } finally {
    await dataSource.destroy();
    console.log('\n데이터베이스 연결 종료');
  }
}

updateHomeServicesIcons()
  .then(() => {
    console.log('\n✅ 작업 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 작업 실패:', error);
    process.exit(1);
  });
