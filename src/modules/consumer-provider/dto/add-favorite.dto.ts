import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AddFavoriteDto {
  @ApiProperty({ description: 'Provider ID (providers.id)' })
  @IsUUID()
  providerId: string;
}
