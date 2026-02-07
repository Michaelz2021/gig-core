import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class InitializePaymentSessionDto {
  @ApiProperty({
    example: 'CON-2025-001234',
    description: 'Booking or contract reference ID',
  })
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @ApiProperty({
    example: 2140.0,
    description: 'Total amount to pay',
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    example: 'PHP',
    description: 'Currency code',
    default: 'PHP',
  })
  @IsString()
  @IsNotEmpty()
  currency: string;
}
