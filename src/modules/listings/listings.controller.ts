import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { QueryListingsDto } from './dto/query-listings.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Get all active service listings',
    description:
      'Returns all active service listings. Supports filters: category_id, area, min_price, max_price, is_instant_book.',
  })
  @ApiQuery({ name: 'category_id', required: false, description: 'Category UUID' })
  @ApiQuery({ name: 'area', required: false, description: 'Area (e.g. city name)' })
  @ApiQuery({ name: 'min_price', required: false, description: 'Minimum price (PHP)' })
  @ApiQuery({ name: 'max_price', required: false, description: 'Maximum price (PHP)' })
  @ApiQuery({ name: 'is_instant_book', required: false, description: 'Filter by instant book' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'List of listings with pagination' })
  findAll(@Query() query: QueryListingsDto) {
    return this.listingsService.findAll(query);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Create service listing',
    description:
      'JWT에서 userId 조회 → providers 테이블에서 provider_id 조회 후 service_listings에 INSERT. Body: categoryId, title, description, pricingType, fixedPrice, durationMinutes 등.',
  })
  @ApiBody({ type: CreateListingDto })
  @ApiResponse({ status: 201, description: 'Listing created (provider_id는 JWT→providers 조회값 사용)' })
  @ApiResponse({ status: 403, description: 'Provider profile not found (해당 user에 대한 provider 없음)' })
  create(@GetUser() user: { id: string }, @Body() dto: CreateListingDto) {
    return this.listingsService.create(user.id, dto);
  }

  @Public()
  @Get(':id/availability')
  @ApiOperation({
    summary: 'Get listing availability',
    description:
      'Returns available time slots for the next 30 days based on provider schedule and existing bookings.',
  })
  @ApiParam({ name: 'id', description: 'Listing UUID' })
  @ApiResponse({ status: 200, description: 'Available slots by date' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  getAvailability(@Param('id') id: string) {
    return this.listingsService.getAvailability(id);
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Get listing by ID',
    description:
      'Returns listing from service_listings + service_variants + service_addon_groups/items. pricingType FIXED|VARIANT|ADDON, fixedPrice (null when VARIANT), variants[], addonGroups[].items[], pricingRules.',
  })
  @ApiParam({ name: 'id', description: 'Listing UUID' })
  @ApiResponse({
    status: 200,
    description: 'Listing details with variants and addons',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        title: { type: 'string' },
        pricingType: { type: 'string', enum: ['FIXED', 'VARIANT', 'ADDON'] },
        fixedPrice: { type: 'number', nullable: true, description: 'VARIANT이면 null' },
        variants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              price: { type: 'number' },
              durationMinutes: { type: 'number' },
              isDefault: { type: 'boolean' },
            },
          },
        },
        addonGroups: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              isRequired: { type: 'boolean' },
              isMultiple: { type: 'boolean' },
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    label: { type: 'string' },
                    extraPrice: { type: 'number' },
                  },
                },
              },
            },
          },
        },
        pricingRules: {
          type: 'object',
          nullable: true,
          properties: {
            extraPersonPrice: { type: 'number' },
            maxPersonCount: { type: 'number' },
            travelFeeEnabled: { type: 'boolean' },
            travelFeePerKm: { type: 'number' },
            travelFreeRadiusKm: { type: 'number' },
          },
        },
        description: { type: 'string', nullable: true },
        providerId: { type: 'string', format: 'uuid' },
        categoryId: { type: 'string', format: 'uuid' },
        durationMinutes: { type: 'number' },
        serviceAreas: { type: 'object', nullable: true },
        advanceNoticeHours: { type: 'number' },
        isInstantBook: { type: 'boolean' },
        isActive: { type: 'boolean' },
        photos: { type: 'array', items: { type: 'string' }, nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  findOne(@Param('id') id: string) {
    return this.listingsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Update service listing',
    description: 'Provider updates listing details (auth and ownership required).',
  })
  @ApiParam({ name: 'id', description: 'Listing UUID' })
  @ApiBody({ type: UpdateListingDto })
  @ApiResponse({ status: 200, description: 'Listing updated' })
  @ApiResponse({ status: 403, description: 'Not owner' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  update(
    @Param('id') id: string,
    @GetUser() user: { id: string },
    @Body() dto: UpdateListingDto,
  ) {
    return this.listingsService.update(id, user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Delete (deactivate) service listing',
    description: 'Provider soft-deletes a listing (sets is_active to false).',
  })
  @ApiParam({ name: 'id', description: 'Listing UUID' })
  @ApiResponse({ status: 200, description: 'Listing deactivated' })
  @ApiResponse({ status: 403, description: 'Not owner' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  remove(@Param('id') id: string, @GetUser() user: { id: string }) {
    return this.listingsService.remove(id, user.id);
  }
}
