import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  NewArrivalsQueryDto,
  NewArrivalsResponseDto,
} from './dto/catalog.dto';
import { CatalogService } from './catalog.service';

@ApiTags('Catalog')
@ApiBearerAuth()
@Controller('catalog')
export class CatalogBrowseController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('new-arrivals')
  @ApiOperation({
    summary: 'Nouveautés',
    description: 'produits récents pour la section sous le panier',
  })
  @ApiQuery({ name: 'limit', required: false, example: 4 })
  @ApiOkResponse({ type: NewArrivalsResponseDto })
  async newArrivals(
    @Query() query: NewArrivalsQueryDto,
  ): Promise<NewArrivalsResponseDto> {
    return this.catalogService.listNewArrivals(query.limit);
  }
}
