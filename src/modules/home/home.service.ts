import { Inject, Injectable } from '@nestjs/common';
import { formatArtisanLocation } from '../../common/utils/artisan-location.util';
import { publicArtisanId } from '../../common/utils/public-ids.util';
import {
  BrandTickerDto,
  EditorialResponseDto,
  FeaturedProductsResponseDto,
  HomeArtisansResponseDto,
  HomeCategoryItemDto,
  HomeCategoriesDto,
  HomeHeroDto,
  HomeProductDto,
  ManifestoDto,
  NewsletterContentDto,
  PressResponseDto,
  PromoBannerDto,
  SavoirFaireDto,
  ShopProductsResponseDto,
  ShopTabsResponseDto,
  StatsResponseDto,
  TrustBarDto,
} from './dto/home.dto';
import { HOME_REPOSITORY, type IHomeRepository } from './repositories/home.repository.interface';

@Injectable()
export class HomeService {
  constructor(
    @Inject(HOME_REPOSITORY)
    private readonly homeRepository: IHomeRepository,
  ) {}

  async getHero(): Promise<HomeHeroDto> {
    const hero = await this.homeRepository.findHero();
    const get = await this.scopeContentGetter('home');
    return {
      badge: get('home.hero.badge', hero?.badge ?? 'Porte. Pose. Vecu. Fait main.'),
      title: get('home.hero.title', hero?.title ?? "L'ame de l'artisanat africain."),
      cta: get('home.hero.cta', hero?.cta ?? "Decouvrir l'Atelier"),
      backgroundImageUrl: get(
        'home.hero.backgroundImageUrl',
        hero?.backgroundImageUrl ?? 'https://cdn.sendiaba.com/home/hero.png',
      ),
    };
  }

  async getBrandTicker(): Promise<BrandTickerDto> {
    const brandTicker = await this.homeRepository.findBrandTicker();
    const get = await this.scopeContentGetter('home');
    const itemsRaw = get(
      'home.brandTicker.items',
      JSON.stringify(
        brandTicker?.items ?? [
          'Porte',
          'Pose',
          'Vecu',
          'Fait Main',
          "Artisanat d'Excellence",
          "Afrique de l'Ouest",
          'Heritage & Modernite',
          'Pieces Uniques',
          'Tracabilite Totale',
        ],
      ),
    );
    const parsed = this.parseStringArray(itemsRaw);
    return {
      items: parsed.length > 0 ? parsed : ['Porte', 'Pose', 'Vecu', 'Fait Main'],
    };
  }

  async getTrustBar(): Promise<TrustBarDto> {
    const get = await this.scopeContentGetter('home');
    const defaults = [
      {
        title: 'Artisans Certifies',
        desc: 'Chaque createur est verifie et soutenu',
      },
      {
        title: 'Livraison Mondiale',
        desc: 'Vers 40+ pays, emballage artisanal',
      },
      {
        title: 'Authenticite Garantie',
        desc: 'Pieces tracables, histoire verifiable',
      },
      {
        title: 'Retours 30 Jours',
        desc: 'Satisfaction ou remboursement',
      },
    ];
    return {
      items: defaults.map((item, index) => ({
        title: get(`home.trustBar.items.${index}.title`, item.title),
        desc: get(`home.trustBar.items.${index}.desc`, item.desc),
      })),
    };
  }

  async getManifesto(): Promise<ManifestoDto> {
    const get = await this.scopeContentGetter('home');
    return {
      title: get(
        'home.manifesto.title',
        "Nous ne sommes pas une marketplace. Nous sommes un pont culturel entre les maitres artisans d'Afrique et le monde.",
      ),
      paragraphs: [
        get(
          'home.manifesto.paragraphs.0',
          'Chaque objet vendu ici porte une histoire humaine tracable...',
        ),
        get(
          'home.manifesto.paragraphs.1',
          'Nous celebrons le savoir-faire africain avec une exigence absolue...',
        ),
      ],
    };
  }

