import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
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
import type { User } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  ArtisanProductsListResponseDto,
  ArtisanProductsQueryDto,
  CreateArtisanProductResponseDto,
  DeleteArtisanProductResponseDto,
  ArtisanProductDetailResponseDto,
  UpdateArtisanProductResponseDto,
  UpsertArtisanProductDto,
} from './dto/artisan-space.dto';
import { ArtisanProductsService } from './artisan-products.service';

@ApiTags('Artisan Space')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.ARTISAN)
@Controller('artisan/products')
export class ArtisanProductsController {
  constructor(private readonly service: ArtisanProductsService) {}

  @Get()
  @ApiOperation({ summary: "Lister les produits de l'artisan connecté" })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false, example: 'maroquinerie' })
  @ApiQuery({ name: 'inStock', required: false, example: true })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiOkResponse({ type: ArtisanProductsListResponseDto })
  async list(@CurrentUser() user: User, @Query() query: ArtisanProductsQueryDto) {
    return this.service.list(user, query);
  }

  @Get(':productId')
  @ApiParam({ name: 'productId', example: 'p12' })
  @ApiOperation({ summary: "Détail d'un produit de l'artisan connecté" })
  @ApiOkResponse({ type: ArtisanProductDetailResponseDto })
  async findOne(@CurrentUser() user: User, @Param('productId') productId: string) {
    return this.service.findOne(user, productId);
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string', nullable: true },
        price: { type: 'number' },
        tag: { type: 'string', nullable: true },
        inStock: { type: 'boolean' },
        categorySlug: { type: 'string', example: 'maroquinerie' },
        subcategorySlug: { type: 'string', nullable: true },
        details: { type: 'array', items: { type: 'string' } },
        file: { type: 'string', format: 'binary' },
      },
      required: ['name', 'price', 'categorySlug'],
    },
  })
  @ApiOkResponse({ type: CreateArtisanProductResponseDto })
  async create(
    @CurrentUser() user: User,
    @Body() dto: UpsertArtisanProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.service.create(user, dto, file);
  }

  @Put(':productId')
  @ApiParam({ name: 'productId', example: 'p12' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string', nullable: true },
        price: { type: 'number' },
        tag: { type: 'string', nullable: true },
        inStock: { type: 'boolean' },
        categorySlug: { type: 'string', example: 'maroquinerie' },
        subcategorySlug: { type: 'string', nullable: true },
        details: { type: 'array', items: { type: 'string' } },
        file: { type: 'string', format: 'binary' },
      },
      required: ['name', 'price', 'categorySlug'],
    },
  })
  @ApiOkResponse({ type: UpdateArtisanProductResponseDto })
  async update(
    @CurrentUser() user: User,
    @Param('productId') productId: string,
    @Body() dto: UpsertArtisanProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.service.update(user, productId, dto, file);
  }

  @Delete(':productId')
  @ApiParam({ name: 'productId', example: 'p12' })
  @ApiOkResponse({ type: DeleteArtisanProductResponseDto })
  async remove(@CurrentUser() user: User, @Param('productId') productId: string) {
    return this.service.remove(user, productId);
  }
}
