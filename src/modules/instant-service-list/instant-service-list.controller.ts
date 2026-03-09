import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InstantServiceListService } from './instant-service-list.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('instant_service_list')
@Controller('instant_service_list')
export class InstantServiceListController {
  constructor(private readonly instantServiceListService: InstantServiceListService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Get instant service list',
    description: 'instant_service_list 테이블에서 is_active = true 인 항목만 display_order 순으로 반환합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '활성 서비스 목록',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'General Cleaning' },
          isActive: { type: 'boolean', example: true },
          displayOrder: { type: 'number', example: 1 },
          iconUrl: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  findAll() {
    return this.instantServiceListService.findAllActive();
  }
}
