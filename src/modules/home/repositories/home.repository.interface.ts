import {
  BrandTicker,
  Category,
  HomepageHero,
  PressItem,
  Product,
  PromoBanner,
  Stats,
  User,
} from '@prisma/client';

export interface HomeProduct extends Product {
  artisan: Pick<User, 'id' | 'referenceCode' | 'displayName'>;
}

export interface IHomeRepository {
  findHero(): Promise<HomepageHero | null>;
  findBrandTicker(): Promise<BrandTicker | null>;
  findCategories(): Promise<Category[]>;
  findProductsByCategory(categorySlug: string, limit: number): Promise<HomeProduct[]>;
  findFeaturedProducts(limit: number): Promise<HomeProduct[]>;
  findPromoBanner(): Promise<PromoBanner | null>;
  findArtisans(limit: number): Promise<Array<Pick<User, 'id' | 'referenceCode' | 'displayName'>>>;
  findStats(): Promise<Stats[]>;
  findPress(): Promise<PressItem[]>;
}

export const HOME_REPOSITORY = Symbol('IHomeRepository');
