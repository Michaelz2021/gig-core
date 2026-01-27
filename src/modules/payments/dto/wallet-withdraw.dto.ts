import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsString, IsOptional, Min } from 'class-validator';

export class WalletWithdrawDto {
  @ApiProperty({
    description: '출금 금액',
    example: 1000.00,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    description: '출금 방법',
    example: 'bank_transfer',
    enum: ['bank_transfer', 'e_wallet', 'cash_pickup'],
    required: false,
  })
  @IsString()
  @IsOptional()
  withdrawalMethod?: string;

  @ApiProperty({
    description: '은행명 (은행 계좌 출금 시 필수)',
    example: 'BDO',
    required: false,
  })
  @IsString()
  @IsOptional()
  bankName?: string;

  @ApiProperty({
    description: '계좌번호 (은행 계좌 출금 시 필수)',
    example: '1234567890',
    required: false,
  })
  @IsString()
  @IsOptional()
  accountNumber?: string;

  @ApiProperty({
    description: '예금주명 (은행 계좌 출금 시 필수)',
    example: 'Juan Dela Cruz',
    required: false,
  })
  @IsString()
  @IsOptional()
  accountHolderName?: string;

  @ApiProperty({
    description: 'E-Wallet 계정 (E-Wallet 출금 시 필수)',
    example: 'gcash@example.com',
    required: false,
  })
  @IsString()
  @IsOptional()
  eWalletAccount?: string;

  @ApiProperty({
    description: '출금 설명 (선택 사항)',
    example: 'Monthly withdrawal',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}