  async getCategories(): Promise<HomeCategoriesDto> {
    const categories = await this.homeRepository.findCategories();
    const get = await this.scopeContentGetter('home');
    const items: HomeCategoryItemDto[] = categories.map((c) => ({
      id: c.slug,
      title: c.title,
      description: c.description ?? '',
      imageUrl:
        c.imageUrl ?? `https://cdn.sendiaba.com/categories/${c.slug}.png`,
      href: c.href ?? `/collections/${c.slug}`,
    }));

    return {
      title: get('home.categories.title', 'Les Collections'),
      subtitle: get(
        'home.categories.subtitle',
        "L'excellence de l'artisanat ouest-africain, declinee en quatre univers d'exception.",
      ),
      items,
    };
  }

  async getShopTabs(): Promise<ShopTabsResponseDto> {
    const get = await this.scopeContentGetter('home');
    return {
      badge: get('home.shopTabs.badge', 'La Boutique'),
      title: get('home.shopTabs.title', 'Chaque piece, une histoire.'),
      tabs: [
        {
          id: 'maroquinerie',
          label: get('home.shopTabs.tabs.maroquinerie.label', 'Maroquinerie & Cuir'),
          accent: get('home.shopTabs.tabs.maroquinerie.accent', 'Porte'),
        },
        {
          id: 'maison',
          label: get('home.shopTabs.tabs.maison.label', 'Maison & Textile'),
          accent: get('home.shopTabs.tabs.maison.accent', 'Pose'),
        },
        {
          id: 'decoration',
          label: get('home.shopTabs.tabs.decoration.label', 'Decoration & Art'),
          accent: get('home.shopTabs.tabs.decoration.accent', 'Vecu'),
        },
        {
          id: 'coffrets',
          label: get('home.shopTabs.tabs.coffrets.label', 'Coffrets & Cadeaux'),
          accent: get('home.shopTabs.tabs.coffrets.accent', 'Offert'),
        },
      ],
    };
  }

  async getShopProducts(
    category: string | undefined,
    limit: number,
  ): Promise<ShopProductsResponseDto> {
    const selectedCategory = category?.trim().toLowerCase() || 'maroquinerie';
    await this.homeRepository.findProductsByCategory(selectedCategory, limit);
    const catalog: Record<string, HomeProductDto[]> = {
      maroquinerie: [
        {
          id: 'p1',
          name: 'Sac Signature en Cuir',
          price: 350,
          imageUrl: 'https://cdn.sendiaba.com/products/p1.png',
          tag: 'Best-Seller',
          inStock: true,
          href: '/produit/p1',
          artisan: { id: 'a1', name: 'Ibrahima Guèye' },
        },
      ],
      maison: [
        {
          id: 'p2',
          name: 'Plaid Indigo Atelier',
          price: 210,
          imageUrl: 'https://cdn.sendiaba.com/products/p2.png',
          tag: 'Édition Limitée',
          inStock: true,
          href: '/produit/p2',
          artisan: { id: 'a2', name: 'Fatouma Diabaté' },
        },
      ],
      decoration: [
        {
          id: 'p3',
          name: 'Vase Terre de Sine',
          price: 145,
          imageUrl: 'https://cdn.sendiaba.com/products/p3.png',
          tag: 'Nouveau',
          inStock: true,
          href: '/produit/p3',
          artisan: { id: 'a3', name: 'Awa Ndiaye' },
        },
      ],
      coffrets: [
        {
          id: 'p4',
          name: 'Coffret Héritage',
          price: 280,
          imageUrl: 'https://cdn.sendiaba.com/products/p4.png',
          tag: 'Exclusif',
          inStock: true,
          href: '/produit/p4',
          artisan: { id: 'a4', name: 'Moussa Koné' },
        },
      ],
    };
    return {
      category: selectedCategory,
      items: (catalog[selectedCategory] ?? []).slice(0, limit),
    };
  }

