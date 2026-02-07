import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateBankAccountDto {
  @ApiProperty({
    description: 'Bank name',
    example: 'BDO',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  bankName: string;

  @ApiProperty({
    description: 'Account number',
    example: '1234567890',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  accountNumber: string;

  @ApiProperty({
    description: 'Account holder name',
    example: 'Juan Dela Cruz',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  accountName: string;

  @ApiProperty({
    description: 'Branch name (optional)',
    example: 'Makati Branch',
    maxLength: 100,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  branch?: string;
}

