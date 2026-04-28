import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';
import {
  parseProductPublicId,
  publicProductId,
  publicUserId,
} from '../../common/utils/public-ids.util';
import { PrismaService } from '../../database/prisma.service';
import { ArtisanProductsQueryDto, UpsertArtisanProductDto } from './dto/artisan-space.dto';

@Injectable()
export class ArtisanProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async list(user: User, query: ArtisanProductsQueryDto) {
    await this.assertArtisan(user.id);
    const where = {
      artisanId: user.id,
      inStock: query.inStock,
      category: query.category ? { slug: query.category } : undefined,
      OR: query.search
        ? [
            { name: { contains: query.search, mode: 'insensitive' as const } },
            { referenceCode: { contains: query.search, mode: 'insensitive' as const } },
          ]
        : undefined,
    };
    const [rows, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: true, subcategory: true },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.product.count({ where }),
    ]);
    return {
      items: rows.map((p) => ({
        ...this.toProductItem(p, user.referenceCode),
      })),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  async create(user: User, dto: UpsertArtisanProductDto, file?: Express.Multer.File) {
    await this.assertArtisan(user.id);
    const category = await this.prisma.category.findUnique({ where: { slug: dto.categorySlug } });
    if (!category) throw new BadRequestException({ code: 'CATEGORY_NOT_FOUND', message: 'Categorie introuvable.' });
    const subcategory = dto.subcategorySlug
      ? await this.prisma.subcategory.findUnique({
          where: { slug_categoryId: { slug: dto.subcategorySlug, categoryId: category.id } },
        })
      : null;
    const imageUrl = await this.uploadIfAny(user.referenceCode, file);
    const count = await this.prisma.product.count();
    const created = await this.prisma.product.create({
      data: {
        referenceCode: `PRD-${count + 1}`,
        artisanId: user.id,
        categoryId: category.id,
        subcategoryId: subcategory?.id,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        tag: dto.tag,
        inStock: dto.inStock ?? true,
        details: dto.details ?? [],
        imageUrl,
      },
      include: { category: true, subcategory: true },
    });
    return {
      success: true,
      data: this.toProductItem(created, user.referenceCode),
    };
  }

  async findOne(user: User, productId: string) {
    const product = await this.findOwnedProduct(user.id, productId);
    const withRelations = await this.prisma.product.findUniqueOrThrow({
      where: { id: product.id },
      include: { category: true, subcategory: true },
    });
    return { data: this.toProductItem(withRelations, user.referenceCode) };
  }

  async update(user: User, productId: string, dto: UpsertArtisanProductDto, file?: Express.Multer.File) {
    const product = await this.findOwnedProduct(user.id, productId);
    const category = await this.prisma.category.findUnique({ where: { slug: dto.categorySlug } });
    if (!category) throw new BadRequestException({ code: 'CATEGORY_NOT_FOUND', message: 'Categorie introuvable.' });
    const subcategory = dto.subcategorySlug
      ? await this.prisma.subcategory.findUnique({
          where: { slug_categoryId: { slug: dto.subcategorySlug, categoryId: category.id } },
        })
      : null;
    const imageUrl = (await this.uploadIfAny(user.referenceCode, file)) ?? product.imageUrl;
    const updated = await this.prisma.product.update({
      where: { id: product.id },
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        tag: dto.tag,
        inStock: dto.inStock ?? product.inStock,
        details: dto.details ?? product.details,
        categoryId: category.id,
        subcategoryId: subcategory?.id,
        imageUrl,
      },
      include: { category: true, subcategory: true },
    });
    return {
      success: true,
      data: this.toProductItem(updated, user.referenceCode),
    };
  }

  async remove(user: User, productId: string) {
    const product = await this.findOwnedProduct(user.id, productId);
    await this.prisma.product.delete({ where: { id: product.id } });
    return { success: true, data: { id: publicProductId(product), deleted: true } };
  }

  private async findOwnedProduct(userId: string, publicId: string) {
    const ref = parseProductPublicId(publicId);
    if (!ref) throw new BadRequestException({ code: 'INVALID_PRODUCT_ID', message: 'Identifiant produit invalide.' });
    const row = await this.prisma.product.findFirst({ where: { referenceCode: ref, artisanId: userId } });
    if (!row) throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', message: 'Produit introuvable.' });
    return row;
  }

  private async uploadIfAny(referenceCode: string, file?: Express.Multer.File) {
    if (!file?.buffer?.length) return null;
    const uploaded = await this.cloudinary.uploadImageBuffer(file.buffer, {
      folder: `sendiaba/products/${referenceCode}`,
      publicId: `product-${Date.now()}`,
    });
    return uploaded.secureUrl;
  }

  private async assertArtisan(userId: string): Promise<void> {
    const row = await this.prisma.user.findFirst({ where: { id: userId, role: UserRole.ARTISAN } });
    if (!row) {
      throw new NotFoundException({ code: 'ARTISAN_NOT_FOUND', message: 'Artisan introuvable.' });
    }
  }

  private toProductItem(
    p: {
      referenceCode: string;
      name: string;
      price: number;
      imageUrl: string | null;
      inStock: boolean;
      tag: string | null;
      category: { slug: string };
      subcategory: { slug: string } | null;
    },
    artisanReferenceCode: string,
  ) {
    return {
      id: publicProductId(p),
      artisanId: publicUserId({ referenceCode: artisanReferenceCode }),
      name: p.name,
      price: p.price,
      imageUrl: p.imageUrl,
      inStock: p.inStock,
      category: p.category.slug,
      subcategory: p.subcategory?.slug ?? null,
      tag: p.tag ?? null,
    };
  }
}
