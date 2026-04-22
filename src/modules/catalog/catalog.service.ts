import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { formatArtisanLocation } from '../../common/utils/artisan-location.util';
import {
  parseArtisanPublicId,
  parseProductPublicId,
  publicArtisanId,
  publicProductId,
} from '../../common/utils/public-ids.util';
import type {
  ArtisanDetailDto,
  ArtisanProductsResponseDto,
  ArtisansCatalogResponseDto,
  NewArrivalsResponseDto,
  ProductDetailDto,
  ProductSimilarResponseDto,
  ProductsCatalogResponseDto,
} from './dto/catalog.dto';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listArtisans(limit: number): Promise<ArtisansCatalogResponseDto> {
    const rows = await this.prisma.artisan.findMany({
      orderBy: { fullName: 'asc' },
      include: { _count: { select: { products: true } } },
      take: limit,
    });

    return {
      items: rows.map((a) => ({
        id: publicArtisanId(a),
        name: a.fullName,
        title: a.craft,
        location: formatArtisanLocation(a.city),
        heritage: a.heritage ?? '',
        quote: a.quote ?? '',
        bio: a.bio ?? '',
        imageUrl:
          a.photoUrl ?? `https://cdn.sendiaba.com/artisans/${publicArtisanId(a)}.png`,
        speciality: a.speciality ?? a.craft,
        yearsExperience: a.yearsExperience ?? 0,
        productsCount: a._count.products,
      })),
    };
  }

  async listProducts(limit: number): Promise<ProductsCatalogResponseDto> {
    const rows = await this.prisma.product.findMany({
      orderBy: { referenceCode: 'asc' },
      take: limit,
    });

    return {
      items: rows.map((p) => ({
        id: publicProductId(p),
        name: p.name,
        price: p.price,
        imageUrl:
          p.imageUrl ?? `https://cdn.sendiaba.com/products/${publicProductId(p)}.png`,
      })),
    };
  }

  async getProductDetail(productId: string): Promise<ProductDetailDto> {
    const ref = this.parseRequiredProductRef(productId);
    const row = await this.prisma.product.findUnique({
      where: { referenceCode: ref },
      include: { artisan: true, category: true, subcategory: true },
    });
    if (!row) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Produit introuvable.',
      });
    }
    return {
      id: publicProductId(row),
      name: row.name,
      artisanId: publicArtisanId(row.artisan),
      category: row.category.slug,
      subcategory: row.subcategory?.name ?? '',
      price: row.price,
      description: row.description ?? '',
      details: row.details,
      imageUrl:
        row.imageUrl ?? `https://cdn.sendiaba.com/products/${publicProductId(row)}.png`,
      tag: row.tag ?? null,
      inStock: row.inStock,
    };
  }

  async getArtisanDetail(artisanId: string): Promise<ArtisanDetailDto> {
    const ref = parseArtisanPublicId(artisanId);
    if (!ref) {
      throw new BadRequestException({
        code: 'INVALID_ARTISAN_ID',
        message: 'Identifiant artisan invalide.',
      });
    }
    const row = await this.prisma.artisan.findUnique({
      where: { referenceCode: ref },
      include: { _count: { select: { products: true } } },
    });
    if (!row) {
      throw new NotFoundException({
        code: 'ARTISAN_NOT_FOUND',
        message: 'Artisan introuvable.',
      });
    }
    return {
      id: publicArtisanId(row),
      name: row.fullName,
      title: row.craft,
      location: formatArtisanLocation(row.city),
      heritage: row.heritage ?? '',
      quote: row.quote ?? '',
      bio: row.bio ?? '',
      imageUrl:
        row.photoUrl ?? `https://cdn.sendiaba.com/artisans/${publicArtisanId(row)}.png`,
      speciality: row.speciality ?? row.craft,
      yearsExperience: row.yearsExperience ?? 0,
      productsCount: row._count.products,
    };
  }

  async getArtisanProducts(artisanId: string): Promise<ArtisanProductsResponseDto> {
    const ref = parseArtisanPublicId(artisanId);
    if (!ref) {
      throw new BadRequestException({
        code: 'INVALID_ARTISAN_ID',
        message: 'Identifiant artisan invalide.',
      });
    }

    const artisan = await this.prisma.artisan.findUnique({
      where: { referenceCode: ref },
      include: {
        products: {
          include: { category: true },
          orderBy: [{ createdAt: 'desc' }, { referenceCode: 'asc' }],
        },
      },
    });
    if (!artisan) {
      throw new NotFoundException({
        code: 'ARTISAN_NOT_FOUND',
        message: 'Artisan introuvable.',
      });
    }

    return {
      artisanId: publicArtisanId(artisan),
      items: artisan.products.map((p) => ({
        id: publicProductId(p),
        name: p.name,
        category: p.category.slug,
        price: p.price,
        imageUrl:
          p.imageUrl ?? `https://cdn.sendiaba.com/products/${publicProductId(p)}.png`,
        tag: p.tag ?? null,
        inStock: p.inStock,
        href: p.href ?? `/produit/${publicProductId(p)}`,
      })),
    };
  }

  async getSimilarProducts(
    productId: string,
    limit: number,
  ): Promise<ProductSimilarResponseDto> {
    const ref = this.parseRequiredProductRef(productId);
    const origin = await this.prisma.product.findUnique({
      where: { referenceCode: ref },
      include: { category: true },
    });
    if (!origin) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Produit introuvable.',
      });
    }
    const rows = await this.prisma.product.findMany({
      where: {
        categoryId: origin.categoryId,
        NOT: { id: origin.id },
      },
      include: { artisan: true, category: true },
      orderBy: [{ createdAt: 'desc' }, { referenceCode: 'asc' }],
      take: limit,
    });
    return {
      items: rows.map((p) => ({
        id: publicProductId(p),
        name: p.name,
        artisanId: publicArtisanId(p.artisan),
        category: p.category.slug,
        price: p.price,
        imageUrl:
          p.imageUrl ?? `https://cdn.sendiaba.com/products/${publicProductId(p)}.png`,
        tag: p.tag ?? null,
        inStock: p.inStock,
      })),
    };
  }

  async listNewArrivals(limit: number): Promise<NewArrivalsResponseDto> {
    const rows = await this.prisma.product.findMany({
      orderBy: [{ createdAt: 'desc' }, { referenceCode: 'desc' }],
      take: limit,
    });

    return {
      items: rows.map((p) => ({
        id: publicProductId(p),
        name: p.name,
        price: p.price,
        tag: p.tag ?? 'Nouveau',
        imageUrl:
          p.imageUrl ?? `https://cdn.sendiaba.com/products/${publicProductId(p)}.png`,
        href: p.href ?? `/produit/${publicProductId(p)}`,
      })),
    };
  }

  private parseRequiredProductRef(productId: string): string {
    const ref = parseProductPublicId(productId);
    if (!ref) {
      throw new BadRequestException({
        code: 'INVALID_PRODUCT_ID',
        message: 'Identifiant produit invalide.',
      });
    }
    return ref;
  }
}
