import { ApiProperty } from '@nestjs/swagger';

/**
 * Project/order execution stats for app dashboard.
 * Provider: inProgress, pending, completed, active, totalBids (posted/purchased/spent=0).
 * Consumer: inProgress, pending, completed, active, posted, purchased, spent (totalBids=0).
 */
export class ProjectOrderStatsDto {
  @ApiProperty({ example: 0, description: 'In-progress bookings/orders count' })
  inProgress: number;

  @ApiProperty({ example: 0, description: 'Pending bookings/orders' })
  pending: number;

  @ApiProperty({ example: 0, description: 'Submitted quotes/bids count (provider)' })
  totalBids: number;

  @ApiProperty({ example: 0, description: 'Completed bookings/orders count' })
  completed: number;

  @ApiProperty({ example: 0, description: 'Posted listings count (consumer, auctions)' })
  posted: number;

  @ApiProperty({ example: 0, description: 'Purchased count (consumer)' })
  purchased: number;

  @ApiProperty({ example: 0, description: 'Active count (same as inProgress)' })
  active: number;

  @ApiProperty({ example: 0, description: 'Consumer total spend (sum of completed booking total_amount)' })
  spent: number;
}
