import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CloudinaryService } from '../../../common/cloudinary/cloudinary.service';
import { PrismaService } from '../../../database/prisma.service';
import {
  BackofficeCategoriesListResponseDto,
  BackofficeCategoriesQueryDto,
  BackofficeCategoryDto,
  UpsertBackofficeCategoryDto,
} from './dto/backoffice-categories.dto';

@Injectable()
export class BackofficeCategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async list(
    query: BackofficeCategoriesQueryDto,
  ): Promise<BackofficeCategoriesListResponseDto> {
    const rows = await this.prisma.category.findMany({
      where: query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { slug: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: { _count: { select: { products: true } } },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });
    return { items: rows.map((r) => this.toDto(r)) };
  }

  async findOne(id: string): Promise<BackofficeCategoryDto> {
    const row = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!row) {
      throw new NotFoundException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'Categorie introuvable.',
      });
    }
    return this.toDto(row);
  }

  async create(
    dto: UpsertBackofficeCategoryDto,
    file?: Express.Multer.File,
  ): Promise<BackofficeCategoryDto> {
    const imageUrl = file ? await this.uploadImage(dto.slug, file) : null;
    try {
      const created = await this.prisma.category.create({
        data: {
          slug: dto.slug.trim().toLowerCase(),
          title: dto.title.trim(),
          subtitle: dto.subtitle?.trim() || null,
          description: dto.description?.trim() || null,
          href: dto.href?.trim() || `/collections/${dto.slug.trim().toLowerCase()}`,
          imageUrl,
          sortOrder: dto.sortOrder ?? 0,
        },
        include: { _count: { select: { products: true } } },
      });
      return this.toDto(created);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException({
          code: 'CATEGORY_SLUG_EXISTS',
          message: 'Ce slug de categorie existe deja.',
        });
      }
      throw error;
    }
  }

  async update(
    id: string,
    dto: UpsertBackofficeCategoryDto,
    file?: Express.Multer.File,
  ): Promise<BackofficeCategoryDto> {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'Categorie introuvable.',
      });
    }
    const imageUrl = file
      ? await this.uploadImage(dto.slug || existing.slug, file)
      : existing.imageUrl;
    try {
      const updated = await this.prisma.category.update({
        where: { id },
        data: {
          slug: dto.slug.trim().toLowerCase(),
          title: dto.title.trim(),
          subtitle: dto.subtitle?.trim() || null,
          description: dto.description?.trim() || null,
          href: dto.href?.trim() || `/collections/${dto.slug.trim().toLowerCase()}`,
          sortOrder: dto.sortOrder ?? existing.sortOrder,
          imageUrl: imageUrl ?? null,
        },
        include: { _count: { select: { products: true } } },
      });
      return this.toDto(updated);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException({
          code: 'CATEGORY_SLUG_EXISTS',
          message: 'Ce slug de categorie existe deja.',
        });
      }
      throw error;
    }
  }

  async remove(id: string): Promise<{ success: true }> {
    const existing = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!existing) {
      throw new NotFoundException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'Categorie introuvable.',
      });
    }
    if (existing._count.products > 0) {
      throw new BadRequestException({
        code: 'CATEGORY_HAS_PRODUCTS',
        message:
          'Impossible de supprimer une categorie qui contient encore des produits.',
      });
    }
    await this.prisma.category.delete({ where: { id } });
    return { success: true };
  }

  private async uploadImage(slug: string, file: Express.Multer.File) {
    const uploaded = await this.cloudinary.uploadImageBuffer(file.buffer, {
      folder: 'categories',
      publicId: `category-${slug.trim().toLowerCase()}`,
    });
    return uploaded.secureUrl;
  }

  private toDto(row: {
    id: string;
    slug: string;
    title: string;
    subtitle: string | null;
    description: string | null;
    imageUrl: string | null;
    href: string | null;
    sortOrder: number;
    _count: { products: number };
  }): BackofficeCategoryDto {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      subtitle: row.subtitle,
      description: row.description,
      imageUrl: row.imageUrl,
      href: row.href,
      sortOrder: row.sortOrder,
      productCount: row._count.products,
    };
  }
}

