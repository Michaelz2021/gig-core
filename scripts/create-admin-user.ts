import { DataSource } from 'typeorm';
import { User, UserType, UserStatus, KYCLevel } from '../src/modules/users/entities/user.entity';
import * as bcrypt from 'bcrypt';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'trusttrade',
  password: process.env.DB_PASSWORD || 'zxcqwe123$',
  database: process.env.DB_DATABASE || 'ai_trusttrade',
  entities: [User],
});

async function createAdminUser() {
  try {
    await dataSource.initialize();
    console.log('✅ Database connection successful');

    const userRepository = dataSource.getRepository(User);

    // Check if admin user already exists
    const existingAdmin = await userRepository.findOne({
      where: { email: 'admin@example.com' },
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists. Updating password...');
      const hashedPassword = await bcrypt.hash('Test1234!', 12);
      existingAdmin.password = hashedPassword;
      existingAdmin.status = UserStatus.ACTIVE;
      existingAdmin.isEmailVerified = true;
      await userRepository.save(existingAdmin);
      console.log('✅ Admin password updated');
      console.log('Email: admin@example.com');
      console.log('Password: Test1234!');
    } else {
      // Create admin user - use raw query to avoid bio column issue
      const hashedPassword = await bcrypt.hash('Test1234!', 12);
      await userRepository.query(
        `INSERT INTO users (email, phone, password_hash, first_name, last_name, user_type, status, is_email_verified, is_phone_verified, kyc_level, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
         ON CONFLICT (email) DO UPDATE SET
           password_hash = $3,
           status = $7,
           is_email_verified = $8,
           is_phone_verified = $9,
           updated_at = NOW()
         RETURNING id, email, first_name, last_name`,
        [
          'admin@example.com',
          '+639000000000',
          hashedPassword,
          'Admin',
          'User',
          UserType.CONSUMER,
          UserStatus.ACTIVE,
          true,
          true,
          KYCLevel.BASIC,
        ],
      );
      console.log('✅ Admin user created successfully');
      console.log('Email: admin@example.com');
      console.log('Password: Test1234!');
    }

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createAdminUser();

