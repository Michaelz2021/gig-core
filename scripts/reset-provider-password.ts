import { DataSource } from 'typeorm';
import { User } from '../src/modules/users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

// .env 파일 로드
dotenv.config({ path: path.join(__dirname, '../.env') });

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'trusttrade',
  password: process.env.DB_PASSWORD || 'secure_password_123',
  database: process.env.DB_DATABASE || 'ai_trusttrade',
  entities: [User],
});

async function resetProviderPassword() {
  try {
    await dataSource.initialize();
    console.log('✅ 데이터베이스 연결 성공');

    const userRepository = dataSource.getRepository(User);

    // Provider 사용자 찾기
    const provider = await userRepository.findOne({
      where: { email: 'provider@example.com' },
    });

    if (!provider) {
      console.error('❌ provider@example.com 사용자를 찾을 수 없습니다.');
      process.exit(1);
    }

    console.log('📋 현재 사용자 정보:');
    console.log(`   이메일: ${provider.email}`);
    console.log(`   상태: ${provider.status}`);
    console.log(`   이메일 인증: ${provider.isEmailVerified}`);
    console.log(`   전화번호 인증: ${provider.isPhoneVerified}`);
    console.log(`   활성화: ${provider.isActive}`);

    // 비밀번호를 Test1234!로 재설정
    const newPassword = 'Test1234!';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    provider.password = hashedPassword;
    // 상태도 확인하고 필요시 활성화
    provider.status = 'active' as any;
    provider.isEmailVerified = true;
    provider.isPhoneVerified = true;
    
    await userRepository.save(provider);

    console.log('\n✅ 비밀번호 재설정 완료');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('이메일: provider@example.com');
    console.log('비밀번호: Test1234!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await dataSource.destroy();
    console.log('\n✅ 완료!');
  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }
}

resetProviderPassword();
