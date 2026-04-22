import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import {
  ProductDetailDto,
  ProductSimilarQueryDto,
  ProductSimilarResponseDto,
  ProductsCatalogQueryDto,
  ProductsCatalogResponseDto,
} from './dto/catalog.dto';
import { CatalogService } from './catalog.service';

@ApiTags('Catalog — Products')
@ApiBearerAuth()
@Public()
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

  @Get(':id')
  @ApiOperation({
    summary: 'Détail produit',
    description: 'retourne les informations principales du produit',
  })
  @ApiOkResponse({ type: ProductDetailDto })
  async detail(@Param('id') id: string): Promise<ProductDetailDto> {
    return this.catalogService.getProductDetail(id);
  }

  @Get(':id/similar')
  @ApiQuery({ name: 'limit', required: false, example: 4 })
  @ApiOperation({
    summary: 'Produits similaires',
    description: 'retourne les produits de la même catégorie',
  })
  @ApiOkResponse({ type: ProductSimilarResponseDto })
  async similar(
    @Param('id') id: string,
    @Query() query: ProductSimilarQueryDto,
  ): Promise<ProductSimilarResponseDto> {
    return this.catalogService.getSimilarProducts(id, query.limit);
  }
}
