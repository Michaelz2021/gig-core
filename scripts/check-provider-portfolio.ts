import { DataSource } from 'typeorm';
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
  entities: [Provider, User],
});

async function checkProviderPortfolio() {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await dataSource.initialize();
    console.log('✅ 데이터베이스 연결 성공\n');

    const userRepository = dataSource.getRepository(User);

    // provider@example.com 사용자의 Provider 레코드 찾기
    const user = await userRepository.findOne({
      where: { email: 'provider@example.com' },
    });

    if (!user) {
      console.log('❌ provider@example.com 사용자를 찾을 수 없습니다.');
      await dataSource.destroy();
      return;
    }

    console.log(`📋 사용자 정보:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}\n`);

    // Raw query로 직접 조회
    const providerResult = await queryRunner.query(
      `SELECT * FROM providers WHERE user_id = $1`,
      [user.id]
    );

    if (!providerResult || providerResult.length === 0) {
      console.log('⚠️  Provider 레코드가 존재하지 않습니다.');
      console.log('   providers 테이블은 존재하지만, 이 사용자에 대한 레코드가 없습니다.\n');
    } else {
      const provider = providerResult[0];
      console.log('✅ Provider 레코드 발견!\n');
      console.log('📊 Provider 데이터 구조:');
      console.log(JSON.stringify(provider, null, 2));
      console.log('\n');
      
      if (provider.portfolio_photos) {
        console.log('📸 포트폴리오 사진 데이터:');
        const portfolioData = typeof provider.portfolio_photos === 'string' 
          ? JSON.parse(provider.portfolio_photos)
          : provider.portfolio_photos;
        console.log(JSON.stringify(portfolioData, null, 2));
      } else {
        console.log('⚠️  포트폴리오 사진 데이터가 없습니다.');
      }
    }

    // 테이블 스키마 확인
    console.log('\n📋 providers 테이블 스키마 정보:');
    const tableInfo = await queryRunner.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'providers'
      ORDER BY ordinal_position;
    `);
    
    console.table(tableInfo);

    // portfolio_photos 컬럼이 있는지 확인
    const portfolioColumn = tableInfo.find((col: any) => 
      col.column_name === 'portfolio_photos' || col.column_name === 'portfolioPhotos'
    );

    if (portfolioColumn) {
      console.log('\n✅ portfolio_photos 컬럼이 존재합니다!');
      console.log(`   데이터 타입: ${portfolioColumn.data_type}`);
      console.log(`   Nullable: ${portfolioColumn.is_nullable}`);
    } else {
      console.log('\n⚠️  portfolio_photos 컬럼을 찾을 수 없습니다.');
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

checkProviderPortfolio();
