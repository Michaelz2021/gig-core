import { DataSource } from 'typeorm';
import { RewardCredit } from '../src/modules/rewards/entities/reward-credit.entity';
import { RewardCreditTransaction, RewardCreditTransactionType } from '../src/modules/payments/entities/reward-credit-transaction.entity';
import { User } from '../src/modules/users/entities/user.entity';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

async function seedRewardCredits() {
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

    const rewardCreditRepository = dataSource.getRepository(RewardCredit);
    const transactionRepository = dataSource.getRepository(RewardCreditTransaction);
    const userRepository = dataSource.getRepository(User);

    // 사용자 목록 가져오기 (최대 10명)
    console.log('\n🔍 사용자 목록 조회 중...');
    const users = await userRepository.find({
      take: 10,
      order: { createdAt: 'DESC' },
    });

    if (users.length === 0) {
      console.log('⚠️  사용자가 없습니다. 먼저 사용자를 생성해주세요.');
      return;
    }

    console.log(`✅ ${users.length}명의 사용자 발견`);

    // 각 사용자에 대해 리워드 크레딧 계정 및 거래 내역 생성
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(`\n📝 사용자 ${i + 1}/${users.length}: ${user.email || user.id}`);

      // 리워드 크레딧 계정 확인 또는 생성
      let rewardCredit = await rewardCreditRepository.findOne({
        where: { userId: user.id },
      });

      if (!rewardCredit) {
        rewardCredit = rewardCreditRepository.create({
          userId: user.id,
          balance: 0,
        });
        rewardCredit = await rewardCreditRepository.save(rewardCredit);
        console.log(`  ✓ 리워드 크레딧 계정 생성됨`);
      } else {
        console.log(`  ✓ 기존 리워드 크레딧 계정 사용 (잔액: ${rewardCredit.balance})`);
      }

      // 기존 거래 내역 확인
      const existingTransactions = await transactionRepository.count({
        where: { userId: user.id },
      });

      if (existingTransactions > 0) {
        console.log(`  ⚠️  이미 ${existingTransactions}개의 거래 내역이 있습니다. 건너뜁니다.`);
        continue;
      }

      // 샘플 거래 내역 생성
      let currentBalance = rewardCredit.balance;
      const transactions: Partial<RewardCreditTransaction>[] = [];

      // 1. 초기 보너스 (첫 가입 보너스)
      const bonusAmount = Math.floor(Math.random() * 50) + 20; // 20-70 크레딧
      transactions.push({
        userId: user.id,
        transactionType: RewardCreditTransactionType.BONUS,
        creditsChange: bonusAmount,
        creditsBefore: currentBalance,
        creditsAfter: currentBalance + bonusAmount,
        reason: 'Welcome bonus',
        description: '신규 가입 보너스',
      });
      currentBalance += bonusAmount;

      // 2. 구매 (1-3회)
      const purchaseCount = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < purchaseCount; j++) {
        const purchaseAmount = Math.floor(Math.random() * 200) + 50; // 50-250 크레딧
        transactions.push({
          userId: user.id,
          transactionType: RewardCreditTransactionType.PURCHASED,
          creditsChange: purchaseAmount,
          creditsBefore: currentBalance,
          creditsAfter: currentBalance + purchaseAmount,
          reason: 'Credit purchase',
          description: `${purchaseAmount} 크레딧 구매`,
        });
        currentBalance += purchaseAmount;
      }

      // 3. 사용 (입찰 등, 0-5회)
      const spendCount = Math.floor(Math.random() * 6);
      for (let j = 0; j < spendCount && currentBalance > 0; j++) {
        const spendAmount = Math.min(
          Math.floor(Math.random() * 20) + 5, // 5-25 크레딧
          currentBalance,
        );
        transactions.push({
          userId: user.id,
          transactionType: RewardCreditTransactionType.SPENT,
          creditsChange: -spendAmount,
          creditsBefore: currentBalance,
          creditsAfter: currentBalance - spendAmount,
          reason: 'Auction bid',
          description: `경매 입찰에 ${spendAmount} 크레딧 사용`,
        });
        currentBalance -= spendAmount;
      }

      // 4. 획득 (작업 완료 보상 등, 0-3회)
      const earnCount = Math.floor(Math.random() * 4);
      for (let j = 0; j < earnCount; j++) {
        const earnAmount = Math.floor(Math.random() * 30) + 10; // 10-40 크레딧
        transactions.push({
          userId: user.id,
          transactionType: RewardCreditTransactionType.EARNED,
          creditsChange: earnAmount,
          creditsBefore: currentBalance,
          creditsAfter: currentBalance + earnAmount,
          reason: 'Job completion',
          description: `작업 완료 보상 ${earnAmount} 크레딧`,
        });
        currentBalance += earnAmount;
      }

      // 거래 내역 저장 (시간 간격을 두고)
      console.log(`  📊 ${transactions.length}개의 거래 내역 생성 중...`);
      for (let j = 0; j < transactions.length; j++) {
        const transaction = transactionRepository.create({
          ...transactions[j],
          createdAt: new Date(Date.now() - (transactions.length - j) * 3600000), // 1시간 간격
        });
        await transactionRepository.save(transaction);
      }

      // 최종 잔액 업데이트
      rewardCredit.balance = currentBalance;
      await rewardCreditRepository.save(rewardCredit);

      console.log(`  ✅ 완료: 최종 잔액 ${currentBalance} 크레딧`);
    }

    console.log('\n📊 전체 통계:');
    const totalAccounts = await rewardCreditRepository.count();
    const totalTransactions = await transactionRepository.count();
    const totalBalance = await rewardCreditRepository
      .createQueryBuilder('rc')
      .select('SUM(rc.balance)', 'total')
      .getRawOne();

    console.log(`  - 리워드 크레딧 계정: ${totalAccounts}개`);
    console.log(`  - 총 거래 내역: ${totalTransactions}개`);
    console.log(`  - 총 잔액: ${totalBalance?.total || 0} 크레딧`);

    console.log('\n✅ 샘플 데이터 생성 완료');
  } catch (error) {
    console.error('❌ 샘플 데이터 생성 중 오류 발생:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

// 스크립트 실행
seedRewardCredits()
  .then(() => {
    console.log('\n✅ 스크립트 실행 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 스크립트 실행 실패:', error);
    process.exit(1);
  });

