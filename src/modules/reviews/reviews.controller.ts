import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiQuery, ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ProviderResponseDto } from './dto/provider-response.dto';
import { ReviewResponseDto } from './dto/review-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';

@ApiTags('reviews')
@Controller('reviews')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('latest')
  @ApiOperation({ summary: 'Get latest reviews (limit supported)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '가져올 최근 리뷰 개수 (기본값: 5)',
    example: 10,
  })
  @ApiOkResponse({ 
    description: 'Latest review list returned',
    type: [ReviewResponseDto],
  })
  findLatest(@Query('limit') limit?: string) {
    const parsedLimit = limit ? Number(limit) : 5;
    return this.reviewsService.findLatest(parsedLimit);
  }

  @Get('booking/:bookingId')
  @ApiOperation({ summary: 'Get reviews by booking' })
  @ApiOkResponse({ description: 'Review list returned' })
  findByBooking(@Param('bookingId') bookingId: string) {
    return this.reviewsService.findByBooking(bookingId);
  }

  @Post()
  @ApiOperation({ summary: 'Create review (consumer only)' })
  @ApiBody({
    type: CreateReviewDto,
    examples: {
      reviewCreateExample: {
        summary: '리뷰 생성 예시',
        value: {
          bookingId: '55d7133a-7df4-4c8e-8226-f75c6887c854',
          overallRating: 5,
          ratings: {
            quality: 5,
            communication: 4,
            punctuality: 5,
            professionalism: 5,
          },
          reviewText: 'Great service!',
          photoUris: [],
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Review created successfully', type: ReviewResponseDto })
  create(@GetUser() user: any, @Body() createReviewDto: CreateReviewDto) {
    return this.reviewsService.create(user.id, createReviewDto);
  }

  @Post(':reviewId/provider-response')
  @ApiOperation({ summary: 'Add provider response to a review' })
  @ApiBody({
    type: ProviderResponseDto,
    examples: {
      providerResponseExample: {
        summary: '제공자 답글 등록',
        value: {
          providerResponse: 'Thank you for your feedback!',
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Provider response saved successfully', type: ReviewResponseDto })
  addProviderResponse(
    @GetUser() user: any,
    @Param('reviewId') reviewId: string,
    @Body() providerResponseDto: ProviderResponseDto,
  ) {
    return this.reviewsService.addProviderResponse(user.id, reviewId, providerResponseDto);
  }

  @Get('users/:userId')
  @ApiOperation({ summary: 'Get reviews by user' })
  @ApiOkResponse({ description: 'Review list returned' })
  findByUser(@Param('userId') userId: string) {
    return this.reviewsService.findByUser(userId);
  }
}
