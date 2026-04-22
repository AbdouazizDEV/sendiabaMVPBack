import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  ProductsCatalogQueryDto,
  ProductsCatalogResponseDto,
} from './dto/catalog.dto';
import { CatalogService } from './catalog.service';

@ApiTags('Catalog — Products')
@ApiBearerAuth()
@Controller('products')
export class CatalogProductsController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  @ApiOperation({
    summary: 'Lister les produits (catalogue)',
    description:
      'liste pour sélecteurs (favoris), identifiants publics type p1, p12',
  })
  @ApiQuery({ name: 'limit', required: false, example: 500 })
  @ApiOkResponse({ type: ProductsCatalogResponseDto })
  async list(
    @Query() query: ProductsCatalogQueryDto,
  ): Promise<ProductsCatalogResponseDto> {
    return this.catalogService.listProducts(query.limit);
  }
}
