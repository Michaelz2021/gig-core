import { Controller, Get, Post, UseGuards, Query, Body, Param, NotImplementedException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { PaymentsService } from './payments.service';

@ApiTags('payout')
@Controller('payout')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class PayoutController {
  constructor(private readonly paymentsService: PaymentsService) {}
  /**
   * GET /api/v1/payout/summary
   * Provider의 출금 요약 + 출금 가능 목록 + 최근 출금 내역
   */
  @Get('summary')
  @ApiOperation({
    summary: 'Get provider payout summary',
    description:
      '성공 시 200과 success: true, data 안에 summary/available_payouts/recent_payouts를 반환합니다. 인증 실패 시에만 401/403이 나옵니다.',
  })
  @ApiOkResponse({
    status: 200,
    description: '성공 — success: true, data에 출금 요약·출금 가능 목록·최근 출금 내역',
    schema: {
      type: 'object',
      required: ['success', 'data'],
      properties: {
        success: { type: 'boolean', example: true, description: '항상 true (성공 시)' },
        data: {
          type: 'object',
          properties: {
            summary: {
              type: 'object',
              properties: {
                total_available: { type: 'number', example: 3500.0 },
                pending_amount: { type: 'number', example: 1200.0 },
                ready_count: { type: 'number', example: 3 },
                pending_count: { type: 'number', example: 1 },
              },
            },
            available_payouts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  payout_id: { type: 'string' },
                  booking_number: { type: 'string' },
                  service_name: { type: 'string' },
                  amount: { type: 'number' },
                  status: { type: 'string', example: 'available' },
                  completed_at: { type: 'string', format: 'date-time', nullable: true },
                  contract_id: { type: 'string' },
                  escrow_id: { type: 'string' },
                },
              },
            },
            recent_payouts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  payout_id: { type: 'string' },
                  booking_number: { type: 'string' },
                  amount: { type: 'number' },
                  paid_at: { type: 'string', format: 'date-time', nullable: true },
                },
              },
            },
          },
        },
      },
      example: {
        success: true,
        data: {
          summary: { total_available: 3500.0, pending_amount: 0, ready_count: 3, pending_count: 0 },
          available_payouts: [],
          recent_payouts: [],
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized — 토큰 없음/만료 (실패)' })
  @ApiResponse({ status: 403, description: 'Forbidden — 권한 없음 (실패)' })
  getPayoutSummary(@GetUser() user: any) {
    return this.paymentsService.getPayoutSummary(user.id);
  }

  /**
   * GET /api/v1/payout/available
   * 출금 가능한 booking/escrow 목록
   */
  @Get('available')
  @ApiOperation({
    summary: 'Get available payouts',
    description: '출금 가능한(완료 + consumer 승인 완료, 아직 Xendit disbursement 되지 않은) 건들의 목록을 반환합니다.',
  })
  @ApiOkResponse({
    description: 'Available payouts returned',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              payout_id: { type: 'string', example: 'PO-BOOK-1770436511571-SKNP2R5QV' },
              booking_number: { type: 'string', example: 'BOOK-1770436511571-SKNP2R5QV' },
              service_name: { type: 'string', example: 'Home Cleaning' },
              amount: { type: 'number', example: 470.8 },
              status: { type: 'string', example: 'available' },
              completed_at: { type: 'string', format: 'date-time' },
              available_from: { type: 'string', format: 'date-time' },
              contract_id: { type: 'string', example: 'CON-12345' },
              escrow_id: { type: 'string', example: 'ESC-12345' },
            },
          },
        },
      },
    },
  })
  getAvailablePayouts(@GetUser() _user: any) {
    // TODO: EscrowAccount + Bookings 조인으로 구현
    throw new NotImplementedException('Available payouts API is not implemented yet.');
  }

  /**
   * GET /api/v1/payout/history
   * 과거 출금(disbursement/payout) 히스토리
   */
  @Get('history')
  @ApiOperation({
    summary: 'Get payout history',
    description: '완료된 출금(payout/disbursement) 내역을 페이지네이션하여 반환합니다.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiOkResponse({
    description: 'Payout history returned',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              payout_id: { type: 'string', example: 'PO-1735123456789' },
              booking_number: { type: 'string', example: 'BOOK-1770000000000-ABCDE1234' },
              amount: { type: 'number', example: 820.5 },
              paid_at: { type: 'string', format: 'date-time' },
              xendit_disbursement_id: { type: 'string', example: 'disb-1234567890' },
              method: { type: 'string', example: 'gcash' },
              account_reference: { type: 'string', example: '09XXXXXXXXX' },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 20 },
            total: { type: 'number', example: 42 },
            total_pages: { type: 'number', example: 3 },
          },
        },
      },
    },
  })
  getPayoutHistory(
    @GetUser() _user: any,
    @Query('page') _page?: number,
    @Query('limit') _limit?: number,
  ) {
    // TODO: payouts + disbursements 기준으로 구현
    throw new NotImplementedException('Payout history API is not implemented yet.');
  }

  /**
   * POST /api/v1/payout/request
   * 선택한 booking/escrow 들에 대해 출금 요청
   */
  @Post('request')
  @ApiOperation({
    summary: 'Request payout for selected bookings',
    description:
      'provider가 선택한 booking/escrow 들에 대해 출금을 요청합니다. 내부적으로 payouts + escrow_accounts 상태를 갱신하고 Xendit disbursement를 생성합니다.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        booking_ids: {
          type: 'array',
          items: { type: 'string', format: 'uuid' },
          description: '출금 요청할 booking ID 목록 (UUID)',
        },
        payment_method: {
          type: 'string',
          example: 'gcash',
          description: '출금 수단 (예: gcash, bank_transfer 등)',
        },
        account_details: {
          type: 'object',
          description: 'Xendit로 전달할 계좌/이월렛 정보',
          additionalProperties: true,
          example: {
            ewallet_type: 'GCASH',
            phone_number: '09XXXXXXXXX',
          },
        },
      },
      required: ['booking_ids'],
    },
  })
  @ApiOkResponse({
    description: 'Payout request accepted',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            payout_id: { type: 'string', example: 'PO-1735123456789' },
            amount: { type: 'number', example: 1500.0 },
            booking_count: { type: 'number', example: 3 },
            status: { type: 'string', example: 'PROCESSING' },
            estimated_completion: { type: 'string', example: '1-2 business days' },
          },
        },
      },
    },
  })
  requestPayout(@GetUser() _user: any, @Body() _body: any) {
    // TODO: escrow_accounts에서 eligible escrows 조회 → payouts 생성 → Xendit disbursement 요청
    throw new NotImplementedException('Payout request API is not implemented yet.');
  }

  /**
   * GET /api/v1/payout/:payoutId
   * 특정 payout 상세 조회
   */
  @Get(':payoutId')
  @ApiOperation({
    summary: 'Get payout details',
    description: '특정 payout(출금 요청)의 상세 정보와 연결된 booking/escrow 정보를 반환합니다.',
  })
  @ApiParam({ name: 'payoutId', type: String, example: 'PO-1735123456789' })
  @ApiOkResponse({
    description: 'Payout details returned',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            payout_id: { type: 'string', example: 'PO-1735123456789' },
            user_id: { type: 'string', format: 'uuid', description: 'JWT sub (provider user id)' },
            amount: { type: 'number', example: 1500.0 },
            currency: { type: 'string', example: 'PHP' },
            status: { type: 'string', example: 'COMPLETED' },
            xendit_disbursement_id: { type: 'string', example: 'disb-1234567890' },
            failure_code: { type: 'string', nullable: true },
            failure_message: { type: 'string', nullable: true },
            requested_at: { type: 'string', format: 'date-time' },
            completed_at: { type: 'string', format: 'date-time' },
            items: {
              type: 'array',
              description: '이 payout에 포함된 booking/escrow 목록',
              items: {
                type: 'object',
                properties: {
                  booking_id: { type: 'string', format: 'uuid' },
                  booking_number: { type: 'string', example: 'BOOK-1770000000000-ABCDE1234' },
                  escrow_id: { type: 'string', example: 'ESC-12345' },
                  provider_amount: { type: 'number', example: 500.0 },
                },
              },
            },
          },
        },
      },
    },
  })
  getPayoutDetails(@GetUser() _user: any, @Param('payoutId') _payoutId: string) {
    // TODO: payouts + escrow_accounts + bookings 조인으로 상세 조회
    throw new NotImplementedException('Payout details API is not implemented yet.');
  }
}

