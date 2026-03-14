import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl } from 'class-validator';

export class CreateLiveUpdateImageDto {
  @ApiProperty({
    description: 'Image URL (e.g. S3 public URL from projects/upload-url)',
    example: 'https://bucket.s3.region.amazonaws.com/projects/1234567890_photo.png',
  })
  @IsString()
  @IsUrl()
  imageUrl: string;
}
