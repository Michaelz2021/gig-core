/**
 * 기존 bookings 중 task가 비어 있는 행에 대해
 * 서비스 카테고리(service_type)에 맞는 service_task_templates를 조회해
 * task 필드를 JSONB 배열로 채웁니다.
 *
 * 전제: migrations/020 (service_task_templates 테이블 + seed, service_categories.service_type, bookings.task JSONB) 적용됨.
 *
 * 실행: npx ts-node -r tsconfig-paths/register scripts/backfill-bookings-task-from-templates.ts
 * 또는: npm run script:backfill-bookings-task
 */
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'ai_trusttrade',
  entities: [],
});

const VALID_SERVICE_TYPES = ['HOME', 'EVENTS', 'FREELANCE', 'PERSONAL'];

interface TemplateRow {
  id: string;
  service_type: string;
  phase: number;
  task_seq: number;
  task_code: string;
  task_label: string;
  actor: string;
  is_auto: boolean;
}

interface BookingRow {
  id: string;
  service_id: string | null;
  auction_id: string | null;
}

async function backfill() {
  const queryRunner = dataSource.createQueryRunner();

  try {
    await dataSource.initialize();
    console.log('✅ DB 연결 성공\n');

    // task가 비어 있는 booking: NULL 이거나 JSON 빈 배열 또는 텍스트 빈 문자열
    const emptyCondition = `
      (b.task IS NULL)
      OR (b.task::text = '[]')
      OR (b.task::text = '""')
      OR (trim(b.task::text) = '')
    `;

    const countResult = await queryRunner.query(
      `SELECT COUNT(*) AS cnt FROM bookings b WHERE ${emptyCondition}`,
    );
    const toUpdate = parseInt(countResult[0]?.cnt ?? '0', 10);
    if (toUpdate === 0) {
      console.log('ℹ️  백필할 booking이 없습니다. (task가 이미 채워져 있음)');
      return;
    }
    console.log(`📋 백필 대상: ${toUpdate}건\n`);

    // service_task_templates 전체 로드 (service_type별로 캐시)
    const templatesRows: TemplateRow[] = await queryRunner.query(`
      SELECT id, service_type, phase, task_seq, task_code, task_label, actor, is_auto
      FROM service_task_templates
      ORDER BY service_type, phase, task_seq
    `);
    const templatesByType = new Map<string, TemplateRow[]>();
    for (const row of templatesRows) {
      const t = row.service_type?.trim().toUpperCase() || 'HOME';
      if (!templatesByType.has(t)) templatesByType.set(t, []);
      templatesByType.get(t)!.push(row);
    }
    console.log(`📌 템플릿 로드: ${templatesRows.length}건 (${Array.from(templatesByType.keys()).join(', ')})\n`);

    // task가 비어 있는 booking 목록 (id, service_id, auction_id)
    const bookings: BookingRow[] = await queryRunner.query(
      `SELECT b.id, b.service_id, b.auction_id FROM bookings b WHERE ${emptyCondition}`,
    );

    let updated = 0;
    let skipped = 0;

    // service_categories.service_type 컬럼 존재 여부 (마이그레이션 020 미적용 시 없음)
    let hasServiceTypeColumn = false;
    try {
      await queryRunner.query(
        `SELECT service_type FROM service_categories LIMIT 1`,
      );
      hasServiceTypeColumn = true;
    } catch {
      console.log('ℹ️  service_categories.service_type 컬럼 없음 → 모든 예약에 HOME 템플릿 적용\n');
    }

    for (const booking of bookings) {
      let serviceType = 'HOME';

      if (hasServiceTypeColumn && booking.service_id) {
        try {
          const catRows = await queryRunner.query(
            `SELECT sc.service_type FROM services s
             JOIN service_categories sc ON sc.id = s.category_id
             WHERE s.id = $1`,
            [booking.service_id],
          );
          if (catRows?.length > 0 && catRows[0].service_type) {
            const t = String(catRows[0].service_type).trim().toUpperCase();
            if (VALID_SERVICE_TYPES.includes(t)) serviceType = t;
          }
        } catch {
          serviceType = 'HOME';
        }
      } else if (hasServiceTypeColumn && booking.auction_id) {
        try {
          const aucRows = await queryRunner.query(
            `SELECT sc.service_type FROM auctions a
             JOIN service_categories sc ON sc.id = a.service_category_id
             WHERE a.id = $1`,
            [booking.auction_id],
          );
          if (aucRows?.length > 0 && aucRows[0].service_type) {
            const t = String(aucRows[0].service_type).trim().toUpperCase();
            if (VALID_SERVICE_TYPES.includes(t)) serviceType = t;
          }
        } catch {
          serviceType = 'HOME';
        }
      }

      const templates = templatesByType.get(serviceType) ?? templatesByType.get('HOME') ?? [];
      if (templates.length === 0) {
        skipped++;
        continue;
      }

      const taskArray = templates.map((t) => ({
        templateId: t.id,
        taskCode: t.task_code,
        taskLabel: t.task_label,
        phase: t.phase,
        taskSeq: t.task_seq,
        actor: t.actor,
        isAuto: t.is_auto,
        completed: false,
        completedAt: null,
      }));

      await queryRunner.query(
        `UPDATE bookings SET task = $1::jsonb WHERE id = $2`,
        [JSON.stringify(taskArray), booking.id],
      );
      updated++;
    }

    console.log(`✅ 완료: ${updated}건 업데이트, ${skipped}건 스킵 (템플릿 없음)\n`);
  } catch (e) {
    console.error('❌ 오류:', e);
    throw e;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

backfill();
