  import { ApiProperty } from '@nestjs/swagger';
  import {
    IsNotEmpty,
    IsNumber,
    IsIn,
    IsEnum,
    IsOptional,
    IsString,
    ValidateNested,
  } from 'class-validator';
  import { Type, Transform } from 'class-transformer';

  // Payment Methods

  export enum TopupPaymentMethod {
    GCASH    = 'GCASH',
    PAYMAYA  = 'PAYMAYA',
    CARD     = 'CARD',
    INSTAPAY = 'INSTAPAY',
  }

  // Card Details (required only when payment_method = CARD) 

  export class TopupCardDetailsDto {
    @ApiProperty({ example: '4000000000000002', description: 'Card number (no spaces)' })
    @IsString()
    @IsNotEmpty()
    card_number: string;

    @ApiProperty({ example: '12', description: 'Expiry month (01–12)' })
    @IsString()
    @IsNotEmpty()
    exp_month: string;

    @ApiProperty({ example: '2028', description: 'Expiry year (YYYY)' })
    @IsString()
    @IsNotEmpty()
    exp_year: string;

    @ApiProperty({ example: '123', description: 'CVV / CVC' })
    @IsString()
    @IsNotEmpty()
    cvv: string;

    @ApiProperty({ example: 'Juan Dela Cruz', description: 'Full name on the card' })
    @IsString()
    @IsNotEmpty()
    cardholder_name: string;

    @ApiProperty({ example: 'juan@example.com', description: 'Cardholder email address' })
    @IsString()
    @IsNotEmpty()
    cardholder_email: string;
  }

  // Main Topup DTO

  export class WalletTopupDto {
    @ApiProperty({
      example: 500,
      enum: [100, 200, 300, 500, 1000],
      description: 'Top-up amount in PHP. Must be one of: 100, 200, 300, 500, 1000',
    })
    @IsNumber()
    @IsIn([100, 200, 300, 500, 1000], {
      message: 'Amount must be one of: 100, 200, 300, 500, or 1000',
    })
    @IsNotEmpty()
    amount: number;

    @ApiProperty({
      example: 'GCASH',
      enum: TopupPaymentMethod,
      description: 'Payment channel: GCASH | PAYMAYA | CARD | INSTAPAY | QRPH',
    })
    @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
    @IsEnum(TopupPaymentMethod, {
      message: 'payment_method must be one of: GCASH, PAYMAYA, CARD, INSTAPAY, QRPH',
    })
    @IsNotEmpty()
    payment_method: TopupPaymentMethod;

    @ApiProperty({
      type: TopupCardDetailsDto,
      required: false,
      description: 'Card information. Required when payment_method is CARD.',
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => TopupCardDetailsDto)
    card_details?: TopupCardDetailsDto;
  }