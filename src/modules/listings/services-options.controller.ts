import { Controller, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { GetUser } from '../../common/decorators/get-user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ListingsService } from './listings.service';
import { CreateVariantsDto } from './dto/create-variants.dto';
import { CreateAddonGroupsDto } from './dto/create-addon-groups.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { UpdateAddonGroupDto } from './dto/update-addon-group.dto';

@ApiTags('service-options')
@Controller('services')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class ServicesOptionsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Post(':serviceId/variants')
  @ApiOperation({
    summary: 'Register service variants',
    description:
      'JWT userId → provider 조회. serviceId는 service_listings.id 로 존재 여부 확인 후 service_variants에 INSERT (service_id=serviceId, name/price/durationMinutes 등).',
  })
  @ApiParam({ name: 'serviceId', description: 'service_listings.id (리스팅 UUID). service_listings 테이블에서 존재 여부 확인' })
  @ApiBody({
    type: CreateVariantsDto,
    examples: {
      example: {
        value: {
          variants: [
            {
              name: '60 min Classic',
              description: 'Full-body Swedish massage',
              price: 800.0,
              durationMinutes: 60,
              sortOrder: 1,
              isDefault: true,
            },
            {
              name: '90 min Deep Tissue',
              description: 'Extended deep muscle session',
              price: 1100.0,
              durationMinutes: 90,
              sortOrder: 2,
              isDefault: false,
            },
          ],
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Variants created' })
  @ApiResponse({ status: 404, description: 'Service not found in service_listings' })
  createVariants(
    @Param('serviceId') serviceId: string,
    @Body() dto: CreateVariantsDto,
    @GetUser() user: { id: string },
  ) {
    return this.listingsService.createVariants(serviceId, user.id, dto);
  }

  @Delete(':serviceId/variants/:variantId')
  @ApiOperation({ summary: 'Delete one variant' })
  @ApiParam({ name: 'serviceId', description: 'service_listings.id' })
  @ApiParam({ name: 'variantId', description: 'service_variants.id' })
  @ApiResponse({ status: 200, description: 'Variant deleted' })
  @ApiResponse({ status: 404, description: 'Service or variant not found' })
  removeVariant(
    @Param('serviceId') serviceId: string,
    @Param('variantId') variantId: string,
    @GetUser() user: { id: string },
  ) {
    return this.listingsService.removeVariant(serviceId, variantId, user.id);
  }

  @Patch(':serviceId/variants/:variantId')
  @ApiOperation({ summary: 'Update one variant' })
  @ApiParam({ name: 'serviceId', description: 'service_listings.id' })
  @ApiParam({ name: 'variantId', description: 'service_variants.id' })
  @ApiBody({
    type: UpdateVariantDto,
    examples: {
      example: {
        value: {
          name: '60 min Classic',
          description: 'Full-body Swedish massage',
          price: 800,
          durationMinutes: 60,
          sortOrder: 1,
          isDefault: true,
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Variant updated' })
  @ApiResponse({ status: 404, description: 'Service or variant not found' })
  updateVariant(
    @Param('serviceId') serviceId: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateVariantDto,
    @GetUser() user: { id: string },
  ) {
    return this.listingsService.updateVariant(serviceId, variantId, user.id, dto);
  }

  @Post(':serviceId/addon-groups')
  @ApiOperation({
    summary: 'Register addon groups and items',
    description:
      'JWT userId → provider 조회. serviceId(service_listings.id) 존재 확인 후 service_addon_groups + service_addon_items에 그룹·아이템 일괄 등록.',
  })
  @ApiParam({ name: 'serviceId', description: 'service_listings.id (리스팅 UUID). service_listings 테이블에서 존재 여부 확인' })
  @ApiBody({
    type: CreateAddonGroupsDto,
    examples: {
      example: {
        value: {
          addonGroups: [
            {
              name: 'Aromatherapy Oil',
              isRequired: false,
              isMultiple: false,
              sortOrder: 1,
              items: [
                { label: 'Lavender', extraPrice: 0, sortOrder: 1 },
                { label: 'Peppermint', extraPrice: 0, sortOrder: 2 },
                { label: 'Premium Rose', extraPrice: 150, sortOrder: 3 },
              ],
            },
            {
              name: 'Add-On Treatments',
              isRequired: false,
              isMultiple: true,
              sortOrder: 2,
              items: [
                { label: 'Hot Stone', extraPrice: 200, sortOrder: 1 },
                { label: 'Foot Scrub', extraPrice: 150, sortOrder: 2 },
                { label: 'Head Massage', extraPrice: 100, sortOrder: 3 },
              ],
            },
          ],
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Addon groups and items created' })
  @ApiResponse({ status: 404, description: 'Service not found in service_listings' })
  createAddonGroups(
    @Param('serviceId') serviceId: string,
    @Body() dto: CreateAddonGroupsDto,
    @GetUser() user: { id: string },
  ) {
    return this.listingsService.createAddonGroups(serviceId, user.id, dto);
  }

  @Delete(':serviceId/addon-groups/:groupId')
  @ApiOperation({ summary: 'Delete addon group and all its items' })
  @ApiParam({ name: 'serviceId', description: 'service_listings.id' })
  @ApiParam({ name: 'groupId', description: 'service_addon_groups.id' })
  @ApiResponse({ status: 200, description: 'Addon group and items deleted' })
  @ApiResponse({ status: 404, description: 'Service or group not found' })
  removeAddonGroup(
    @Param('serviceId') serviceId: string,
    @Param('groupId') groupId: string,
    @GetUser() user: { id: string },
  ) {
    return this.listingsService.removeAddonGroup(serviceId, groupId, user.id);
  }

  @Patch(':serviceId/addon-groups/:groupId')
  @ApiOperation({ summary: 'Update addon group and items' })
  @ApiParam({ name: 'serviceId', description: 'service_listings.id' })
  @ApiParam({ name: 'groupId', description: 'service_addon_groups.id' })
  @ApiBody({
    type: UpdateAddonGroupDto,
    examples: {
      example: {
        value: {
          name: 'Aromatherapy Oil',
          isRequired: false,
          isMultiple: false,
          sortOrder: 1,
          items: [
            { label: 'Lavender', extraPrice: 0, sortOrder: 1 },
            { label: 'Peppermint', extraPrice: 0, sortOrder: 2 },
            { label: 'Premium Rose', extraPrice: 150, sortOrder: 3 },
          ],
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Addon group updated (items replaced if items[] sent)' })
  @ApiResponse({ status: 404, description: 'Service or group not found' })
  updateAddonGroup(
    @Param('serviceId') serviceId: string,
    @Param('groupId') groupId: string,
    @Body() dto: UpdateAddonGroupDto,
    @GetUser() user: { id: string },
  ) {
    return this.listingsService.updateAddonGroup(serviceId, groupId, user.id, dto);
  }
}
