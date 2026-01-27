import { Injectable, NotFoundException } from '@nestjs/common';
import { ServicesService } from '../services/services.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly servicesService: ServicesService) {}

  async findAll(parentId?: string) {
    const result = await this.servicesService.findAllCategories(parentId);
    
    const categories = result.items.map((cat: any) => ({
      categoryId: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      parentCategoryId: cat.parentCategoryId,
      displayOrder: cat.displayOrder,
      iconUrl: cat.iconUrl || null,
      providerCount: 0, // TODO: Calculate from providers
      avgHourlyRate: 0, // TODO: Calculate from services
    }));

    return { categories, total: result.total };
  }

  async findTree() {
    // Return full hierarchy structure
    const tree = await this.servicesService.findCategoryTree();
    return { categories: tree };
  }

  async findOne(id: string) {
    // Get specific category details (including child categories)
    const category = await this.servicesService.findOneCategory(id);
    
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Get child categories
    const childrenResult = await this.servicesService.findAllCategories(id);
    const children = childrenResult.items.map((cat: any) => ({
      categoryId: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      parentCategoryId: cat.parentCategoryId,
      displayOrder: cat.displayOrder,
      iconUrl: cat.iconUrl || null,
      providerCount: 0,
      avgHourlyRate: 0,
    }));

    return {
      categoryId: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      parentCategoryId: category.parentCategoryId,
      displayOrder: category.displayOrder,
      iconUrl: (category as any).iconUrl || null,
      providerCount: 0,
      avgHourlyRate: 0,
      children,
    };
  }
}

