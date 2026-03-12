import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { KycCompleteDto } from './dto/kyc-complete.dto';
import { KycCompleteService } from './services/kyc-complete.service';

@ApiTags('providers')
@Controller('providers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class ProvidersVerificationController {
  constructor(private readonly kycCompleteService: KycCompleteService) {}

  @Post('verification/kyc-complete')
  @ApiOperation({
    summary: 'KYC completion callback',
    description:
      'Record KYC verification result for the authenticated provider. Updates users (is_id_verified, kyc_level, ai_confidence_score, kyc_detail) and providers (government_id_type, government_id_number).',
  })
  @ApiBody({ type: KycCompleteDto })
  @ApiResponse({
    status: 200,
    description: 'KYC completion recorded',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'KYC completion recorded' },
        data: {
          type: 'object',
          properties: {
            user_id: { type: 'string', format: 'uuid' },
            is_id_verified: { type: 'boolean' },
            kyc_level: { type: 'string', enum: ['basic', 'intermediate', 'advanced'] },
            ai_confidence_score: { type: 'number', nullable: true },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Not a provider' })
  async kycComplete(@GetUser() user: any, @Body() dto: KycCompleteDto) {
    return this.kycCompleteService.processKycComplete(user.id, dto);
  }
}
