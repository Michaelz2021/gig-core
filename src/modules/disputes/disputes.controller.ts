import { Controller, Get, Post, Body, Param, UseGuards, Patch } from '@nestjs/common';
import { ApiOkResponse, ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DisputesService } from './disputes.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { DisputeStatus } from './entities/dispute.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';

@ApiTags('disputes')
@Controller('disputes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post()
  @ApiOperation({ summary: 'File dispute' })
  @ApiOkResponse({ description: 'Dispute filed successfully' })
  create(@GetUser() user: any, @Body() createDisputeDto: CreateDisputeDto) {
    return this.disputesService.create(user.id, createDisputeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get dispute list' })
  @ApiOkResponse({ description: 'Dispute list returned' })
  findAll(@GetUser() user: any) {
    return this.disputesService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dispute details' })
  @ApiOkResponse({ description: 'Dispute details returned' })
  findOne(@Param('id') id: string) {
    return this.disputesService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update dispute status' })
  @ApiOkResponse({ description: 'Dispute status updated successfully' })
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: DisputeStatus; resolution?: string },
  ) {
    return this.disputesService.updateStatus(id, body.status, body.resolution);
  }
}
