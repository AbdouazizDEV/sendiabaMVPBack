import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import {
  CategoryCatalogDto,
  CategoryCatalogQueryDto,
  CategoryMetaDto,
  CollectionsHeroDto,
  CollectionsShowcaseCategoriesDto,
} from './dto/collections.dto';
import { CollectionsService } from './collections.service';

@ApiTags('Collections')
@Public()
@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get('hero')
  @ApiOperation({
    summary: 'Contenu hero Collections',
    description: 'retourne badge, titre et citation de la section hero collections',
  })
  @ApiOkResponse({ type: CollectionsHeroDto })
  hero(): CollectionsHeroDto {
    return this.collectionsService.getHero();
  }

  @Get('showcase-categories')
  @ApiOperation({
    summary: 'Catégories vitrine collections',
    description:
      'retourne les catégories avec image, textes, lien et compteur de pièces',
  })
  @ApiOkResponse({ type: CollectionsShowcaseCategoriesDto })
  async showcaseCategories(): Promise<CollectionsShowcaseCategoriesDto> {
    return this.collectionsService.getShowcaseCategories();
  }

  @Get(':categoryId/meta')
  @ApiParam({ name: 'categoryId', example: 'maroquinerie' })
  @ApiOperation({
    summary: 'Metadata catégorie',
    description: 'retourne le hero de la catégorie (titre, description, image)',
  })
  @ApiOkResponse({ type: CategoryMetaDto })
  async categoryMeta(
    @Param('categoryId') categoryId: string,
  ): Promise<CategoryMetaDto> {
    return this.collectionsService.getCategoryMeta(categoryId);
  }

  @Get(':categoryId/catalog')
  @ApiParam({ name: 'categoryId', example: 'maroquinerie' })
  @ApiQuery({ name: 'subcategories', required: false, example: 'sacs,ceintures' })
  @ApiQuery({ name: 'artisans', required: false, example: 'a1,a2' })
  @ApiQuery({ name: 'priceRange', required: false, example: '100-250' })
  @ApiQuery({ name: 'inStockOnly', required: false, example: true })
  @ApiQuery({ name: 'sort', required: false, example: 'prix_asc' })
  @ApiOperation({
    summary: 'Catalogue catégorie',
    description:
      'retourne produits filtrés, filtres disponibles/appliqués et compteur de résultats',
  })
  @ApiOkResponse({ type: CategoryCatalogDto })
  async categoryCatalog(
    @Param('categoryId') categoryId: string,
    @Query() query: CategoryCatalogQueryDto,
  ): Promise<CategoryCatalogDto> {
    return this.collectionsService.getCategoryCatalog(categoryId, query);
  }
}
