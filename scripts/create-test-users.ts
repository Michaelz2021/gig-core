import { DataSource } from 'typeorm';
import { User, UserType } from '../src/modules/users/entities/user.entity';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'trusttrade',
  password: process.env.DB_PASSWORD || 'secure_password_123',
  database: process.env.DB_DATABASE || 'ai_trusttrade',
  entities: [User],
});

async function createTestUsers() {
  try {
    await dataSource.initialize();
    console.log('✅ 데이터베이스 연결 성공');

    const userRepository = dataSource.getRepository(User);

    // 테스트 사용자들
    const testUsers = [
      {
        email: 'test@example.com',
        phone: '+639123456789',
        password: 'Test1234!',
        firstName: 'Test',
        lastName: 'User',
        userType: UserType.CONSUMER,
        isEmailVerified: true,
        isPhoneVerified: true,
        isActive: true,
      },
      {
        email: 'provider@example.com',
        phone: '+639123456790',
        password: 'Provider1234!',
        firstName: 'Provider',
        lastName: 'User',
        userType: UserType.PROVIDER,
        isEmailVerified: true,
        isPhoneVerified: true,
        isActive: true,
      },
      {
        email: 'both@example.com',
        phone: '+639123456791',
        password: 'Both1234!',
        firstName: 'Both',
        lastName: 'User',
        userType: UserType.BOTH,
        isEmailVerified: true,
        isPhoneVerified: true,
        isActive: true,
      },
    ];

    for (const userData of testUsers) {
      const existingUser = await userRepository.findOne({
        where: { email: userData.email },
      });

      if (existingUser) {
        console.log(`⚠️  사용자 ${userData.email} 이미 존재함 - 건너뜀`);
        continue;
      }

      const user = userRepository.create({
        ...userData,
        // 엔티티의 @BeforeInsert 훅에서 비밀번호를 해시하므로 여기서는 평문 유지
      });

      await userRepository.save(user);
      console.log(`✅ 사용자 생성: ${userData.email} (${userData.userType})`);
    }

    console.log('\n📋 테스트 로그인 크레덴셜:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. 소비자 (Consumer):');
    console.log('   이메일: test@example.com');
    console.log('   비밀번호: Test1234!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('2. 제공자 (Provider):');
    console.log('   이메일: provider@example.com');
    console.log('   비밀번호: Provider1234!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('3. 양쪽 모두 (Both):');
    console.log('   이메일: both@example.com');
    console.log('   비밀번호: Both1234!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await dataSource.destroy();
    console.log('\n✅ 완료!');
  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }
}

createTestUsers();

