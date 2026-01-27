import { DataSource } from 'typeorm';
import { AuctionBid } from '../src/modules/matching/entities/auction-bid.entity';
import { Auction } from '../src/modules/matching/entities/auction.entity';
import { Provider } from '../src/modules/users/entities/provider.entity';
import { User } from '../src/modules/users/entities/user.entity';
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
  entities: [AuctionBid, Auction, Provider, User],
});

async function checkAuctionBidsProviderId() {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await dataSource.initialize();
    console.log('✅ 데이터베이스 연결 성공\n');

    // auction_bids와 providers, users 테이블 조인하여 확인
    const bids = await queryRunner.query(`
      SELECT 
        ab.id as bid_id,
        ab.auction_id,
        ab.provider_id as auction_bid_provider_id,
        ab.proposed_price,
        ab.status as bid_status,
        ab.created_at as bid_created_at,
        p.id as provider_table_id,
        p.user_id as provider_user_id,
        u.id as user_table_id,
        u.email as user_email,
        u.first_name,
        u.last_name,
        CASE 
          WHEN ab.provider_id = p.id THEN '✅ 정상 (auction_bids.provider_id = providers.id)'
          ELSE '❌ 오류 (auction_bids.provider_id ≠ providers.id)'
        END as provider_id_check,
        CASE 
          WHEN p.user_id = u.id THEN '✅ 정상 (providers.user_id = users.id)'
          ELSE '❌ 오류 (providers.user_id ≠ users.id)'
        END as user_id_check,
        CASE 
          WHEN ab.provider_id = u.id THEN '⚠️  주의 (auction_bids.provider_id = users.id) - 잘못된 관계!'
          ELSE '✅ 정상 (auction_bids.provider_id ≠ users.id)'
        END as direct_user_id_check
      FROM auction_bids ab
      LEFT JOIN providers p ON ab.provider_id = p.id
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY ab.created_at DESC
      LIMIT 50
    `);

    if (bids.length === 0) {
      console.log('⚠️  auction_bids 테이블에 데이터가 없습니다.\n');
      await queryRunner.release();
      await dataSource.destroy();
      return;
    }

    console.log(`📊 총 ${bids.length}개의 auction_bid 레코드를 찾았습니다.\n`);
    console.log('='.repeat(120));

    let correctCount = 0;
    let incorrectCount = 0;
    let missingProviderCount = 0;
    let wrongDirectUserIdCount = 0;

    bids.forEach((bid: any, index: number) => {
      console.log(`\n[${index + 1}] Bid ID: ${bid.bid_id}`);
      console.log('-'.repeat(120));
      console.log('📋 관계 확인:');
      console.log(`   auction_bids.provider_id: ${bid.auction_bid_provider_id}`);
      console.log(`   providers.id:            ${bid.provider_table_id || 'NULL (없음)'}`);
      console.log(`   providers.user_id:       ${bid.provider_user_id || 'NULL (없음)'}`);
      console.log(`   users.id:                 ${bid.user_table_id || 'NULL (없음)'}`);
      console.log(`\n   ${bid.provider_id_check}`);
      console.log(`   ${bid.user_id_check}`);
      console.log(`   ${bid.direct_user_id_check}`);
      
      if (!bid.provider_table_id) {
        console.log(`   ❌ 문제: auction_bids.provider_id가 providers 테이블에 존재하지 않습니다!`);
        missingProviderCount++;
        incorrectCount++;
      } else if (bid.auction_bid_provider_id === bid.user_table_id) {
        console.log(`   ❌ 문제: auction_bids.provider_id가 users.id와 직접 일치합니다!`);
        console.log(`   ⚠️  이것은 잘못된 관계입니다. auction_bids.provider_id는 providers.id를 참조해야 합니다.`);
        wrongDirectUserIdCount++;
        incorrectCount++;
      } else if (bid.auction_bid_provider_id === bid.provider_table_id && bid.provider_user_id === bid.user_table_id) {
        correctCount++;
      } else {
        incorrectCount++;
      }

      if (bid.user_email) {
        console.log(`\n👤 사용자 정보:`);
        console.log(`   이름: ${bid.first_name} ${bid.last_name}`);
        console.log(`   이메일: ${bid.user_email}`);
      }
      console.log(`\n💰 입찰 정보:`);
      console.log(`   제안 가격: ${bid.proposed_price || 'N/A'}`);
      console.log(`   상태: ${bid.bid_status || 'N/A'}`);
      console.log(`   생성일: ${bid.bid_created_at || 'N/A'}`);
      console.log('='.repeat(120));
    });

    // 요약 정보
    console.log(`\n\n${'='.repeat(120)}`);
    console.log('📊 요약 정보');
    console.log('='.repeat(120));
    console.log(`총 Bid 수: ${bids.length}개`);
    console.log(`✅ 정상 관계: ${correctCount}개`);
    console.log(`❌ 문제 있는 관계: ${incorrectCount}개`);
    console.log(`   - providers 테이블에 없는 provider_id: ${missingProviderCount}개`);
    console.log(`   - users.id와 직접 일치하는 provider_id: ${wrongDirectUserIdCount}개`);
    console.log('='.repeat(120));

    // 문제가 있는 경우 상세 정보
    if (incorrectCount > 0) {
      console.log(`\n⚠️  문제가 발견되었습니다!\n`);
      console.log('설명:');
      console.log('- auction_bids.provider_id는 providers.id를 참조해야 합니다.');
      console.log('- providers.user_id는 users.id를 참조합니다.');
      console.log('- 따라서 auction_bids.provider_id ≠ users.id 여야 합니다.');
      console.log('\n올바른 관계:');
      console.log('  users.id → providers.user_id → providers.id → auction_bids.provider_id');
    }

    await queryRunner.release();
    await dataSource.destroy();
  } catch (error) {
    console.error('❌ 오류:', error);
    await queryRunner.release();
    await dataSource.destroy();
    process.exit(1);
  }
}

checkAuctionBidsProviderId();

