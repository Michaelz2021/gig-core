import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstantServiceList } from './entities/instant-service-list.entity';
import { InstantServiceListController } from './instant-service-list.controller';
import { InstantServiceListService } from './instant-service-list.service';

@Module({
  imports: [TypeOrmModule.forFeature([InstantServiceList])],
  controllers: [InstantServiceListController],
  providers: [InstantServiceListService],
  exports: [InstantServiceListService],
})
export class InstantServiceListModule {}
