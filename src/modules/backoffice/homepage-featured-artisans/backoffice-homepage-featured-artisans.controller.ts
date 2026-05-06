import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { BackofficeHomepageFeaturedArtisansService } from './backoffice-homepage-featured-artisans.service';
import {
  HomepageFeaturedArtisansListResponseDto,
  SetHomepageFeaturedArtisansDto,
  SetHomepageFeaturedArtisansResponseDto,
} from './dto/backoffice-homepage-featured-artisans.dto';

@ApiTags('Backoffice Homepage')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('backoffice/homepage/featured-artisans')
export class BackofficeHomepageFeaturedArtisansController {
  constructor(
    private readonly featuredArtisansService: BackofficeHomepageFeaturedArtisansService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Liste des artisans mis en avant (homepage)',
    description:
      'Ordre d’affichage pour GET /api/v1/home/artisans. Vide = la home utilise le contenu par défaut.',
  })
  @ApiOkResponse({ type: HomepageFeaturedArtisansListResponseDto })
  async list(): Promise<HomepageFeaturedArtisansListResponseDto> {
    return this.featuredArtisansService.list();
  }

  @Put()
  @ApiOperation({
    summary: 'Définir les artisans mis en avant',
    description:
      'Remplace toute la sélection. L’ordre du tableau est l’ordre sur la homepage (max 20).',
  })
  @ApiBody({ type: SetHomepageFeaturedArtisansDto })
  @ApiOkResponse({ type: SetHomepageFeaturedArtisansResponseDto })
  async setFeatured(
    @Body() dto: SetHomepageFeaturedArtisansDto,
  ): Promise<SetHomepageFeaturedArtisansResponseDto> {
    return this.featuredArtisansService.setFeatured(dto);
  }
}
