import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import {
  ArtisanDetailDto,
  ArtisanProductsResponseDto,
  ArtisansCatalogQueryDto,
  ArtisansCatalogResponseDto,
} from './dto/catalog.dto';
import { CatalogService } from './catalog.service';

@ApiTags('Catalog — Artisans')
@ApiBearerAuth()
@Public()
@Controller('artisans')
export class CatalogArtisansController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  @ApiOperation({
    summary: 'Lister les artisans (catalogue)',
    description:
      "liste pour sélecteurs (ex. artisan favori), identifiants publics type a2, a3017",
  })
  @ApiQuery({ name: 'limit', required: false, example: 200 })
  @ApiOkResponse({ type: ArtisansCatalogResponseDto })
  async list(
    @Query() query: ArtisansCatalogQueryDto,
  ): Promise<ArtisansCatalogResponseDto> {
    return this.catalogService.listArtisans(query.limit);
  }

  @Get(':artisanId')
  @ApiOperation({
    summary: 'Détail artisan',
    description: 'retourne les informations de mise en avant de l’artisan',
  })
  @ApiOkResponse({ type: ArtisanDetailDto })
  async detail(@Param('artisanId') artisanId: string): Promise<ArtisanDetailDto> {
    return this.catalogService.getArtisanDetail(artisanId);
  }

  @Get(':artisanId/products')
  @ApiOperation({
    summary: 'Produits de cet artisan',
    description: 'retourne les créations associées à un artisan',
  })
  @ApiOkResponse({ type: ArtisanProductsResponseDto })
  async products(
    @Param('artisanId') artisanId: string,
  ): Promise<ArtisanProductsResponseDto> {
    return this.catalogService.getArtisanProducts(artisanId);
  }
}
