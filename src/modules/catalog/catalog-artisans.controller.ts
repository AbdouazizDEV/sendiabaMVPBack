import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  ArtisansCatalogQueryDto,
  ArtisansCatalogResponseDto,
} from './dto/catalog.dto';
import { CatalogService } from './catalog.service';

@ApiTags('Catalog — Artisans')
@ApiBearerAuth()
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
}
