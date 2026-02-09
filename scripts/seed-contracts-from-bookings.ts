/**
 * DB bookings 테이블 데이터를 기준으로 contracts 테이블에 계약서 레코드를 생성합니다.
 * 이미 해당 booking_number로 contract가 있는 경우는 건너뜁니다.
 *
 * 실행: npx ts-node -r tsconfig-paths/register scripts/seed-contracts-from-bookings.ts
 * 또는: npm run script:seed-contracts
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

interface BookingRow {
  id: string;
  booking_number: string;
  consumer_id: string;
  provider_id: string;
  service_description: string | null;
  service_rate: string;
  platform_fee: string;
  total_amount: string;
  scheduled_date: Date;
  scheduled_end_date: Date | null;
  task: string | null;
  location_address: string | null;
  subtotal: string;
  insurance_fee: string;
}

async function seedContractsFromBookings() {
  const queryRunner = dataSource.createQueryRunner();

  try {
    await dataSource.initialize();
    console.log('✅ 데이터베이스 연결 성공\n');

    // contracts 테이블 존재 여부 확인
    const tableCheck = await queryRunner.query(`
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'contracts'
    `);
    if (tableCheck.length === 0) {
      console.error('❌ contracts 테이블이 없습니다. 마이그레이션을 먼저 실행하세요.');
      return;
    }

    // 이미 contract가 있는 booking_number 목록
    const existing = await queryRunner.query(`
      SELECT booking_number FROM contracts
    `);
    const existingSet = new Set(existing.map((r: { booking_number: string }) => r.booking_number));

    // 모든 booking 조회 (contract에 필요한 컬럼만)
    const bookings: BookingRow[] = await queryRunner.query(`
      SELECT
        id,
        booking_number,
        consumer_id,
        provider_id,
        service_description,
        service_rate,
        platform_fee,
        total_amount,
        subtotal,
        insurance_fee,
        scheduled_date,
        scheduled_end_date,
        task,
        location_address
      FROM bookings
      ORDER BY created_at ASC
    `);

    console.log(`📋 총 ${bookings.length}개의 booking 조회. 이미 계약이 있는 건: ${existingSet.size}건\n`);

    let inserted = 0;
    let skipped = 0;

    for (const b of bookings) {
      if (existingSet.has(b.booking_number)) {
        skipped++;
        continue;
      }

      // contract_id: PK, 50자 이내 고유값 (CNT- + booking UUID = 40자)
      const contractId = `CNT-${b.id}`;
      const serviceDescription = b.service_description?.trim() || '(서비스 설명 없음)';
      const contractTerms = {
        scheduledDate: b.scheduled_date,
        scheduledEndDate: b.scheduled_end_date,
        task: b.task || undefined,
        locationAddress: b.location_address || undefined,
        subtotal: parseFloat(b.subtotal),
        insuranceFee: parseFloat(b.insurance_fee || '0'),
      };

      await queryRunner.query(
        `INSERT INTO contracts (
          contract_id,
          booking_number,
          consumer_id,
          provider_id,
          service_description,
          agreed_price,
          platform_fee,
          total_amount,
          contract_terms,
          status,
          consumer_signed_at,
          provider_signed_at,
          executed_at,
          blockchain_hash,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NULL, NULL, NULL, NULL, NOW(), NOW())`,
        [
          contractId,
          b.booking_number,
          b.consumer_id,
          b.provider_id,
          serviceDescription,
          b.service_rate,
          b.platform_fee,
          b.total_amount,
          JSON.stringify(contractTerms),
          'PENDING_SIGNATURES',
        ],
      );

      existingSet.add(b.booking_number);
      inserted++;
      console.log(`  ✅ [${inserted}] ${b.booking_number} → contract_id: ${contractId}`);
    }

    console.log(`\n✨ 완료: ${inserted}건 추가, ${skipped}건 건너뜀 (이미 계약 존재)`);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

seedContractsFromBookings()
  .then(() => {
    console.log('\n✅ 작업 완료!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ 작업 실패:', err);
    process.exit(1);
  });
