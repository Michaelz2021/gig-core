import { Module, Global, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('RedisModule');
        const redisEnabled = configService.get<string>('REDIS_ENABLED', 'true') === 'true';

        if (!redisEnabled) {
          logger.warn('Redis is disabled. Some features may not work properly.');
          return null;
        }

        try {
          const host = configService.get<string>('REDIS_HOST') || 'localhost';
          const port = Number(configService.get<number>('REDIS_PORT')) || 6379;

          const client = createClient({
            url: `redis://${host}:${port}`,
            socket: {
              connectTimeout: 5000,
              reconnectStrategy(retries) {
                if (retries > 20) return new Error('Redis max reconnect retries');
                return Math.min(1000 * 2 ** retries, 10000);
              },
            },
          });

          client.on('error', (err) => {
            logger.warn(`Redis client error: ${err.message}`);
          });

          client.on('connect', () => {
            logger.log(`Redis connected to ${host}:${port}`);
          });

          // 연결 시도 (5초 타임아웃)
          await Promise.race([
            client.connect(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Connection timeout')), 5000)
            ),
          ]);
          
          logger.log('Redis client connected successfully');
          return client;
        } catch (error) {
          logger.warn(`Redis connection failed: ${error.message}`);
          logger.warn('Application will continue without Redis. Some features may be limited.');
          return null;
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
