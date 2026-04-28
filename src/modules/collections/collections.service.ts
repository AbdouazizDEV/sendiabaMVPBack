import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  parseArtisanPublicId,
  publicArtisanId,
  publicProductId,
} from '../../common/utils/public-ids.util';
import type {
  CategoryCatalogDto,
  CategoryCatalogQueryDto,
  CategoryMetaDto,
  CollectionsHeroDto,
  CollectionsShowcaseCategoriesDto,
} from './dto/collections.dto';

const CATEGORY_COPY: Record<
  string,
  {
    title: string;
    subtitle: string;
    description: string;
    imageUrl: string;
    href: string;
  }
> = {
  maroquinerie: {
    title: 'Maroquinerie & Cuir',
    subtitle: "L'art du cuir ouest-africain",
    description: 'Sacs, portefeuilles et ceintures faconnes par des artisans experts.',
    imageUrl: 'https://cdn.sendiaba.com/categories/maroquinerie.png',
    href: '/collections/maroquinerie',
  },
  maison: {
    title: "Maison & Textile d'Art",
    subtitle: 'Chaleur et symbolisme',
    description: 'Coussins tisses a la main, plaids et pieces maison de caractere.',
    imageUrl: 'https://cdn.sendiaba.com/categories/maison.png',
    href: '/collections/maison',
  },
};

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  getHero(): CollectionsHeroDto {
    return {
      badge: 'Le Catalogue Sendiaba',
      title: 'Nos Collections',
      quote:
        "Le veritable luxe est celui qui porte en lui l'empreinte d'une culture, la noblesse d'une matiere et la passion d'un createur.",
    };
  }

  async getShowcaseCategories(): Promise<CollectionsShowcaseCategoriesDto> {
    const categories = await this.prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
      include: {
        _count: {
          select: { products: true },
        },
      },
      take: 6,
    });

    return {
      items: categories.map((category) => ({
        id: category.slug,
        title: CATEGORY_COPY[category.slug]?.title ?? category.title,
        subtitle: CATEGORY_COPY[category.slug]?.subtitle ?? category.subtitle ?? '',
        description:
          CATEGORY_COPY[category.slug]?.description ?? category.description ?? '',
        imageUrl:
          CATEGORY_COPY[category.slug]?.imageUrl ??
          category.imageUrl ??
          `https://cdn.sendiaba.com/categories/${category.slug}.png`,
        productCount: category._count.products,
        href: CATEGORY_COPY[category.slug]?.href ?? category.href ?? `/collections/${category.slug}`,
      })),
    };
  }

  async getCategoryMeta(categoryId: string): Promise<CategoryMetaDto> {
    const category = await this.prisma.category.findUnique({
      where: { slug: categoryId },
    });
    if (!category) {
      throw new NotFoundException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'Categorie introuvable.',
      });
    }

    return {
      categoryId: category.slug,
      title: CATEGORY_COPY[category.slug]?.title ?? category.title,
      description:
        CATEGORY_COPY[category.slug]?.description ?? category.description ?? '',
      heroImageUrl: `https://cdn.sendiaba.com/categories/${category.slug}-hero.png`,
    };
  }

  async getCategoryCatalog(
    categoryId: string,
    query: CategoryCatalogQueryDto,
  ): Promise<CategoryCatalogDto> {
    const category = await this.prisma.category.findUnique({
      where: { slug: categoryId },
      include: {
        subcategories: { orderBy: { name: 'asc' } },
        products: {
          include: { artisan: { include: { profile: true } }, subcategory: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!category) {
      throw new NotFoundException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'Categorie introuvable.',
      });
    }

    const selectedSubSlugs = this.toCsvList(query.subcategories);
    const selectedArtisanRefs = this.toCsvList(query.artisans)
      .map((id) => parseArtisanPublicId(id))
      .filter((v): v is string => Boolean(v));
    const selectedPriceRange = query.priceRange ?? 'all';
    const inStockOnly = query.inStockOnly ?? false;
    const sort = query.sort ?? 'recent';

    const products = category.products.filter((p) => {
      if (selectedSubSlugs.length > 0 && !selectedSubSlugs.includes(p.subcategory?.slug ?? '')) {
        return false;
      }
      if (selectedArtisanRefs.length > 0 && !selectedArtisanRefs.includes(p.artisan.referenceCode)) {
        return false;
      }
      if (inStockOnly && !p.inStock) {
        return false;
      }
      return this.matchesPriceRange(p.price, selectedPriceRange);
    });

    const sorted = [...products].sort((a, b) => {
      switch (sort) {
        case 'prix_asc':
          return a.price - b.price;
        case 'prix_desc':
          return b.price - a.price;
        case 'nom_asc':
          return a.name.localeCompare(b.name);
        default:
          return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });

    const availableArtisansMap = new Map<string, { id: string; name: string }>();
    for (const p of category.products) {
      availableArtisansMap.set(p.artisan.id, {
        id: publicArtisanId(p.artisan),
        name: p.artisan.displayName,
      });
    }

    return {
      categoryId: category.slug,
      availableFilters: {
        subcategories: category.subcategories.map((s) => s.name),
        artisans: Array.from(availableArtisansMap.values()).sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
        priceRanges: ['all', 'under100', '100-250', '250-500', 'over500'],
      },
      appliedFilters: {
        subcategories: category.subcategories
          .filter((s) => selectedSubSlugs.includes(s.slug))
          .map((s) => s.name),
        artisans: this.toCsvList(query.artisans),
        priceRange: selectedPriceRange,
        inStockOnly,
        sort,
      },
      summary: { totalFound: sorted.length },
      items: sorted.map((p) => ({
        id: publicProductId(p),
        name: p.name,
        price: p.price,
        subcategory: p.subcategory?.name ?? '',
        imageUrl: p.imageUrl ?? `https://cdn.sendiaba.com/products/${publicProductId(p)}.png`,
        tag: p.tag ?? null,
        inStock: p.inStock,
        artisan: {
          id: publicArtisanId(p.artisan),
          name: p.artisan.displayName,
        },
        href: p.href ?? `/produit/${publicProductId(p)}`,
      })),
    };
  }

  private toCsvList(value?: string): string[] {
    if (!value?.trim()) {
      return [];
    }
    return value
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
  }

  private matchesPriceRange(price: number, range: string): boolean {
    if (!range || range === 'all') {
      return true;
    }
    if (range === 'under100') {
      return price < 100;
    }
    if (range === '250-500') {
      return price >= 250 && price <= 500;
    }
    if (range === 'over500') {
      return price > 500;
    }
    const parsed = /^(\d+)-(\d+)$/.exec(range);
    if (!parsed) {
      return true;
    }
    const min = Number(parsed[1]);
    const max = Number(parsed[2]);
    return price >= min && price <= max;
  }
}
