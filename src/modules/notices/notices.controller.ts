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
    description: 'Success/failure: Check X-Api-Status in response headers after Execute. success = 200, error = 401 etc. body.success true = success, false = failure.',
  })
  @ApiOkResponse({
    description: 'Success — HTTP 200. body: { success: true, statusCode: 200, data: notice object }',
    type: NoticeResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Failure — missing/expired token. body: { statusCode: 401, message: "Unauthorized" }. Enter accessToken in Authorize and retry.',
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
