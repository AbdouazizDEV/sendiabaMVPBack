import { Injectable } from '@nestjs/common';
import {
  BrandTicker,
  Category,
  HomepageHero,
  PressItem,
  PromoBanner,
  Stats,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { HomeProduct, IHomeRepository } from './home.repository.interface';

@Injectable()
export class HomePrismaRepository implements IHomeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findHero(): Promise<HomepageHero | null> {
    return this.prisma.homepageHero.findFirst();
  }

  async findBrandTicker(): Promise<BrandTicker | null> {
    return this.prisma.brandTicker.findFirst();
  }

  async findCategories(): Promise<Category[]> {
    return this.prisma.category.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async findProductsByCategory(categorySlug: string, limit: number): Promise<HomeProduct[]> {
    return this.prisma.product.findMany({
      where: { category: { slug: categorySlug } },
      include: { artisan: { select: { id: true, referenceCode: true, displayName: true } } },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findFeaturedProducts(limit: number): Promise<HomeProduct[]> {
    return this.prisma.product.findMany({
      include: { artisan: { select: { id: true, referenceCode: true, displayName: true } } },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPromoBanner(): Promise<PromoBanner | null> {
    return this.prisma.promoBanner.findFirst();
  }

  async findArtisans(limit: number) {
    return this.prisma.user.findMany({
      where: { role: UserRole.ARTISAN },
      orderBy: { createdAt: 'desc' },
      select: { id: true, referenceCode: true, displayName: true },
      take: limit,
    });
  }

  async findStats(): Promise<Stats[]> {
    return this.prisma.stats.findMany({ orderBy: { order: 'asc' } });
  }

  async findPress(): Promise<PressItem[]> {
    return this.prisma.pressItem.findMany({ orderBy: { order: 'asc' } });
  }
}
