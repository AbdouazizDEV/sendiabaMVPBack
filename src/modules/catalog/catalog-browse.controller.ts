import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import {
  NewArrivalsQueryDto,
  NewArrivalsResponseDto,
} from './dto/catalog.dto';
import { CatalogService } from './catalog.service';

@ApiTags('Catalog')
@Public()
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
