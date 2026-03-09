import { Controller, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { S3Service } from './s3.service';
import { ProviderAdUploadUrlRequestDto } from './dto/upload-url-request.dto';

const IMAGE_PREFIX = 'portfolio/image/';
const VIDEO_PREFIX = 'portfolio/video/';
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];

@ApiTags('provider-ads')
@Controller('provider-ads')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class ProviderAdsUploadController {
  constructor(private readonly s3Service: S3Service) {}

  @Post('upload-url')
  @ApiOperation({
    summary: 'Get upload URL for provider ad image/video',
    description:
      'Send filename and contentType (JSON). Returns presigned uploadUrl (PUT file here) and public url (use in provider_ads).',
  })
  @ApiBody({ type: ProviderAdUploadUrlRequestDto })
  @ApiResponse({
    status: 201,
    description: 'uploadUrl: PUT file here; url: public URL to save',
    schema: {
      type: 'object',
      properties: {
        uploadUrl: { type: 'string', description: 'Presigned URL - PUT file here' },
        url: { type: 'string', description: 'Public URL to store in provider_ads' },
      },
      required: ['uploadUrl', 'url'],
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid contentType or filename' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUploadUrl(@Body() dto: ProviderAdUploadUrlRequestDto) {
    const { filename, contentType } = dto;
    if (!filename || !contentType) {
      throw new BadRequestException('filename and contentType are required');
    }
    const ct = contentType.toLowerCase().trim();
    const isImage = IMAGE_TYPES.includes(ct);
    const isVideo = VIDEO_TYPES.includes(ct);
    if (!isImage && !isVideo) {
      throw new BadRequestException(
        `Unsupported contentType. Image: ${IMAGE_TYPES.join(', ')}. Video: ${VIDEO_TYPES.join(', ')}.`,
      );
    }
    const prefix = isImage ? IMAGE_PREFIX : VIDEO_PREFIX;
    const safeName = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const key = `${prefix}${safeName}`;
    const { uploadUrl, publicUrl } = await this.s3Service.getPresignedPutUrl(key, contentType);
    return { uploadUrl, url: publicUrl };
  }
}
