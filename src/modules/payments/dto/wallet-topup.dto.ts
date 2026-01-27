import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class WalletTopupDto {
  @ApiProperty({ example: 1000.0 })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  amount: number;
}

