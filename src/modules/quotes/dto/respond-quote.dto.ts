import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsDateString, IsOptional, Min } from 'class-validator';

export class RespondQuoteDto {
  @ApiProperty({ description: 'Provider message' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Proposed price', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  proposedPrice?: number;

  @ApiProperty({ description: 'Proposed timeline', required: false })
  @IsString()
  @IsOptional()
  proposedTimeline?: string;

  @ApiProperty({ description: 'Milestones', required: false })
  @IsArray()
  @IsOptional()
  milestones?: Array<{
    name: string;
    description: string;
    price: number;
    dueDate: string;
  }>;
}

