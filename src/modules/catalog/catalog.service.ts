import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { formatArtisanLocation } from '../../common/utils/artisan-location.util';
import { publicArtisanId, publicProductId } from '../../common/utils/public-ids.util';
import type {
  ArtisansCatalogResponseDto,
  NewArrivalsResponseDto,
  ProductsCatalogResponseDto,
} from './dto/catalog.dto';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listArtisans(limit: number): Promise<ArtisansCatalogResponseDto> {
    const rows = await this.prisma.artisan.findMany({
      orderBy: { fullName: 'asc' },
      take: limit,
    });

    return {
      items: rows.map((a) => ({
        id: publicArtisanId(a),
        name: a.fullName,
        title: a.craft,
        location: formatArtisanLocation(a.city),
        bio: a.bio ?? '',
        imageUrl:
          a.photoUrl ?? `https://cdn.sendiaba.com/artisans/${publicArtisanId(a)}.png`,
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
}
