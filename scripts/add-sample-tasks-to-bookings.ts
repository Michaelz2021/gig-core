import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

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

/**
 * service_description을 기반으로 task를 생성하는 함수
 */
function generateTaskFromDescription(serviceDescription: string | null): string | null {
  if (!serviceDescription) {
    return null;
  }

  // service_description을 기반으로 task 생성
  // 예: "홈 클리닝 서비스" -> "1. 거실 및 침실 청소\n2. 화장실 청소\n3. 주방 청소\n4. 쓰레기 처리"
  
  const desc = serviceDescription.toLowerCase();
  
  // 다양한 서비스 유형에 따라 task 생성
  if (desc.includes('cleaning') || desc.includes('청소') || desc.includes('클리닝')) {
    return `1. 거실 및 침실 청소
2. 화장실 청소 및 소독
3. 주방 청소 및 정리
4. 쓰레기 처리 및 재활용품 분리`;
  } else if (desc.includes('plumbing') || desc.includes('배관') || desc.includes('수리')) {
    return `1. 문제 진단 및 원인 파악
2. 필요한 부품 교체 또는 수리
3. 누수 확인 및 테스트
4. 작업 완료 후 정리 및 청소`;
  } else if (desc.includes('electrical') || desc.includes('전기') || desc.includes('배선')) {
    return `1. 전기 시스템 점검 및 진단
2. 안전한 배선 작업 수행
3. 전기 코드 및 콘센트 교체
4. 최종 안전 점검 및 테스트`;
  } else if (desc.includes('painting') || desc.includes('페인팅') || desc.includes('도색')) {
    return `1. 벽면 준비 및 프라이머 도포
2. 페인트 도색 작업
3. 마무리 코팅 및 정리
4. 작업 완료 후 청소`;
  } else if (desc.includes('gardening') || desc.includes('정원') || desc.includes('조경')) {
    return `1. 잔디 깎기 및 정리
2. 잡초 제거 및 가지치기
3. 식물 심기 및 물주기
4. 정원 쓰레기 수거`;
  } else if (desc.includes('moving') || desc.includes('이사') || desc.includes('이동')) {
    return `1. 포장 및 박스 준비
2. 가구 및 물품 운반
3. 새 집에서 물품 배치
4. 포장재 정리 및 청소`;
  } else if (desc.includes('cooking') || desc.includes('요리') || desc.includes('쿠킹')) {
    return `1. 재료 준비 및 세척
2. 요리 준비 및 조리
3. 음식 배치 및 서빙
4. 주방 정리 및 설거지`;
  } else if (desc.includes('tutoring') || desc.includes('과외') || desc.includes('교육')) {
    return `1. 학습 목표 설정 및 계획 수립
2. 개념 설명 및 예제 풀이
3. 연습 문제 풀이 및 피드백
4. 다음 수업 준비 및 숙제 확인`;
  } else {
    // 일반적인 task 템플릿
    return `1. 초기 상담 및 요구사항 확인
2. 서비스 계획 수립 및 실행
3. 진행 상황 점검 및 조정
4. 최종 완료 확인 및 정리`;
  }
}

async function addSampleTasksToBookings() {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await dataSource.initialize();
    console.log('✅ 데이터베이스 연결 성공\n');

    // 먼저 task 컬럼이 있는지 확인하고 없으면 추가
    console.log('📋 task 컬럼 확인 중...');
    const columnExists = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'bookings' AND column_name = 'task'
    `);

    if (columnExists.length === 0) {
      console.log('➕ task 컬럼 추가 중...');
      await queryRunner.query(`
        ALTER TABLE bookings 
        ADD COLUMN IF NOT EXISTS task TEXT;
      `);
      await queryRunner.query(`
        COMMENT ON COLUMN bookings.task IS '서비스 작업 내용 (계약서에서 명문화될 수 있는 경우)';
      `);
      console.log('✅ task 컬럼 추가 완료\n');
    } else {
      console.log('✅ task 컬럼이 이미 존재합니다.\n');
    }

    // service_description이 있고 task가 없는 bookings 조회
    const bookings = await queryRunner.query(`
      SELECT 
        id, 
        booking_number,
        service_description
      FROM bookings
      WHERE service_description IS NOT NULL 
        AND service_description != ''
        AND (task IS NULL OR task = '')
      ORDER BY created_at DESC
      LIMIT 10
    `);

    console.log(`📋 ${bookings.length}개의 booking을 찾았습니다.\n`);

    if (bookings.length === 0) {
      console.log('⚠️  업데이트할 booking이 없습니다.');
      return;
    }

    // 각 booking에 대해 task 생성 및 업데이트
    let updatedCount = 0;
    const sampleCount = Math.min(4, bookings.length); // 최대 4개만 업데이트

    for (let i = 0; i < sampleCount; i++) {
      const booking = bookings[i];
      const task = generateTaskFromDescription(booking.service_description);

      if (task) {
        await queryRunner.query(
          `UPDATE bookings SET task = $1 WHERE id = $2`,
          [task, booking.id]
        );
        
        console.log(`✅ [${i + 1}/${sampleCount}] Booking ${booking.booking_number || booking.id} 업데이트 완료`);
        console.log(`   Task: ${task.split('\n')[0]}...\n`);
        updatedCount++;
      }
    }

    console.log(`\n✨ 총 ${updatedCount}개의 booking에 task가 추가되었습니다.`);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

// 스크립트 실행
addSampleTasksToBookings()
  .then(() => {
    console.log('\n✅ 작업 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 작업 실패:', error);
    process.exit(1);
  });

