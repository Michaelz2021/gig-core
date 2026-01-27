import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TrustScoreService } from './trust-score.service';
import { UpdateTrustScoreDto } from './dto/update-trust-score.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('trust-score')
@Controller('trust-score')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class TrustScoreController {
  constructor(private readonly trustScoreService: TrustScoreService) {}

  @Get(':userId')
  @ApiOperation({ summary: 'Get trust score' })
  @ApiOkResponse({ description: 'Trust score returned' })
  getScore(@Param('userId') userId: string) {
    return this.trustScoreService.getTrustScore(userId);
  }

  @Post('update')
  @ApiOperation({ summary: 'Update trust score' })
  @ApiOkResponse({ description: 'Trust score updated successfully' })
  updateScore(@Body() updateDto: UpdateTrustScoreDto) {
    return this.trustScoreService.updateTrustScore(updateDto);
  }
}
