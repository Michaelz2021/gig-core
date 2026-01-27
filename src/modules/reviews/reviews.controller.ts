import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
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
  @ApiOperation({ summary: 'Get latest 5 reviews' })
  @ApiOkResponse({ 
    description: 'Latest review list returned',
    type: [ReviewResponseDto],
  })
  findLatest() {
    return this.reviewsService.findLatest();
  }

  @Get('booking/:bookingId')
  @ApiOperation({ summary: 'Get reviews by booking' })
  @ApiOkResponse({ description: 'Review list returned' })
  findByBooking(@Param('bookingId') bookingId: string) {
    return this.reviewsService.findByBooking(bookingId);
  }

  @Post()
  @ApiOperation({ summary: 'Create review' })
  @ApiOkResponse({ description: 'Review created successfully' })
  create(@GetUser() user: any, @Body() createReviewDto: CreateReviewDto) {
    return this.reviewsService.create(user.id, createReviewDto);
  }

  @Get('users/:userId')
  @ApiOperation({ summary: 'Get reviews by user' })
  @ApiOkResponse({ description: 'Review list returned' })
  findByUser(@Param('userId') userId: string) {
    return this.reviewsService.findByUser(userId);
  }
}
