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
  BackofficeCategoriesListResponseDto,
  BackofficeCategoriesQueryDto,
  BackofficeCategoryDto,
  UpsertBackofficeCategoryDto,
} from './dto/backoffice-categories.dto';
import { BackofficeCategoriesService } from './backoffice-categories.service';

@ApiTags('Backoffice Categories')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('backoffice/categories')
export class BackofficeCategoriesController {
  constructor(private readonly categoriesService: BackofficeCategoriesService) {}

  @Get()
  @ApiQuery({ name: 'search', required: false })
  @ApiOkResponse({ type: BackofficeCategoriesListResponseDto })
  async list(
    @Query() query: BackofficeCategoriesQueryDto,
  ): Promise<BackofficeCategoriesListResponseDto> {
    return this.categoriesService.list(query);
  }

  @Get(':id')
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: BackofficeCategoryDto })
  async findOne(@Param('id') id: string): Promise<BackofficeCategoryDto> {
    return this.categoriesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Creer une categorie (option: image multipart)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        slug: { type: 'string' },
        title: { type: 'string' },
        subtitle: { type: 'string' },
        description: { type: 'string' },
        href: { type: 'string' },
        sortOrder: { type: 'number' },
        file: { type: 'string', format: 'binary' },
      },
      required: ['slug', 'title'],
    },
  })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  @ApiOkResponse({ type: BackofficeCategoryDto })
  async create(
    @Body() dto: UpsertBackofficeCategoryDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<BackofficeCategoryDto> {
    return this.categoriesService.create(dto, file);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre a jour une categorie (option: image multipart)' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        slug: { type: 'string' },
        title: { type: 'string' },
        subtitle: { type: 'string' },
        description: { type: 'string' },
        href: { type: 'string' },
        sortOrder: { type: 'number' },
        file: { type: 'string', format: 'binary' },
      },
      required: ['slug', 'title'],
    },
  })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  @ApiOkResponse({ type: BackofficeCategoryDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpsertBackofficeCategoryDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<BackofficeCategoryDto> {
    return this.categoriesService.update(id, dto, file);
  }

  @Delete(':id')
  @ApiParam({ name: 'id' })
  async remove(@Param('id') id: string): Promise<{ success: true }> {
    return this.categoriesService.remove(id);
  }
}

