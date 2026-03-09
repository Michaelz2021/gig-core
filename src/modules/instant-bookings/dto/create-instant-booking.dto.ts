import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsUUID,
  IsDateString,
  IsNumber,
  IsObject,
  IsString,
  Min,
  Max,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class LocationDto {
  @ApiProperty({ example: '123 Main St, Anytown, USA' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 37.7749 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({ example: -122.4194 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;
}

export class CreateInstantBookingDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'User (consumer) UUID. Accepts userId or user_id.' })
  @Transform(({ obj }) => obj?.userId ?? obj?.['user_id'])
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 'a98a4eb5-4b1e-4851-99c6-f92806ae5f61', description: 'Service category UUID. Accepts serviceCategoryId or service_category.' })
  @Transform(({ obj }) => obj?.serviceCategoryId ?? obj?.['service_category'])
  @IsUUID()
  @IsNotEmpty()
  serviceCategoryId: string;

  @ApiProperty({ example: '2024-07-01T14:00:00Z', description: 'Requested time slot (ISO 8601). Accepts timeSlot or time_slot.' })
  @Transform(({ obj }) => obj?.timeSlot ?? obj?.['time_slot'])
  @IsDateString()
  @IsNotEmpty()
  timeSlot: string;

  @ApiProperty({ type: LocationDto })
  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  /** Snake_case alias for userId (allowed so request body is not stripped by whitelist). */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  'user_id'?: string;

  /** Snake_case alias for serviceCategoryId. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  'service_category'?: string;

  /** Snake_case alias for timeSlot. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  'time_slot'?: string;
}
