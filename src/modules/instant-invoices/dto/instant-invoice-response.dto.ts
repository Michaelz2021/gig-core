import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * GET /instant-invoices 목록 항목 (Swagger 문서용)
 */
export class InstantInvoiceResponseDto {
  @ApiProperty({ example: 'uuid', description: 'Instant invoice ID' })
  id: string;

  @ApiProperty({ description: 'Service listing ID' })
  listingId: string;

  @ApiProperty({ description: 'Consumer user ID' })
  consumerId: string;

  @ApiProperty({ description: 'Provider ID (providers.id)' })
  providerId: string;

  @ApiPropertyOptional({ description: '서비스 리스팅명 (출력용)' })
  listingName: string | null;

  @ApiPropertyOptional({ description: '주문자(소비자) 표시명' })
  consumerName: string | null;

  @ApiPropertyOptional({ description: '프로바이더 표시명' })
  providerName: string | null;

  @ApiProperty({ description: 'Instant booking ID' })
  instantBookingId: string;

  @ApiProperty({ description: 'Service date (YYYY-MM-DD)' })
  serviceDate: string;

  @ApiProperty({ description: 'Service time' })
  serviceTime: string;

  @ApiProperty({ description: 'Service address' })
  serviceAddress: string;

  @ApiPropertyOptional({ nullable: true })
  serviceLat: string | null;

  @ApiPropertyOptional({ nullable: true })
  serviceLng: string | null;

  @ApiPropertyOptional({ enum: ['Home', 'On Site'], description: '서비스 장소 옵션' })
  serviceAddressOption: string | null;

  @ApiProperty({ example: 'FIXED' })
  priceType: string;

  @ApiPropertyOptional({ nullable: true })
  variantId: string | null;

  @ApiPropertyOptional({ type: [String], nullable: true })
  addonItemIds: string[] | null;

  @ApiProperty({ default: 0 })
  extraPersonCount: number;

  @ApiProperty()
  basePrice: string;

  @ApiProperty()
  addonsTotal: string;

  @ApiProperty()
  personFee: string;

  @ApiProperty()
  travelFee: string;

  @ApiProperty()
  finalPrice: string;

  @ApiProperty()
  serviceAmount: string;

  @ApiProperty()
  platformFee: string;

  @ApiPropertyOptional({ nullable: true })
  vatableAmount: string | null;

  @ApiPropertyOptional({ nullable: true })
  vatAmount: string | null;

  @ApiProperty()
  totalAmount: string;

  @ApiPropertyOptional({ nullable: true })
  consumerNotes: string | null;

  @ApiProperty({ example: 'confirmed' })
  bookingStatus: string;

  @ApiProperty({ example: 'pending' })
  paymentStatus: string;

  @ApiProperty({ example: 'pending' })
  settlementStatus: string;

  @ApiPropertyOptional({ nullable: true })
  paymentRef: string | null;

  @ApiPropertyOptional({ nullable: true })
  cancellationReason: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt: Date;
}
