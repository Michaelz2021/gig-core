import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody, ApiOkResponse, ApiExtraModels } from '@nestjs/swagger';
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
      'JWT user_id로 본인이 consumer이거나 provider인 instant invoice 목록 조회. consumer_id = user_id 또는 provider_id = (해당 user의 provider id). 최신순.',
  })
  @ApiOkResponse({
    description: '본인(consumer 또는 provider) 관련 instant invoice 목록. 최신순.',
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
  async findAll(@GetUser() user: { id: string }) {
    const list = await this.instantInvoicesService.findAllByUserId(user.id);
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
