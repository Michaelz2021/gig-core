import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum XenditPaymentMethod {
  CARD = 'CARD',
  GCASH = 'GCASH',
  PAYMAYA = 'PAYMAYA',
  QRPH = 'QRPH',
  INSTAPAY = 'INSTAPAY',
}

export class CardDetailsDto {
  @ApiProperty({ example: '4000000000000002', description: 'Card number' })
  @IsString()
  card_number: string;

  @ApiProperty({ example: '12', description: 'Expiry month (01-12)' })
  @IsString()
  exp_month: string;

  @ApiProperty({ example: '2028', description: 'Expiry year (YYYY)' })
  @IsString()
  exp_year: string;

  @ApiProperty({ example: '123', description: 'CVV' })
  @IsString()
  cvv: string;
}

export class XenditProcessDto {
  @ApiProperty({
    example: 'PSESS-2025-001',
    description: 'Payment session ID from initialize',
  })
  @IsString()
  @IsNotEmpty()
  payment_session_id: string;

  @ApiProperty({
    example: 'bk_123',
    description: 'Booking ID',
  })
  @IsString()
  @IsNotEmpty()
  booking_id: string;

  @ApiProperty({
    example: 'CARD',
    enum: XenditPaymentMethod,
    description: 'Payment method: CARD | GCASH | PAYMAYA | QRPH | INSTAPAY (대소문자 무관)',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsEnum(XenditPaymentMethod)
  payment_method: XenditPaymentMethod;

  @ApiProperty({
    example: 'gigmarket://payment/callback',
    description: 'URL to redirect after payment (e.g. app deep link or web URL)',
  })
  @IsString()
  @IsNotEmpty()
  return_url: string;

  @ApiProperty({
    type: CardDetailsDto,
    required: false,
    description: 'Required when payment_method is CARD',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CardDetailsDto)
  card_details?: CardDetailsDto;
}
