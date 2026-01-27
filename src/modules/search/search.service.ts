import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ServicesService } from '../services/services.service';

@Injectable()
export class SearchService {
  constructor(
    private readonly usersService: UsersService,
    private readonly servicesService: ServicesService,
  ) {}

  async search(query: {
    q?: string;
    type?: 'PROVIDER' | 'SERVICE' | 'CATEGORY';
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    minTrustScore?: number;
    page?: number;
    limit?: number;
  }) {
    const {
      q,
      type,
      location,
      minPrice,
      maxPrice,
      minTrustScore,
      page = 1,
      limit = 20,
    } = query;

    const results: any[] = [];

    // Search providers
    if (!type || type === 'PROVIDER') {
      const providers = await this.usersService.findAllProviders({
        location,
        minTrustScore,
        maxPrice,
        page,
        limit,
      });
      
      if (q) {
        providers.providers = providers.providers.filter((p: any) =>
          `${p.firstName} ${p.lastName}`.toLowerCase().includes(q.toLowerCase()) ||
          p.title?.toLowerCase().includes(q.toLowerCase())
        );
      }

      results.push(
        ...providers.providers.map((p: any) => ({
          type: 'PROVIDER',
          id: p.providerId,
          name: `${p.firstName} ${p.lastName}`,
          title: p.title,
          trustScore: p.trustScore,
          rating: p.rating,
          hourlyRate: p.hourlyRate,
          location: p.location,
        }))
      );
    }

    // Search services
    if (!type || type === 'SERVICE') {
      const services = await this.servicesService.findAll({
        q,
        minRate: minPrice,
        maxRate: maxPrice,
        page,
        limit,
      });

      results.push(
        ...services.items.map((s: any) => ({
          type: 'SERVICE',
          id: s.id,
          name: s.title,
          title: s.description,
          trustScore: s.provider?.trustScore || 0,
          rating: s.averageRating || 0,
          price: s.rate,
          location: 'Philippines',
        }))
      );
    }

    // Search categories
    if (!type || type === 'CATEGORY') {
      const categories = await this.servicesService.findAllCategories();
      
      if (q) {
        categories.items = categories.items.filter((c: any) =>
          c.name.toLowerCase().includes(q.toLowerCase())
        );
      }

      results.push(
        ...categories.items.map((c: any) => ({
          type: 'CATEGORY',
          id: c.id,
          name: c.name,
          title: c.description,
          trustScore: 0,
          rating: 0,
          price: 0,
          location: '',
        }))
      );
    }

    return {
      results,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(results.length / limit),
        totalItems: results.length,
        hasNext: page < Math.ceil(results.length / limit),
        hasPrev: page > 1,
      },
    };
  }
}

