import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class ProviderAdUploadUrlRequestDto {
  @ApiProperty({
    description: 'Original filename (e.g. from image_picker)',
    example: 'image_picker_69440486-50D8-4009-B9DB-94AA818D94F1.jpg',
  })
  @IsString()
  filename: string;

  @ApiProperty({
    description: 'MIME type (image/jpeg, image/png, video/mp4, etc.)',
    example: 'image/jpeg',
  })
  @IsString()
  contentType: string;
}
