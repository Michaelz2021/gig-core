import { Body, Controller, Param, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiBody, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProviderAdService } from './services/provider-ad.service';
import { UpdateProviderAdDto } from './dto/update-provider-ad.dto';
import { ProviderAdResponseDto } from './dto/provider-ad-response.dto';

/**
 * Flutter 앱이 호출하는 형식: media[].media, validFrom, validUntil
 * 백엔드 DTO: media[].tag, startDate, endDate
 */
function mapFlutterBodyToUpdateDto(body: Record<string, any>): UpdateProviderAdDto {
  const dto: UpdateProviderAdDto = {};

  if (body.providerId !== undefined) dto.providerId = body.providerId;
  if (body.providerName !== undefined) dto.providerName = body.providerName;
  if (body.serviceArea !== undefined) dto.serviceArea = body.serviceArea;
  if (body.serviceCategories !== undefined) dto.serviceCategories = body.serviceCategories;
  if (body.promoMessage !== undefined) dto.promoMessage = body.promoMessage;
  if (body.promoTitle !== undefined) dto.promoTitle = body.promoTitle;
  if (body.hasDiscount !== undefined) dto.hasDiscount = body.hasDiscount;
  if (body.discountPercentage !== undefined) dto.discountPercentage = body.discountPercentage;
  if (body.discountAmount !== undefined) dto.discountAmount = body.discountAmount;
  if (body.discountDescription !== undefined) dto.discountDescription = body.discountDescription;
  if (body.discountStartDate !== undefined) dto.discountStartDate = body.discountStartDate;
  if (body.discountEndDate !== undefined) dto.discountEndDate = body.discountEndDate;
  if (body.actionUrl !== undefined) dto.actionUrl = body.actionUrl;
  if (body.actionText !== undefined) dto.actionText = body.actionText;
  if (body.priority !== undefined) dto.priority = body.priority;
  if (body.isActive !== undefined) dto.isActive = body.isActive;
  if (body.backgroundImageUrl !== undefined) dto.backgroundImageUrl = body.backgroundImageUrl;

  // Flutter: validFrom / validUntil → startDate / endDate
  if (body.validFrom !== undefined) dto.startDate = body.validFrom;
  if (body.validUntil !== undefined) dto.endDate = body.validUntil;
  if (body.startDate !== undefined) dto.startDate = body.startDate;
  if (body.endDate !== undefined) dto.endDate = body.endDate;

  // media: Flutter는 { media: "image", url } 형태 → { tag: "image", url }
  if (body.media !== undefined && Array.isArray(body.media)) {
    dto.media = body.media.map((m: any) => ({
      tag: (m.tag ?? m.media ?? 'image') as 'image' | 'video',
      url: m.url,
    }));
  }

  return dto;
}

@ApiTags('provider-ads')
@Controller('provider-ads')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class ProviderAdsController {
  constructor(private readonly providerAdService: ProviderAdService) {}

  @Put(':id')
  @ApiOperation({
    summary: 'Update provider ad by ID (PUT)',
    description:
      'Same as PATCH /users/providers/ads/:id. Accepts Flutter-style body: media[].media, validFrom, validUntil are mapped to tag, startDate, endDate.',
  })
  @ApiParam({ name: 'id', description: 'Provider ad UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        providerType: { type: 'string' },
        providerName: { type: 'string' },
        media: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              media: { type: 'string', enum: ['image', 'video'], description: 'Flutter: use "media" or backend "tag"' },
              url: { type: 'string', format: 'uri' },
            },
          },
        },
        promoTitle: { type: 'string' },
        promoMessage: { type: 'string' },
        discountPercentage: { type: 'number' },
        validFrom: { type: 'string', format: 'date-time', description: 'Mapped to startDate' },
        validUntil: { type: 'string', format: 'date-time', description: 'Mapped to endDate' },
        isActive: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Provider ad updated successfully', type: ProviderAdResponseDto })
  @ApiResponse({ status: 404, description: 'Provider ad not found' })
  async updateAd(@Param('id') id: string, @Body() body: Record<string, any>) {
    const dto = mapFlutterBodyToUpdateDto(body);
    return this.providerAdService.update(id, dto);
  }
}
