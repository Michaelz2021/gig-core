import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsNumber, IsBoolean, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SkillTestAnswerItemDto {
  @ApiProperty({ example: 0, description: 'Question index' })
  @IsNumber()
  question_index: number;

  @ApiProperty({ example: 2, description: 'Selected option index' })
  @IsNumber()
  selected_option_index: number;
}

export class SkillTestSubmitDto {
  @ApiProperty({ example: 'aircon_cleaning', description: 'Skill test category' })
  @IsString()
  category: string;

  @ApiProperty({
    type: [SkillTestAnswerItemDto],
    example: [
      { question_index: 0, selected_option_index: 2 },
      { question_index: 1, selected_option_index: 0 },
    ],
    description: 'Answers: question_index and selected_option_index per item',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillTestAnswerItemDto)
  answers: SkillTestAnswerItemDto[];

  @ApiProperty({ example: 420, description: 'Time taken in seconds' })
  @IsNumber()
  @Min(0)
  time_taken_seconds: number;

  @ApiProperty({ example: 73, description: 'Score 0-100' })
  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;

  @ApiProperty({ example: true, description: 'Whether the test was passed' })
  @IsBoolean()
  passed: boolean;

  @ApiProperty({ example: 11, description: 'Number of correct answers' })
  @IsNumber()
  @Min(0)
  correct_count: number;

  @ApiProperty({ example: 15, description: 'Total number of questions' })
  @IsNumber()
  @Min(1)
  total_questions: number;
}

/** Response data for POST /users/providers/verification/skill-test/submit */
export class SkillTestSubmitDataDto {
  @ApiProperty({ format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000', description: 'Result identifier' })
  result_id: string;

  @ApiProperty({ example: true })
  passed: boolean;

  @ApiProperty({ example: 73 })
  score: number;

  @ApiProperty({ example: 11 })
  correct_count: number;

  @ApiProperty({ example: 15 })
  total_questions: number;

  @ApiProperty({ format: 'date-time', example: '2025-03-11T12:00:00.000Z' })
  recorded_at: string;
}

/** Swagger 응답 스키마: POST /users/providers/verification/skill-test/submit */
export class SkillTestSubmitResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: SkillTestSubmitDataDto })
  data: SkillTestSubmitDataDto;
}
