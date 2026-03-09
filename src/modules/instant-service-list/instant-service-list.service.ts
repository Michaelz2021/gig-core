import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstantServiceList } from './entities/instant-service-list.entity';

@Injectable()
export class InstantServiceListService {
  constructor(
    @InjectRepository(InstantServiceList)
    private readonly repo: Repository<InstantServiceList>,
  ) {}

  /** is_active = true 인 항목만 display_order 순으로 반환 */
  async findAllActive(): Promise<InstantServiceList[]> {
    return this.repo.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC' },
    });
  }
}