  async getPromoBanner(): Promise<PromoBannerDto> {
    const promo = await this.homeRepository.findPromoBanner();
    const get = await this.scopeContentGetter('home');
    return {
      badge: get('home.promo.badge', promo?.badge ?? 'Collection Exclusive'),
      title: get('home.promo.title', promo?.title ?? 'Tabaski 2026 - Edition Limitee'),
      subtitle: get(
        'home.promo.subtitle',
        promo?.subtitle ?? 'Des coffrets et creations artisanales penses...',
      ),
      cta: get('home.promo.cta', promo?.cta ?? 'Decouvrir la Collection'),
      targetDate: get(
        'home.promo.targetDate',
        promo?.targetDate.toISOString() ?? '2026-05-07T00:00:00Z',
      ),
      remainingPieces: this.parseIntValue(
        get(
          'home.promo.remainingPieces',
          String(promo?.remainingPieces ?? 47),
        ),
        promo?.remainingPieces ?? 47,
      ),
      backgroundImageUrl: get(
        'home.promo.backgroundImageUrl',
        promo?.backgroundImageUrl ?? 'https://cdn.sendiaba.com/home/promo.png',
      ),
      href: get('home.promo.href', promo?.href ?? '/collections/coffrets'),
    };
  }

  async getEditorial(): Promise<EditorialResponseDto> {
    const get = await this.scopeContentGetter('home');
    return {
      block1: {
        label: get('home.editorial.block1.label', 'Editorial'),
        title: get('home.editorial.block1.title', 'Le sac qui voyage avec vous'),
        description: get(
          'home.editorial.block1.description',
          'Faconne dans les cuirs les plus nobles...',
        ),
        imageUrl: get(
          'home.editorial.block1.imageUrl',
          'https://cdn.sendiaba.com/home/editorial-1.png',
        ),
        href: get('home.editorial.block1.href', '/collections/maroquinerie'),
      },
      block2: {
        label: get('home.editorial.block2.label', 'Savoir-faire'),
        title: get(
          'home.editorial.block2.title',
          "L'art du tissu, eleve au rang de decoration",
        ),
        description: get(
          'home.editorial.block2.description',
          'Des teintures naturelles aux motifs symboliques...',
        ),
        imageUrl: get(
          'home.editorial.block2.imageUrl',
          'https://cdn.sendiaba.com/home/editorial-2.png',
        ),
        href: get('home.editorial.block2.href', '/collections/maison'),
      },
    };
  }

  async getSavoirFaire(): Promise<SavoirFaireDto> {
    const get = await this.scopeContentGetter('home');
    return {
      badge: get('home.savoirFaire.badge', "L'Art du Temps"),
      title: get('home.savoirFaire.title', 'Le temps est notre matiere premiere.'),
      paragraphs: [
        get('home.savoirFaire.paragraphs.0', 'Dans un monde obsede par la vitesse...'),
        get('home.savoirFaire.paragraphs.1', "Ce temps n'est pas perdu, il est investi..."),
      ],
      imageUrl: get(
        'home.savoirFaire.imageUrl',
        'https://cdn.sendiaba.com/home/savoir-faire.png',
      ),
      cta: get('home.savoirFaire.cta', 'Explorer nos techniques'),
    };
  }

  async getArtisans(): Promise<HomeArtisansResponseDto> {
    const get = await this.scopeContentGetter('home');
    const title = get('home.artisans.title', 'Derriere chaque objet, une lignee.');
    const subtitle = get(
      'home.artisans.subtitle',
      "Le vrai luxe reside dans l'humanite de la creation...",
    );

    const featured = await this.homeRepository.findHomepageFeaturedArtisans();
    if (featured.length > 0) {
      return {
        title,
        subtitle,
        items: featured.map((row) => {
          const pubId = publicArtisanId(row);
          const city = row.profile?.city ?? '';
          return {
            id: pubId,
            name: row.displayName,
            title: row.profile?.speciality ?? row.profile?.craft ?? 'Artisan',
            location: city ? formatArtisanLocation(city) : 'Afrique',
            heritage: row.profile?.heritage ?? '',
            quote: row.profile?.quote ?? '',
            imageUrl:
              row.profile?.avatarUrl ??
              `https://cdn.sendiaba.com/artisans/${pubId}.png`,
          };
        }),
      };
    }

    await this.homeRepository.findArtisans(8);
    return {
      title,
      subtitle,
      items: [
        {
          id: 'a1',
          name: get('home.artisans.items.0.name', 'Ibrahima Guèye'),
          title: get('home.artisans.items.0.title', 'Maître Cordonnier'),
          location: get('home.artisans.items.0.location', 'Ngaye Mékhé, Sénégal'),
          heritage: get(
            'home.artisans.items.0.heritage',
            'Troisième génération, depuis 1987',
          ),
          quote: get('home.artisans.items.0.quote', 'Le cuir ne ment pas...'),
          imageUrl: get(
            'home.artisans.items.0.imageUrl',
            'https://cdn.sendiaba.com/artisans/a1.png',
          ),
        },
      ],
    };
  }

