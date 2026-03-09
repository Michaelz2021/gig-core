import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { ConsumerProviderService } from './consumer-provider.service';
import { AddFavoriteDto } from './dto/add-favorite.dto';
import { AddReactionDto } from './dto/add-reaction.dto';

@ApiTags('consumer-provider')
@Controller('consumer-provider')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class ConsumerProviderController {
  constructor(private readonly service: ConsumerProviderService) {}

  @Post('favorites')
  @ApiOperation({ summary: 'Add provider to favorites' })
  async addFavorite(@GetUser() user: { id: string }, @Body() dto: AddFavoriteDto) {
    return this.service.addFavorite(user.id, dto.providerId);
  }

  @Delete('favorites/:providerId')
  @ApiOperation({ summary: 'Remove provider from favorites' })
  @ApiParam({ name: 'providerId', description: 'Provider ID (providers.id)' })
  async removeFavorite(@GetUser() user: { id: string }, @Param('providerId') providerId: string) {
    await this.service.removeFavorite(user.id, providerId);
    return { success: true };
  }

  @Get('favorites')
  @ApiOperation({ summary: 'Get my favorites list' })
  async getFavorites(@GetUser() user: { id: string }) {
    return this.service.getFavorites(user.id);
  }

  @Get('favorites/check/:providerId')
  @ApiOperation({ summary: 'Check if provider is in favorites' })
  @ApiParam({ name: 'providerId', description: 'Provider ID' })
  async checkFavorite(@GetUser() user: { id: string }, @Param('providerId') providerId: string) {
    return this.service.checkFavorite(user.id, providerId);
  }

  @Post('reactions/like')
  @ApiOperation({ summary: 'Like provider' })
  async addLike(@GetUser() user: { id: string }, @Body() dto: AddReactionDto) {
    return this.service.addReaction(user.id, dto.providerId, 'like');
  }

  @Delete('reactions/like/:providerId')
  @ApiOperation({ summary: 'Remove like' })
  @ApiParam({ name: 'providerId' })
  async removeLike(@GetUser() user: { id: string }, @Param('providerId') providerId: string) {
    await this.service.removeReaction(user.id, providerId, 'like');
    return { success: true };
  }

  @Get('reactions/like')
  @ApiOperation({ summary: 'Get my like list' })
  async getLikes(@GetUser() user: { id: string }) {
    return this.service.getMyReactions(user.id, 'like');
  }

  @Post('reactions/recommend')
  @ApiOperation({ summary: 'Recommend provider' })
  async addRecommend(@GetUser() user: { id: string }, @Body() dto: AddReactionDto) {
    return this.service.addReaction(user.id, dto.providerId, 'recommend', {
      note: dto.note,
      bookingId: dto.bookingId,
      isPublic: dto.isPublic,
    });
  }

  @Delete('reactions/recommend/:providerId')
  @ApiOperation({ summary: 'Remove recommend' })
  @ApiParam({ name: 'providerId' })
  async removeRecommend(@GetUser() user: { id: string }, @Param('providerId') providerId: string) {
    await this.service.removeReaction(user.id, providerId, 'recommend');
    return { success: true };
  }

  @Get('reactions/recommend')
  @ApiOperation({ summary: 'Get my recommend list' })
  async getRecommends(@GetUser() user: { id: string }) {
    return this.service.getMyReactions(user.id, 'recommend');
  }

  @Get('stats/:providerId')
  @ApiOperation({ summary: 'Get provider social stats' })
  @ApiParam({ name: 'providerId' })
  async getStats(@Param('providerId') providerId: string) {
    return this.service.getStats(providerId);
  }

  @Get('me/state/:providerId')
  @ApiOperation({ summary: 'Get my state for a provider (favorite, like, recommend)' })
  @ApiParam({ name: 'providerId' })
  async getMyState(@GetUser() user: { id: string }, @Param('providerId') providerId: string) {
    return this.service.getMyState(user.id, providerId);
  }
}
