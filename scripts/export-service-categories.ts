import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const EXPORTS_DIR = path.join(__dirname, '..', 'exports');

function escapeCsv(value: unknown): string {
  if (value == null) return '';
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

async function exportServiceCategories() {
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
    console.log('Database connected.');

    const result = await client.query(
      `SELECT id, name, slug, description, parent_category_id, category_level, is_active, display_order, icon_url, created_at, updated_at
       FROM service_categories
       ORDER BY category_level, display_order, name`,
    );

    const headers = [
      'id',
      'name',
      'slug',
      'description',
      'parent_category_id',
      'category_level',
      'is_active',
      'display_order',
      'icon_url',
      'created_at',
      'updated_at',
    ];

    if (!fs.existsSync(EXPORTS_DIR)) {
      fs.mkdirSync(EXPORTS_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outputPath = path.join(EXPORTS_DIR, `service_categories_${timestamp}.csv`);

    const lines: string[] = [headers.join(',')];
    for (const row of result.rows) {
      const values = headers.map((h) => escapeCsv((row as Record<string, unknown>)[h]));
      lines.push(values.join(','));
    }

    fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');
    console.log(`Exported ${result.rows.length} rows to ${outputPath}`);
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

exportServiceCategories();
