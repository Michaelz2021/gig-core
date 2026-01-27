import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { ServiceCategory } from './entities/service-category.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { SearchServiceDto } from './dto/search-service.dto';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(ServiceCategory)
    private readonly categoryRepository: Repository<ServiceCategory>,
  ) {}

  async create(providerId: string, createServiceDto: CreateServiceDto): Promise<Service> {
    const service = this.serviceRepository.create({
      ...createServiceDto,
      providerId,
    });
    return this.serviceRepository.save(service);
  }

  async findAll(searchDto: SearchServiceDto = {}): Promise<{
    items: Service[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { q, category, rateType, minRate, maxRate, page = 1, limit = 20 } = searchDto;
    const query = this.serviceRepository
      .createQueryBuilder('service')
      .where('service.isActive = :isActive', { isActive: true });

    if (q) {
      query.andWhere(
        '(service.title LIKE :q OR service.description LIKE :q OR service.category LIKE :q)',
        { q: `%${q}%` },
      );
    }
    if (category) {
      query.andWhere('service.category = :category', { category });
    }
    if (rateType) {
      query.andWhere('service.rateType = :rateType', { rateType });
    }
    if (minRate !== undefined) {
      query.andWhere('service.rate >= :minRate', { minRate });
    }
    if (maxRate !== undefined) {
      query.andWhere('service.rate <= :maxRate', { maxRate });
    }

    const skip = (page - 1) * limit;
    const [items, total] = await query
      .skip(skip)
      .take(limit)
      .orderBy('service.createdAt', 'DESC')
      .getManyAndCount();

    return { items, total, page, limit };
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: { id },
      relations: ['provider'],
    });
    if (!service) {
      throw new Error(`Service with ID ${id} not found`);
    }
    return service;
  }

  async findByProvider(providerId: string): Promise<Service[]> {
    return this.serviceRepository.find({
      where: { providerId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updateData: Partial<Service>): Promise<Service> {
    const service = await this.findOne(id);
    Object.assign(service, updateData);
    return this.serviceRepository.save(service);
  }

  async delete(id: string): Promise<void> {
    const service = await this.findOne(id);
    service.isActive = false;
    await this.serviceRepository.save(service);
  }

  async createCategory(createDto: CreateServiceCategoryDto): Promise<ServiceCategory> {
    const category = this.categoryRepository.create(createDto);
    return this.categoryRepository.save(category);
  }

  async findAllCategories(parentId?: string): Promise<{
    items: ServiceCategory[];
    total: number;
  }> {
    const whereCondition: any = {
      isActive: true,
    };
    if (parentId) {
      whereCondition.parentCategoryId = parentId;
    } else {
      whereCondition.parentCategoryId = null;
    }

    const [items, total] = await this.categoryRepository.findAndCount({
      where: whereCondition,
      order: {
        displayOrder: 'ASC',
        name: 'ASC',
      },
    });

    return { items, total };
  }

  async findCategoryTree(): Promise<any[]> {
    const allCategories = await this.categoryRepository.find({
      where: { isActive: true },
      order: {
        displayOrder: 'ASC',
        name: 'ASC',
      },
    });

    const categoryMap = new Map();
    const rootCategories: any[] = [];

    allCategories.forEach((cat) => {
      categoryMap.set(cat.id, {
        categoryId: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        displayOrder: cat.displayOrder,
        iconUrl: cat.iconUrl || null,
        children: [],
      });
    });

    allCategories.forEach((cat) => {
      const categoryNode = categoryMap.get(cat.id);
      if (cat.parentCategoryId) {
        const parent = categoryMap.get(cat.parentCategoryId);
        if (parent) {
          parent.children.push(categoryNode);
        }
      } else {
        rootCategories.push(categoryNode);
      }
    });

    return rootCategories;
  }

  async findOneCategory(id: string): Promise<ServiceCategory> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });
    if (!category) {
      throw new Error(`Service category with ID ${id} not found`);
    }
    return category;
  }

  async updateCategory(id: string, updateData: Partial<ServiceCategory>): Promise<ServiceCategory> {
    const category = await this.findOneCategory(id);
    Object.assign(category, updateData);
    return this.categoryRepository.save(category);
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await this.findOneCategory(id);
    category.isActive = false;
    await this.categoryRepository.save(category);
  }

  async getAllCategories(): Promise<any> {
    const categories = await this.categoryRepository.query(`
      SELECT 
        id,
        name,
        slug,
        description,
        parent_category_id as "parentCategoryId",
        category_level as "categoryLevel",
        is_active as "isActive",
        display_order as "displayOrder",
        icon_url as "iconUrl",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM service_categories
      ORDER BY category_level ASC, display_order ASC, name ASC
    `);
    return categories;
  }

  async findByCategoryLevel(level: number): Promise<any> {
    const categories = await this.categoryRepository.query(
      `
      SELECT 
        id,
        name,
        slug,
        description,
        parent_category_id as "parentCategoryId",
        category_level as "categoryLevel",
        is_active as "isActive",
        display_order as "displayOrder",
        icon_url as "iconUrl",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM service_categories
      WHERE category_level = $1 AND is_active = true
      ORDER BY display_order ASC, name ASC
    `,
      [level],
    );
    return categories;
  }
}
