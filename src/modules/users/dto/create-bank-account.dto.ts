import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateBankAccountDto {
  @ApiProperty({
    description: '은행명',
    example: 'BDO',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  bankName: string;

  @ApiProperty({
    description: '계좌번호',
    example: '1234567890',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  accountNumber: string;

  @ApiProperty({
    description: '예금주명',
    example: 'Juan Dela Cruz',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  accountName: string;

  @ApiProperty({
    description: '지점명 (선택 사항)',
    example: 'Makati Branch',
    maxLength: 100,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  branch?: string;
}