  async getFeaturedProducts(): Promise<FeaturedProductsResponseDto> {
    await this.homeRepository.findFeaturedProducts(6);
    const get = await this.scopeContentGetter('home');
    return {
      title: get('home.featuredProducts.title', 'Selection Singuliere'),
      subtitle: get(
        'home.featuredProducts.subtitle',
        'Des pieces choisies pour leur aura et leur perfection technique.',
      ),
      items: [
        {
          id: 'p7',
          name: 'Chemin de Table Ségou',
          price: 185,
          imageUrl: get(
            'home.featuredProducts.items.0.imageUrl',
            'https://cdn.sendiaba.com/products/p7.png',
          ),
          tag: 'Nouveau',
          inStock: true,
          href: '/produit/p7',
          artisan: { id: 'a2', name: 'Fatouma Diabaté' },
        },
      ],
    };
  }

  async getStats(): Promise<StatsResponseDto> {
    await this.homeRepository.findStats();
    return {
      items: [
        { value: 320, suffix: '+', label: 'Artisans partenaires' },
        { value: 12500, suffix: '+', label: 'Créations disponibles' },
        { value: 40, suffix: '+', label: 'Pays de livraison' },
        { value: 98, suffix: '%', label: 'Clients satisfaits' },
      ],
    };
  }

  async getPress(): Promise<PressResponseDto> {
    await this.homeRepository.findPress();
    return {
      badge: 'Ils parlent de nous',
      subtitle: 'Sendiaba est reconnue par les medias...',
      logos: [
        { name: 'Jeune Afrique' },
        { name: 'Le Monde Afrique' },
        { name: 'Forbes Afrique' },
      ],
      quote: {
        text: 'Sendiaba réinvente la mise en valeur de l’artisanat africain...',
        source: 'Jeune Afrique — Hors-série Luxe & Art de Vivre 2025',
      },
    };
  }

  async getNewsletter(): Promise<NewsletterContentDto> {
    const get = await this.scopeContentGetter('home');
    return {
      title: get('home.newsletter.title', "Rejoignez l'Atelier"),
      subtitle: get(
        'home.newsletter.subtitle',
        'Inscrivez-vous pour decouvrir en avant-premiere...',
      ),
      consentText: get(
        'home.newsletter.consentText',
        'Nous respectons votre boîte de réception. Désinscription à tout moment.',
      ),
      placeholder: get('home.newsletter.placeholder', 'Votre adresse email'),
      buttonLabel: get('home.newsletter.buttonLabel', "S'inscrire"),
    };
  }

  private async scopeContentGetter(scope: string) {
    const rows = await this.homeRepository.findContentEntriesByScope(scope);
    const map = new Map(rows.map((row) => [row.key, row.overrideValue ?? row.defaultValue]));
    return (key: string, fallback: string): string => map.get(key) || fallback;
  }

  private parseStringArray(value: string): string[] {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map((v) => String(v)).filter(Boolean);
      }
    } catch {
      // ignore
    }
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }

  private parseIntValue(value: string, fallback: number): number {
    const n = Number.parseInt(value, 10);
    return Number.isNaN(n) ? fallback : n;
  }
}
