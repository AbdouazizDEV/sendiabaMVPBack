import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { memoryStorage } from 'multer';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import {
  BackofficeArtisanDto,
  BackofficeArtisansListResponseDto,
  BackofficeArtisansQueryDto,
  UpdateArtisanStatusDto,
  UpdateArtisanStatusResponseDto,
  UpdateBackofficeArtisanDto,
  UpdateBackofficeArtisanResponseDto,
  UploadArtisanPhotoResponseDto,
} from './dto/backoffice-artisans.dto';
import { BackofficeArtisansService } from './backoffice-artisans.service';

@ApiTags('Backoffice Artisans')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('backoffice/artisans')
export class BackofficeArtisansController {
  constructor(
    private readonly backofficeArtisansService: BackofficeArtisansService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Lister les artisans',
    description:
      'comptes utilisateurs avec le role ARTISAN (table users), filtres recherche et statut',
  })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false, example: 'Actif' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiOkResponse({ type: BackofficeArtisansListResponseDto })
  async list(
    @Query() query: BackofficeArtisansQueryDto,
  ): Promise<BackofficeArtisansListResponseDto> {
    return this.backofficeArtisansService.list(query);
  }

  @Get(':artisanId')
  @ApiParam({ name: 'artisanId', example: 'USR-5001' })
  @ApiOperation({
    summary: "Détail d'un artisan",
    description:
      "récupère toutes les infos d un artisan avant modification",
  })
  @ApiOkResponse({ type: BackofficeArtisanDto })
  async findOne(@Param('artisanId') artisanId: string): Promise<BackofficeArtisanDto> {
    return this.backofficeArtisansService.findOne(artisanId);
  }

  @Put(':artisanId')
  @ApiParam({ name: 'artisanId', example: 'USR-5001' })
  @ApiOperation({
    summary: 'Mettre à jour un artisan',
    description:
      'enregistre les changements faits dans la modale (nom, métier, email, bio, statut, etc.)',
  })
  @ApiBody({ type: UpdateBackofficeArtisanDto })
  @ApiOkResponse({ type: UpdateBackofficeArtisanResponseDto })
  async update(
    @Param('artisanId') artisanId: string,
    @Body() dto: UpdateBackofficeArtisanDto,
  ): Promise<UpdateBackofficeArtisanResponseDto> {
    return this.backofficeArtisansService.update(artisanId, dto);
  }

  @Post(':artisanId/photo')
  @ApiParam({ name: 'artisanId', example: 'USR-5001' })
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload photo artisan',
    description:
      "envoie un fichier image et retourne l URL finale à stocker dans photoUrl",
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOkResponse({ type: UploadArtisanPhotoResponseDto })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadPhoto(
    @Param('artisanId') artisanId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadArtisanPhotoResponseDto> {
    return this.backofficeArtisansService.saveUploadedPhoto(artisanId, file);
  }

  @Patch(':artisanId/status')
  @ApiParam({ name: 'artisanId', example: 'USR-5001' })
  @ApiOperation({
    summary: 'Changer uniquement le statut artisan',
    description:
      'met à jour rapidement le statut (Actif, En attente, Suspendu) sans renvoyer tout le profil',
  })
  @ApiBody({ type: UpdateArtisanStatusDto })
  @ApiOkResponse({ type: UpdateArtisanStatusResponseDto })
  async updateStatus(
    @Param('artisanId') artisanId: string,
    @Body() dto: UpdateArtisanStatusDto,
  ): Promise<UpdateArtisanStatusResponseDto> {
    return this.backofficeArtisansService.updateStatus(artisanId, dto.status);
  }
}
