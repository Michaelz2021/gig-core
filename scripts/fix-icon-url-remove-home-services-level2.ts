import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const PREFIX_TO_REMOVE = 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/Home+Services/';
const NEW_PREFIX = 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/icons/service/';

async function fixIconUrls() {
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

    // Update category_level = 2 only: remove "Home+Services/" from icon_url
    const result = await client.query(
      `UPDATE service_categories
       SET icon_url = REPLACE(icon_url, $1, $2), updated_at = NOW()
       WHERE category_level = 2
         AND icon_url LIKE $1 || '%'
       RETURNING id, name, icon_url`,
      [PREFIX_TO_REMOVE, NEW_PREFIX],
    );

    const updated = result.rowCount ?? 0;
    console.log(`Updated ${updated} rows (category_level = 2).\n`);

    if (result.rows.length > 0) {
      console.log('Updated icon_url values:');
      result.rows.forEach((r: { name: string; icon_url: string }) => {
        console.log(`  ${r.name} -> ${r.icon_url}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
      console.log('\nDatabase connection closed.');
    }
  }
}

fixIconUrls();
