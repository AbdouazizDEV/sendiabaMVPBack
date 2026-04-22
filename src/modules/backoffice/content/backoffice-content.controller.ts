import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import type { User } from '@prisma/client';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import {
  BulkContentBodyDto,
  BulkContentResponseDto,
  ClearOverrideResponseDto,
  ContentEntriesListResponseDto,
  ContentEntriesQueryDto,
  ContentEntryDetailDto,
  UpdateContentEntryBodyDto,
  UpdateContentEntryResponseDto,
} from './dto/backoffice-content.dto';
import { BackofficeContentService } from './backoffice-content.service';

@ApiTags('Backoffice Content')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('backoffice/content-entries')
export class BackofficeContentController {
  constructor(private readonly backofficeContentService: BackofficeContentService) {}

  @Get()
  @ApiOperation({
    summary: 'Lister les entrees de contenu',
    description:
      'retourne les textes editables avec filtre scope et recherche (pagination)',
  })
  @ApiQuery({ name: 'scope', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiOkResponse({ type: ContentEntriesListResponseDto })
  async list(
    @Query() query: ContentEntriesQueryDto,
  ): Promise<ContentEntriesListResponseDto> {
    return this.backofficeContentService.list(query);
  }

  @Put('bulk')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Sauvegarde bulk des entrees',
    description:
      'enregistre plusieurs changements en une seule requete (bouton Enregistrer tout)',
  })
  @ApiBody({ type: BulkContentBodyDto })
  @ApiOkResponse({ type: BulkContentResponseDto })
  async bulk(
    @Body() dto: BulkContentBodyDto,
    @CurrentUser() user: User,
  ): Promise<BulkContentResponseDto> {
    return this.backofficeContentService.bulkUpdate(dto, user);
  }

  @Get(':key')
  @ApiParam({ name: 'key', example: 'home.hero.title' })
  @ApiOperation({
    summary: 'Lire une entree precise',
    description: 'recupere le detail d une cle pour la modale d edition',
  })
  @ApiOkResponse({ type: ContentEntryDetailDto })
  async findOne(@Param('key') key: string): Promise<ContentEntryDetailDto> {
    return this.backofficeContentService.findOne(decodeURIComponent(key));
  }

  @Put(':key')
  @HttpCode(200)
  @ApiParam({ name: 'key', example: 'home.hero.title' })
  @ApiOperation({
    summary: 'Mettre a jour une entree',
    description: 'enregistre la nouvelle valeur editée dans la modale',
  })
  @ApiBody({ type: UpdateContentEntryBodyDto })
  @ApiOkResponse({ type: UpdateContentEntryResponseDto })
  async update(
    @Param('key') key: string,
    @Body() dto: UpdateContentEntryBodyDto,
    @CurrentUser() user: User,
  ): Promise<UpdateContentEntryResponseDto> {
    return this.backofficeContentService.update(
      decodeURIComponent(key),
      dto,
      user,
    );
  }

  @Delete(':key/override')
  @HttpCode(200)
  @ApiParam({ name: 'key', example: 'home.hero.title' })
  @ApiOperation({
    summary: 'Reinitialiser une entree',
    description:
      'supprime la personnalisation et remet automatiquement le defaultValue',
  })
  @ApiOkResponse({ type: ClearOverrideResponseDto })
  async clearOverride(
    @Param('key') key: string,
  ): Promise<ClearOverrideResponseDto> {
    return this.backofficeContentService.clearOverride(decodeURIComponent(key));
  }
}
