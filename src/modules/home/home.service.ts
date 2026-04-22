import { Inject, Injectable } from '@nestjs/common';
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
    await this.homeRepository.findHero();
    return {
      badge: 'Porte. Pose. Vecu. Fait main.',
      title: "L'ame de l'artisanat africain.",
      cta: "Decouvrir l'Atelier",
      backgroundImageUrl: 'https://cdn.sendiaba.com/home/hero.png',
    };
  }

  async getBrandTicker(): Promise<BrandTickerDto> {
    await this.homeRepository.findBrandTicker();
    return {
      items: [
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
    };
  }

  getTrustBar(): TrustBarDto {
    return {
      items: [
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
      ],
    };
  }

  getManifesto(): ManifestoDto {
    return {
      title:
        "Nous ne sommes pas une marketplace. Nous sommes un pont culturel entre les maitres artisans d'Afrique et le monde.",
      paragraphs: [
        'Chaque objet vendu ici porte une histoire humaine tracable...',
        'Nous celebrons le savoir-faire africain avec une exigence absolue...',
      ],
    };
  }

  async getCategories(): Promise<HomeCategoriesDto> {
    await this.homeRepository.findCategories();
    const items: HomeCategoryItemDto[] = [
      {
        id: 'maroquinerie',
        title: 'Maroquinerie & Cuir',
        description: 'Sacs, portefeuilles et ceintures façonnés...',
        imageUrl: 'https://cdn.sendiaba.com/categories/maroquinerie.png',
        href: '/collections/maroquinerie',
      },
      {
        id: 'maison',
        title: 'Maison & Textile',
        description: "Textiles d'intérieur, nappes et pièces de maison...",
        imageUrl: 'https://cdn.sendiaba.com/categories/maison.png',
        href: '/collections/maison',
      },
      {
        id: 'decoration',
        title: 'Décoration & Art',
        description: 'Objets d art et pièces décoratives de caractère...',
        imageUrl: 'https://cdn.sendiaba.com/categories/decoration.png',
        href: '/collections/decoration',
      },
      {
        id: 'coffrets',
        title: 'Coffrets & Cadeaux',
        description: 'Sélections prêtes à offrir pour les moments précieux...',
        imageUrl: 'https://cdn.sendiaba.com/categories/coffrets.png',
        href: '/collections/coffrets',
      },
    ];

    return {
      title: 'Les Collections',
      subtitle:
        "L'excellence de l'artisanat ouest-africain, declinee en quatre univers d'exception.",
      items,
    };
  }

  getShopTabs(): ShopTabsResponseDto {
    return {
      badge: 'La Boutique',
      title: 'Chaque piece, une histoire.',
      tabs: [
        { id: 'maroquinerie', label: 'Maroquinerie & Cuir', accent: 'Porte' },
        { id: 'maison', label: 'Maison & Textile', accent: 'Pose' },
        { id: 'decoration', label: 'Decoration & Art', accent: 'Vecu' },
        { id: 'coffrets', label: 'Coffrets & Cadeaux', accent: 'Offert' },
      ],
    };
  }

  async getShopProducts(
    category: string,
    limit: number,
  ): Promise<ShopProductsResponseDto> {
    await this.homeRepository.findProductsByCategory(category, limit);
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
      category,
      items: (catalog[category] ?? []).slice(0, limit),
    };
  }

  async getPromoBanner(): Promise<PromoBannerDto> {
    await this.homeRepository.findPromoBanner();
    return {
      badge: 'Collection Exclusive',
      title: 'Tabaski 2026 - Edition Limitee',
      subtitle: 'Des coffrets et creations artisanales penses...',
      cta: 'Decouvrir la Collection',
      targetDate: '2026-05-07T00:00:00Z',
      remainingPieces: 47,
      backgroundImageUrl: 'https://cdn.sendiaba.com/home/promo.png',
      href: '/collections/coffrets',
    };
  }

  getEditorial(): EditorialResponseDto {
    return {
      block1: {
        label: 'Editorial',
        title: 'Le sac qui voyage avec vous',
        description: 'Faconne dans les cuirs les plus nobles...',
        imageUrl: 'https://cdn.sendiaba.com/home/editorial-1.png',
        href: '/collections/maroquinerie',
      },
      block2: {
        label: 'Savoir-faire',
        title: "L'art du tissu, eleve au rang de decoration",
        description: 'Des teintures naturelles aux motifs symboliques...',
        imageUrl: 'https://cdn.sendiaba.com/home/editorial-2.png',
        href: '/collections/maison',
      },
    };
  }

  getSavoirFaire(): SavoirFaireDto {
    return {
      badge: "L'Art du Temps",
      title: 'Le temps est notre matiere premiere.',
      paragraphs: [
        'Dans un monde obsede par la vitesse...',
        "Ce temps n'est pas perdu, il est investi...",
      ],
      imageUrl: 'https://cdn.sendiaba.com/home/savoir-faire.png',
      cta: 'Explorer nos techniques',
    };
  }

  async getArtisans(): Promise<HomeArtisansResponseDto> {
    await this.homeRepository.findArtisans(8);
    return {
      title: 'Derriere chaque objet, une lignee.',
      subtitle: "Le vrai luxe reside dans l'humanite de la creation...",
      items: [
        {
          id: 'a1',
          name: 'Ibrahima Guèye',
          title: 'Maître Cordonnier',
          location: 'Ngaye Mékhé, Sénégal',
          heritage: 'Troisième génération, depuis 1987',
          quote: 'Le cuir ne ment pas...',
          imageUrl: 'https://cdn.sendiaba.com/artisans/a1.png',
        },
      ],
    };
  }

  async getFeaturedProducts(): Promise<FeaturedProductsResponseDto> {
    await this.homeRepository.findFeaturedProducts(6);
    return {
      title: 'Selection Singuliere',
      subtitle:
        'Des pieces choisies pour leur aura et leur perfection technique.',
      items: [
        {
          id: 'p7',
          name: 'Chemin de Table Ségou',
          price: 185,
          imageUrl: 'https://cdn.sendiaba.com/products/p7.png',
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

  getNewsletter(): NewsletterContentDto {
    return {
      title: "Rejoignez l'Atelier",
      subtitle: 'Inscrivez-vous pour decouvrir en avant-premiere...',
      consentText:
        'Nous respectons votre boîte de réception. Désinscription à tout moment.',
      placeholder: 'Votre adresse email',
      buttonLabel: "S'inscrire",
    };
  }
}
