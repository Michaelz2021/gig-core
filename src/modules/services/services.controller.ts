import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Query,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { SearchServiceDto } from './dto/search-service.dto';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('services')
@Controller('services')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @ApiOperation({ summary: 'Create service' })
  @ApiResponse({ status: 201, description: 'Service created successfully' })
  async create(@GetUser() user: any, @Body() createServiceDto: CreateServiceDto) {
    return this.servicesService.create(user.id, createServiceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get service list' })
  @ApiResponse({ status: 200, description: 'Service list returned' })
  findAll(@Query() searchDto: SearchServiceDto) {
    return this.servicesService.findAll(searchDto);
  }

  @Post('search')
  @ApiOperation({ summary: 'Search services' })
  @ApiResponse({ status: 200, description: 'Search results returned' })
  search(@Body() searchDto: SearchServiceDto) {
    return this.servicesService.findAll(searchDto);
  }

  @Get('provider/:providerId')
  @ApiOperation({ summary: 'Get services by provider' })
  @ApiParam({ name: 'providerId', description: 'Provider ID' })
  @ApiResponse({ status: 200, description: 'Services returned' })
  findByProvider(@Param('providerId') providerId: string) {
    return this.servicesService.findByProvider(providerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID' })
  @ApiParam({ name: 'id', description: 'Service ID' })
  @ApiResponse({ status: 200, description: 'Service returned' })
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update service' })
  @ApiParam({ name: 'id', description: 'Service ID' })
  @ApiResponse({ status: 200, description: 'Service updated' })
  update(@Param('id') id: string, @Body() updateData: Partial<CreateServiceDto>) {
    return this.servicesService.update(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete service' })
  @ApiParam({ name: 'id', description: 'Service ID' })
  @ApiResponse({ status: 200, description: 'Service deleted' })
  remove(@Param('id') id: string) {
    return this.servicesService.delete(id);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create service category' })
  @ApiResponse({ status: 201, description: 'Category created' })
  createCategory(@Body() createDto: CreateServiceCategoryDto) {
    return this.servicesService.createCategory(createDto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get service categories' })
  @ApiQuery({ name: 'parentId', required: false, description: 'Parent category ID' })
  @ApiResponse({ status: 200, description: 'Categories returned' })
  findAllCategories(@Query('parentId') parentId?: string) {
    return this.servicesService.findAllCategories(parentId);
  }

  @Public()
  @Get('category_level/:level')
  @ApiOperation({
    summary: 'Get service categories by category level (Public)',
    description: 'Returns all service categories that match the specified category level (1, 2, 3, or 4). This endpoint is public and does not require authentication.',
  })
  @ApiParam({ name: 'level', description: 'Category level (1-4)', type: String })
  @ApiResponse({ status: 200, description: 'Categories returned' })
  findByCategoryLevel(@Param('level') level: string) {
    const levelNumber = parseInt(level, 10);
    if (isNaN(levelNumber) || levelNumber < 1 || levelNumber > 4) {
      throw new Error('Category level must be between 1 and 4');
    }
    return this.servicesService.findByCategoryLevel(levelNumber);
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category returned' })
  findOneCategory(@Param('id') id: string) {
    return this.servicesService.findOneCategory(id);
  }

  @Put('categories/:id')
  @ApiOperation({ summary: 'Update category' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category updated' })
  updateCategory(@Param('id') id: string, @Body() updateData: Partial<CreateServiceCategoryDto>) {
    return this.servicesService.updateCategory(id, updateData);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete category' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category deleted' })
  deleteCategory(@Param('id') id: string) {
    return this.servicesService.deleteCategory(id);
  }
}
