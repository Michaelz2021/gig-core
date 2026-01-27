import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsDateString, IsOptional, Min } from 'class-validator';

export class CreateQuoteDto {
  @ApiProperty({
    description: 'Auction ID (required if responding to auction). System will automatically create or find RFQ for this auction.',
    required: false,
    example: 'ebba8380-7e3f-4632-b232-8a118712aeb9',
  })
  @IsString()
  @IsOptional()
  auctionId?: string;

  @ApiProperty({ description: 'Client ID (required if not responding to auction)', required: false })
  @IsString()
  @IsOptional()
  clientId?: string;

  @ApiProperty({ description: 'Provider ID' })
  @IsString()
  providerId: string;

  @ApiProperty({ description: 'Service type' })
  @IsString()
  serviceType: string;

  @ApiProperty({ description: 'Title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Budget' })
  @IsNumber()
  @Min(0)
  budget: number;

  @ApiProperty({ description: 'Timeline', required: false })
  @IsString()
  @IsOptional()
  timeline?: string;

  @ApiProperty({ description: 'Preferred schedule', required: false })
  @IsDateString()
  @IsOptional()
  preferredSchedule?: string;

  @ApiProperty({ description: 'Requirements', required: false, type: [String] })
  @IsArray()
  @IsOptional()
  requirements?: string[];
}
