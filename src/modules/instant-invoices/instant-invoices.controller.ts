import { Controller, Get, Post, Body, UseGuards, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody, ApiOkResponse, ApiExtraModels, ApiQuery } from '@nestjs/swagger';
import { getSchemaPath } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { InstantInvoicesService } from './instant-invoices.service';
import { CreateInstantInvoiceDto } from './dto/create-instant-invoice.dto';
import { InstantInvoiceResponseDto } from './dto/instant-invoice-response.dto';

@ApiTags('instant-invoices')
@Controller('instant-invoices')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiExtraModels(InstantInvoiceResponseDto)
export class InstantInvoicesController {
  constructor(private readonly instantInvoicesService: InstantInvoicesService) {}

  @Get()
  @ApiOperation({
    summary: 'List my instant invoices',
    description:
      'JWT 사용자 기준으로 instant invoice 목록 조회. user_type으로 consumer(주문한 내역) 또는 provider(받은 주문 내역) 중 하나를 지정해야 합니다. 최신순.',
  })
  @ApiQuery({
    name: 'user_type',
    required: true,
    enum: ['consumer', 'provider'],
    description: 'consumer: 내가 주문한 인보이스(consumer_id 기준). provider: 내가 받은 주문 인보이스(provider_id 기준).',
  })
  @ApiOkResponse({
    description: '지정한 user_type에 해당하는 instant invoice 목록. 최신순.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(InstantInvoiceResponseDto) },
        },
      },
    },
  })
  async findAll(
    @GetUser() user: { id: string },
    @Query('user_type') userType: string,
  ) {
    if (!userType || !['consumer', 'provider'].includes(userType)) {
      throw new BadRequestException(
        'user_type query is required and must be "consumer" or "provider".',
      );
    }
    const list = await this.instantInvoicesService.findAllByUserAndType(
      user.id,
      userType as 'consumer' | 'provider',
    );
    return { success: true, data: list };
  }

  @Post()
  @ApiOperation({
    summary: 'Create instant invoice (Order Now)',
    description:
      'Order Now에서 프로바이더 선택 후 Order 눌렀을 때 인보이스 한 건 생성. 결제 플로우에 쓸 id 반환. consumer_id는 JWT에서 채우거나 body로 받아 검증.',
  })
  @ApiBody({ type: CreateInstantInvoiceDto })
  @ApiResponse({
    status: 201,
    description: 'Instant invoice created',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            total_amount: { type: 'number', example: 811.37 },
            payment_status: { type: 'string', example: 'pending' },
            booking_status: { type: 'string', example: 'confirmed' },
            created_at: { type: 'string', format: 'date-time' },
            listing_name: { type: 'string', description: '서비스 리스팅명' },
            consumer_name: { type: 'string', description: '주문자 표시명' },
            provider_name: { type: 'string', description: '프로바이더 표시명' },
            service_address_option: { type: 'string', enum: ['Home', 'On Site'], description: '서비스 장소 옵션' },
          },
        },
      },
    },
  })
  async create(@Body() dto: CreateInstantInvoiceDto, @GetUser() user: any) {
    const data = await this.instantInvoicesService.create(dto, user.id);
    return { success: true, data };
  }
}
