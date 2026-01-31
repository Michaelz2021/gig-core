import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { NoticesService } from './notices.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { NoticeResponseDto } from './dto/notice-response.dto';
import { NoticeType } from './entities/notice.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('notices')
@Controller('notices')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Create notice (Admin only)',
    description: '성공/실패 구분: Execute 후 Response headers 에서 X-Api-Status 를 보세요. success = 성공(200), error = 실패(401 등). body.success 가 true 이면 성공, false 이면 실패.',
  })
  @ApiOkResponse({
    description: '성공 — HTTP 200. body: { success: true, statusCode: 200, data: 공지객체 }',
    type: NoticeResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '실패 — 토큰 없음/만료. body: { statusCode: 401, message: "Unauthorized" }. 상단 Authorize에 로그인 후 받은 accessToken 입력 후 다시 시도.',
  })
  create(@Body() createNoticeDto: CreateNoticeDto, @GetUser() user: any) {
    return this.noticesService.create(createNoticeDto, user.id);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get notices list' })
  @ApiQuery({ name: 'type', required: false, enum: NoticeType, description: 'Filter by type (notice or news)' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiOkResponse({ 
    description: 'Notices list returned',
    type: [NoticeResponseDto],
  })
  findAll(
    @Query('type') type?: NoticeType,
    @Query('isActive') isActive?: string,
  ) {
    const isActiveBool = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.noticesService.findAll(type, isActiveBool);
  }

  @Public()
  @Get('latest')
  @ApiOperation({ summary: 'Get latest active notices' })
  @ApiQuery({ name: 'type', required: false, enum: NoticeType, description: 'Filter by type (notice or news)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of notices to return (default: 10)' })
  @ApiOkResponse({ 
    description: 'Latest notices returned',
    type: [NoticeResponseDto],
  })
  findLatest(
    @Query('type') type?: NoticeType,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.noticesService.findLatest(type, limitNum);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get notice by ID' })
  @ApiParam({ name: 'id', description: 'Notice ID' })
  @ApiOkResponse({ 
    description: 'Notice returned',
    type: NoticeResponseDto,
  })
  findOne(@Param('id') id: string) {
    return this.noticesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update notice (Admin only)' })
  @ApiParam({ name: 'id', description: 'Notice ID' })
  @ApiOkResponse({ 
    description: 'Notice updated successfully',
    type: NoticeResponseDto,
  })
  update(@Param('id') id: string, @Body() updateNoticeDto: UpdateNoticeDto) {
    return this.noticesService.update(id, updateNoticeDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete notice (Admin only)' })
  @ApiParam({ name: 'id', description: 'Notice ID' })
  @ApiOkResponse({ description: 'Notice deleted successfully' })
  remove(@Param('id') id: string) {
    return this.noticesService.remove(id);
  }
}
