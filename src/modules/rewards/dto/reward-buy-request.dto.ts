import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { XenditPaymentMethod } from '../../payments/dto/xendit-process.dto';
import { CardDetailsDto } from '../../payments/dto/xendit-process.dto';

export class RewardBuyRequestDto {
  @ApiProperty({
    example: 'PSESS-REWARD-1735123456789',
    description: 'Payment session ID from POST /rewards/buy/initialization',
  })
  @IsString()
  @IsNotEmpty()
  payment_session_id: string;

  @ApiProperty({
    example: 'CARD',
    enum: XenditPaymentMethod,
    description: 'Payment method: CARD | GCASH | PAYMAYA | QRPH | INSTAPAY (case-insensitive)',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsEnum(XenditPaymentMethod)
  payment_method: XenditPaymentMethod;

  @ApiProperty({
    example: 'gigmarket://payment/callback',
    description: 'URL to redirect after payment (e.g. app deep link)',
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
