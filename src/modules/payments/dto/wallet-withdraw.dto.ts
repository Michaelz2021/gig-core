import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsString, IsOptional, Min } from 'class-validator';

export class WalletWithdrawDto {
  @ApiProperty({
    description: 'Withdrawal amount',
    example: 1000.00,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    description: 'Withdrawal method',
    example: 'bank_transfer',
    enum: ['bank_transfer', 'e_wallet', 'cash_pickup'],
    required: false,
  })
  @IsString()
  @IsOptional()
  withdrawalMethod?: string;

  @ApiProperty({
    description: 'Bank name (required for bank account withdrawal)',
    example: 'BDO',
    required: false,
  })
  @IsString()
  @IsOptional()
  bankName?: string;

  @ApiProperty({
    description: 'Account number (required for bank account withdrawal)',
    example: '1234567890',
    required: false,
  })
  @IsString()
  @IsOptional()
  accountNumber?: string;

  @ApiProperty({
    description: 'Account holder name (required for bank account withdrawal)',
    example: 'Juan Dela Cruz',
    required: false,
  })
  @IsString()
  @IsOptional()
  accountHolderName?: string;

  @ApiProperty({
    description: 'E-Wallet account (required for e-wallet withdrawal)',
    example: 'gcash@example.com',
    required: false,
  })
  @IsString()
  @IsOptional()
  eWalletAccount?: string;

  @ApiProperty({
    description: 'Withdrawal description (optional)',
    example: 'Monthly withdrawal',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}

