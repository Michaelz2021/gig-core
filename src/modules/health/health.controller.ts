import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: any,
    private readonly dataSource: DataSource,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check' })
  async check() {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'ai-trusttrade-core-service',
      version: '1.0.0',
      info: {
        database: { status: 'unknown' },
        redis: { status: 'unknown' },
      },
    };

    // Check database
    try {
      await this.dataSource.query('SELECT 1');
      health.info.database.status = 'up';
    } catch (error) {
      health.info.database.status = 'down';
      health.status = 'error';
    }

    // Check Redis
    if (this.redisClient) {
      try {
        await this.redisClient.ping();
        health.info.redis.status = 'up';
      } catch (error) {
        health.info.redis.status = 'down';
        health.status = 'error';
      }
    } else {
      health.info.redis.status = 'disabled';
    }

    return health;
  }
}
