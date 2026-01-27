import { Controller, Get, UseGuards, Query, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('categories')
@Controller('categories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get category list (default: full hierarchy, if parentId specified: only children of that parent)' })
  @ApiQuery({ name: 'parentId', required: false, description: 'Parent category ID (if specified, returns only children of that parent, otherwise returns full hierarchy)' })
  @ApiQuery({ name: 'flat', required: false, description: 'If true, returns flat structure (not hierarchical)' })
  @ApiOkResponse({ description: 'Category list returned' })
  findAll(@Query('parentId') parentId?: string, @Query('flat') flat?: string) {
    // If parentId is specified, return only children of that parent
    if (parentId) {
      return this.categoriesService.findAll(parentId);
    }
    // If flat=true, return flat structure
    if (flat === 'true') {
      return this.categoriesService.findAll();
    }
    // Default: return full hierarchy
    return this.categoriesService.findTree();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get specific category details (including grandchild categories)' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiOkResponse({ description: 'Category details returned' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }
}

