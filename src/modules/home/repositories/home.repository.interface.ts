import { Artisan, BrandTicker, Category, HomepageHero, PressItem, Product, PromoBanner, Stats } from '@prisma/client';

export interface HomeProduct extends Product {
  artisan: Pick<Artisan, 'id' | 'fullName'>;
}

export interface IHomeRepository {
  findHero(): Promise<HomepageHero | null>;
  findBrandTicker(): Promise<BrandTicker | null>;
  findCategories(): Promise<Category[]>;
  findProductsByCategory(categorySlug: string, limit: number): Promise<HomeProduct[]>;
  findFeaturedProducts(limit: number): Promise<HomeProduct[]>;
  findPromoBanner(): Promise<PromoBanner | null>;
  findArtisans(limit: number): Promise<Artisan[]>;
  findStats(): Promise<Stats[]>;
  findPress(): Promise<PressItem[]>;
}

export const HOME_REPOSITORY = Symbol('IHomeRepository');
