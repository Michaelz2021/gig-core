import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { ListingsService } from './listings.service';
import { UpdateListingDto } from './dto/update-listing.dto';

@ApiTags('mylistings')
@Controller('mylistings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class MylistingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get my service listings',
    description:
      'JWT userId → providers 테이블에서 provider_id 조회 → service_listings에서 provider_id 일치하는 목록 반환. Provider 없으면 items: [], total: 0.',
  })
  @ApiResponse({
    status: 200,
    description: '내 리스팅 목록 (JWT → provider_id 기준)',
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              providerId: { type: 'string', format: 'uuid' },
              categoryId: { type: 'string', format: 'uuid' },
              title: { type: 'string' },
              description: { type: 'string' },
              pricingType: { type: 'string' },
              fixedPrice: { type: 'number', nullable: true },
              isActive: { type: 'boolean' },
              isInstantBook: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        total: { type: 'number', description: '총 개수' },
      },
    },
  })
  getMyListings(@GetUser() user: { id: string }) {
    return this.listingsService.getMyListings(user.id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update my service listing',
    description:
      'JWT userId → provider_id 조회 후, 해당 리스팅이 본인 소유인지 확인하고 service_listings 행을 업데이트. (title, description, fixedPrice, durationMinutes, serviceAreas, advanceNoticeHours, isInstantBook, isActive 등)',
  })
  @ApiParam({ name: 'id', description: 'Listing UUID (service_listings.id)' })
  @ApiBody({ type: UpdateListingDto })
  @ApiResponse({ status: 200, description: 'Listing updated' })
  @ApiResponse({ status: 403, description: 'Not owner of this listing' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  updateMyListing(
    @Param('id') id: string,
    @Body() dto: UpdateListingDto,
    @GetUser() user: { id: string },
  ) {
    return this.listingsService.update(id, user.id, dto);
  }
}
