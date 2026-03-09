import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, IsUrl } from 'class-validator';

export const PROVIDER_AD_MEDIA_TAGS = ['image', 'video'] as const;
export type ProviderAdMediaTag = (typeof PROVIDER_AD_MEDIA_TAGS)[number];

/**
 * 미디어 한 건: tag(image|video) + url. 최대 10개까지 저장 가능.
 */
export class ProviderAdMediaItemDto {
  @ApiProperty({ enum: ['image', 'video'], example: 'image', description: '미디어 종류' })
  @IsIn(PROVIDER_AD_MEDIA_TAGS)
  tag: ProviderAdMediaTag;

  @ApiProperty({ example: 'https://gigmarket.s3.ap-northeast-2.amazonaws.com/portfolio/image/xxx.jpg', description: '미디어 URL' })
  @IsString()
  @IsUrl()
  url: string;
}

export interface ProviderAdMediaItem {
  tag: ProviderAdMediaTag;
  url: string;
}
