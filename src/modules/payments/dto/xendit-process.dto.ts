import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum } from 'class-validator';

export enum XenditPaymentMethod {
  CARD = 'CARD',
  GCASH = 'GCASH',
  PAYMAYA = 'PAYMAYA',
  QRPH = 'QRPH',
  INSTAPAY = 'INSTAPAY',
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
  bookingId: string;

  @ApiProperty({
    example: 'GCASH',
    enum: XenditPaymentMethod,
    description: 'Payment method: CARD | GCASH | PAYMAYA | QRPH | INSTAPAY',
  })
  @IsEnum(XenditPaymentMethod)
  payment_method: XenditPaymentMethod;

  @ApiProperty({
    example: 'gigmarket://payment/callback',
    description: 'URL to redirect after payment (e.g. app deep link or web URL)',
  })
  @IsString()
  @IsNotEmpty()
  return_url: string;
}
