import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

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

const imageUrls = [
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Basic+Cleaning.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Bed+Bug+Treatment.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Cabinet+Installation.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Carpet+Cleaning.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Cockroach+Extermination.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Decorative+and+Mural+Painting.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Door+and+Window+Installation.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Fence+Painting.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Flooring+Installation+(Wood).png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Furniture+Repair+and+Restoration.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/General+Pest+Prevention.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Generator+Installation+and+Repair.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Haircut+(Home+Service).png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/House+Exterior+Painting.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Installation+and+Relocation.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Interior+Painting.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Microwave+Repair.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Move-in+and+Move-out+Cleaning.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Office+Cleaning.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Post-construction+Cleaning.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Rat+and+Mice+Control.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Refrigerant+Refilling+(Freon).png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Refrigerator+Repair.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Regular+Cleaning.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Roof+Painting.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Small+Appliance+Repair.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Sofa+and+Upholstery+Cleaning.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Spring+Cleaning.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Stove+and+Oven+Repair.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Termite+Treatment.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Trim+and+Molding+Painting.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Troubleshooting+&+Diagnostics.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Washing+Machine+Repair.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Water+Heater+Installation+and+Repair.png',
  'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Window+Cleaning.png',
];

function extractFilename(url: string): string {
  const filename = url.split('/').pop() || '';
  const nameWithoutExt = filename.replace(/\.png$/i, '');
  return decodeURIComponent(nameWithoutExt.replace(/\+/g, ' '));
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function calculateSimilarity(str1: string, str2: string): number {
  const norm1 = normalizeName(str1);
  const norm2 = normalizeName(str2);

  if (norm1 === norm2) return 100;
  if (norm1.includes(norm2) || norm2.includes(norm1)) return 80;

  const words1 = norm1.split(' ').filter((w) => w.length > 0);
  const words2 = norm2.split(' ').filter((w) => w.length > 0);

  let matchCount = 0;
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
        matchCount++;
        break;
      }
    }
  }

  return (matchCount / Math.max(words1.length, words2.length)) * 100;
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
      bestScore = score;
      bestMatch = mapping;
    }
  }

  return bestMatch;
}

async function updateCategoryIcons() {
  let client: Client | null = null;

  try {
    client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USERNAME || process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE || process.env.DB_NAME || 'ai_trusttrade',
    });

    await client.connect();
    console.log('Database connected.\n');

    const imageMappings: ImageMapping[] = imageUrls.map((url) => {
      const filename = extractFilename(url);
      return {
        url,
        filename,
        normalizedName: filename,
      };
    });

    console.log('Image URL mappings:');
    imageMappings.forEach((m, i) => console.log(`  ${i + 1}. ${m.filename}`));
    console.log('');

    const result = await client.query<Category>(
      `SELECT id, name, icon_url 
       FROM service_categories 
       WHERE category_level = 1 
       ORDER BY name`,
    );

    const categories = result.rows;

    if (categories.length === 0) {
      console.log('No categories with category_level = 1 found.');
      return;
    }

    console.log(`Found ${categories.length} categories (level 1).\n`);

    const updates: Array<{ category: Category; imageUrl: string; similarity: number }> = [];

    for (const category of categories) {
      const match = findBestMatch(category.name, imageMappings);
      if (match) {
        const similarity = calculateSimilarity(category.name, match.normalizedName);
        updates.push({ category, imageUrl: match.url, similarity });
      }
    }

    console.log('Matching results:\n');
    updates.forEach((u, i) => {
      console.log(`  ${i + 1}. "${u.category.name}" → ${u.similarity.toFixed(1)}% match`);
      console.log(`     URL: ${u.imageUrl}\n`);
    });

    console.log(`\nUpdating ${updates.length} categories.\n`);

    let successCount = 0;
    let skipCount = 0;

    for (const update of updates) {
      if (update.category.icon_url === update.imageUrl) {
        console.log(`Skip "${update.category.name}" - same URL`);
        skipCount++;
        continue;
      }

      await client.query(
        `UPDATE service_categories 
         SET icon_url = $1, updated_at = NOW() 
         WHERE id = $2`,
        [update.imageUrl, update.category.id],
      );

      console.log(`Updated "${update.category.name}" - icon_url set`);
      successCount++;
    }

    console.log('\n--- Summary ---');
    console.log(`Updated: ${successCount}`);
    console.log(`Skipped: ${skipCount}`);
    console.log(`Total level-1 categories: ${categories.length}`);
    console.log(`Matched: ${updates.length}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
      console.log('Database connection closed.');
    }
  }
}

updateCategoryIcons();
