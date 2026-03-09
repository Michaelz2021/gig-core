import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsIn, IsBoolean, IsOptional, IsString } from 'class-validator';

export class AddReactionDto {
  @ApiProperty({ description: 'Provider ID (providers.id)' })
  @IsUUID()
  providerId: string;

  @ApiPropertyOptional({ description: 'Note for recommend' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ description: 'Booking ID for verification' })
  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @ApiPropertyOptional({ description: 'Is public', default: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
