import {
  BrandTicker,
  Category,
  ContentEntry,
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

/** Ligne artisan + profil pour la section homepage (ordre conservé). */
export interface HomepageFeaturedArtisanRow {
  id: string;
  referenceCode: string;
  displayName: string;
  profile: {
    city: string | null;
    craft: string | null;
    speciality: string | null;
    heritage: string | null;
    quote: string | null;
    avatarUrl: string | null;
  } | null;
}

export interface IHomeRepository {
  findHero(): Promise<HomepageHero | null>;
  findBrandTicker(): Promise<BrandTicker | null>;
  findCategories(): Promise<Category[]>;
  findProductsByCategory(categorySlug: string, limit: number): Promise<HomeProduct[]>;
  findFeaturedProducts(limit: number): Promise<HomeProduct[]>;
  findPromoBanner(): Promise<PromoBanner | null>;
  findArtisans(limit: number): Promise<Array<Pick<User, 'id' | 'referenceCode' | 'displayName'>>>;
  findHomepageFeaturedArtisans(): Promise<HomepageFeaturedArtisanRow[]>;
  findStats(): Promise<Stats[]>;
  findPress(): Promise<PressItem[]>;
  findContentEntriesByScope(scope: string): Promise<ContentEntry[]>;
}

export const HOME_REPOSITORY = Symbol('IHomeRepository');
