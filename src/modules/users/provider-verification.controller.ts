import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import {
  PortfolioVerificationDto,
  PortfolioVerificationResponseDto,
} from './dto/portfolio-verification.dto';
import { PortfolioVerificationService } from './services/portfolio-verification.service';

@ApiTags('provider')
@Controller('provider')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class ProviderVerificationController {
  constructor(private readonly portfolioVerificationService: PortfolioVerificationService) {}

  @Post('verification/portfolio')
  @ApiOperation({
    summary: 'Submit portfolio / verification data',
    description:
      'Update provider profile with business info, certifications, portfolio photos, availability, and notification preferences. All fields map to providers table.',
  })
  @ApiBody({
    type: PortfolioVerificationDto,
    examples: {
      full: {
        summary: 'Full example',
        value: {
          businessName: 'ABC Services',
          businessType: 'company',
          vatable: false,
          businessAddress: {
            addressLine1: '123 Main St',
            addressLine2: 'Unit 4',
            city: 'Manila',
            province: 'NCR',
            postalCode: '1000',
            country: 'PH',
          },
          tinNumber: '',
          yearsOfExperience: 5,
          certifications: [
            {
              name: 'TESDA NC II',
              issuer: 'TESDA',
              issueDate: '2023-01-15',
              expiryDate: '2028-01-14',
              certificateUrl: 'https://example.com/cert.pdf',
            },
          ],
          portfolioPhotos: [
            { url: 'https://cdn.example.com/photo1.jpg', caption: 'Aircon cleaning project', uploadedAt: '2025-03-11T10:00:00Z' },
          ],
          isAvailable: true,
          availableDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
          availableHoursStart: '09:00',
          availableHoursEnd: '18:00',
          instantBookingEnabled: false,
          serviceRadiusKm: 10,
          responseTimeMinutes: 30,
          notificationPreferences: { pushEnabled: true, smsEnabled: true, emailEnabled: true },
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Portfolio verification submitted', type: PortfolioVerificationResponseDto })
  @ApiResponse({ status: 403, description: 'Not a provider (provider profile not found for this user)' })
  async submitPortfolio(@GetUser() user: any, @Body() dto: PortfolioVerificationDto) {
    return this.portfolioVerificationService.submitPortfolio(user.id, dto);
  }
}
