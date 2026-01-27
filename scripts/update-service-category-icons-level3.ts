import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

interface Category {
  id: string;
  name: string;
  icon_url: string | null;
}

interface ImageMapping {
  url: string;
  filename: string;
  normalizedName: string;
}

// Image URLs provided by user
const imageUrls = [
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Events+Services/Audio+and+Visual+Services.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Events+Services/BBQ+and+Lechon+Services.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Events+Services/Buffet+Services.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Events+Services/catering+services.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Events+Services/DJ+Services.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Events+Services/entertainment+services.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Events+Services/event+planning+services.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Events+Services/Graduation+Photography.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Events+Services/Maternity+Photography.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Events+Services/Music+Lessons.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Events+Services/Photo+Booth+Services.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Events+Services/photography+services.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Events+Services/Product+Photography.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Events+Services/Professional+Headshots.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Events+Services/Real+Estate+Photography.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Events+Services/Skills+Training.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Events+Services/Spa+Services.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Events+Services/Specialty+Catering.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Events+Services/videography+services.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Events+Services/Yoga+%26+Pilates.png',
];

function extractFilename(url: string): string {
  // Extract filename from URL
  const filename = url.split('/').pop() || '';
  // Remove .png extension
  const nameWithoutExt = filename.replace(/\.png$/i, '');
  // Decode URL encoding (%26 -> &, + -> space)
  return decodeURIComponent(nameWithoutExt.replace(/\+/g, ' '));
}

function normalizeName(name: string): string {
  // Normalize for comparison: lowercase, remove special chars, trim
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function calculateSimilarity(str1: string, str2: string): number {
  const norm1 = normalizeName(str1);
  const norm2 = normalizeName(str2);
  
  // Exact match
  if (norm1 === norm2) return 100;
  
  // Contains match
  if (norm1.includes(norm2) || norm2.includes(norm1)) return 80;
  
  // Word-based similarity
  const words1 = norm1.split(' ').filter(w => w.length > 0);
  const words2 = norm2.split(' ').filter(w => w.length > 0);
  
  let matchCount = 0;
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
        matchCount++;
        break;
      }
    }
  }
  
  const similarity = (matchCount / Math.max(words1.length, words2.length)) * 100;
  return similarity;
}

function findBestMatch(
  categoryName: string,
  imageMappings: ImageMapping[],
): ImageMapping | null {
  let bestMatch: ImageMapping | null = null;
  let bestScore = 0;
  
  for (const mapping of imageMappings) {
    const score = calculateSimilarity(categoryName, mapping.normalizedName);
    if (score > bestScore && score >= 50) {
      // Minimum 50% similarity threshold
      bestScore = score;
      bestMatch = mapping;
    }
  }
  
  return bestMatch;
}

async function updateCategoryIcons() {
  let client: Client | null = null;

  try {
    // 1. Initialize database connection
    client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USERNAME || process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE || process.env.DB_NAME || 'ai_trusttrade',
    });

    await client.connect();
    console.log('✅ 데이터베이스 연결 성공\n');

    // 2. Prepare image mappings
    const imageMappings: ImageMapping[] = imageUrls.map((url) => {
      const filename = extractFilename(url);
      return {
        url,
        filename,
        normalizedName: filename,
      };
    });

    console.log('📋 이미지 URL 매핑:');
    imageMappings.forEach((mapping, index) => {
      console.log(`  ${index + 1}. ${mapping.filename}`);
    });
    console.log('');

    // 3. Query categories with level 3
    const result = await client.query<Category>(
      `SELECT id, name, icon_url 
       FROM service_categories 
       WHERE category_level = 3 
       ORDER BY name`
    );

    const categories = result.rows;

    if (categories.length === 0) {
      console.log('⚠️  category_level이 3인 카테고리가 없습니다.');
      return;
    }

    console.log(`📋 발견된 카테고리 (level 3): ${categories.length}개\n`);

    // 4. Match categories with images
    const updates: Array<{ category: Category; imageUrl: string; similarity: number }> = [];

    for (const category of categories) {
      const match = findBestMatch(category.name, imageMappings);
      if (match) {
        const similarity = calculateSimilarity(category.name, match.normalizedName);
        updates.push({
          category,
          imageUrl: match.url,
          similarity,
        });
      }
    }

    console.log('🔍 매칭 결과:\n');
    updates.forEach((update, index) => {
      console.log(
        `  ${index + 1}. "${update.category.name}" → ${update.similarity.toFixed(1)}% 유사도`
      );
      console.log(`     URL: ${update.imageUrl}\n`);
    });

    // 5. Confirm before updating
    console.log(`\n📝 ${updates.length}개의 카테고리를 업데이트합니다.\n`);

    // 6. Update database
    let successCount = 0;
    let skipCount = 0;

    for (const update of updates) {
      // Skip if already has the same URL
      if (update.category.icon_url === update.imageUrl) {
        console.log(`⏭️  "${update.category.name}" - 이미 동일한 URL입니다. 건너뜀`);
        skipCount++;
        continue;
      }

      await client.query(
        `UPDATE service_categories 
         SET icon_url = $1, updated_at = NOW() 
         WHERE id = $2`,
        [update.imageUrl, update.category.id]
      );

      console.log(`✅ "${update.category.name}" - icon_url 업데이트 완료`);
      successCount++;
    }

    // 7. Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 업데이트 결과:');
    console.log(`   ✅ 성공: ${successCount}개`);
    console.log(`   ⏭️  건너뜀: ${skipCount}개`);
    console.log(`   📋 전체 카테고리: ${categories.length}개`);
    console.log(`   🎯 매칭된 카테고리: ${updates.length}개`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    if (error instanceof Error) {
      console.error('   메시지:', error.message);
      console.error('   스택:', error.stack);
    }
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
      console.log('✅ 데이터베이스 연결 종료');
    }
  }
}

updateCategoryIcons();
