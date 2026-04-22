import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import {
  BrandTickerDto,
  EditorialResponseDto,
  FeaturedProductsResponseDto,
  HomeArtisansResponseDto,
  HomeCategoriesDto,
  HomeHeroDto,
  ManifestoDto,
  NewsletterContentDto,
  PressResponseDto,
  PromoBannerDto,
  SavoirFaireDto,
  ShopProductsQueryDto,
  ShopProductsResponseDto,
  ShopTabsResponseDto,
  StatsResponseDto,
  TrustBarDto,
} from './dto/home.dto';
import { HomeService } from './home.service';

@ApiTags('Home')
@Public()
@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get('hero')
  @ApiOperation({
    summary: 'Hero',
    description: "retourne le hero principal de la page d'accueil",
  })
  @ApiOkResponse({ type: HomeHeroDto })
  async hero(): Promise<HomeHeroDto> {
    return this.homeService.getHero();
  }

  @Get('brand-ticker')
  @ApiOperation({
    summary: 'BrandTicker',
    description: 'retourne les libelles du bandeau marquee',
  })
  @ApiOkResponse({ type: BrandTickerDto })
  async brandTicker(): Promise<BrandTickerDto> {
    return this.homeService.getBrandTicker();
  }

  @Get('trust-bar')
  @ApiOperation({
    summary: 'TrustBar',
    description: 'retourne les arguments de confiance de la homepage',
  })
  @ApiOkResponse({ type: TrustBarDto })
  trustBar(): TrustBarDto {
    return this.homeService.getTrustBar();
  }

  @Get('manifesto')
  @ApiOperation({
    summary: 'Manifesto',
    description: 'retourne le manifeste editorial de la marque',
  })
  @ApiOkResponse({ type: ManifestoDto })
  manifesto(): ManifestoDto {
    return this.homeService.getManifesto();
  }

  @Get('categories')
  @ApiOperation({
    summary: 'Categories',
    description: 'retourne les collections principales a afficher',
  })
  @ApiOkResponse({ type: HomeCategoriesDto })
  async categories(): Promise<HomeCategoriesDto> {
    return this.homeService.getCategories();
  }

  @Get('shop-tabs')
  @ApiOperation({
    summary: 'HomepageShop tabs',
    description: "retourne les tabs de navigation de la section boutique",
  })
  @ApiOkResponse({ type: ShopTabsResponseDto })
  shopTabs(): ShopTabsResponseDto {
    return this.homeService.getShopTabs();
  }

  @Get('shop-products')
  @ApiOperation({
    summary: 'HomepageShop products by category',
    description: 'retourne les produits pour une categorie donnee',
  })
  @ApiOkResponse({ type: ShopProductsResponseDto })
  async shopProducts(
    @Query() query: ShopProductsQueryDto,
  ): Promise<ShopProductsResponseDto> {
    return this.homeService.getShopProducts(query.category, query.limit ?? 4);
  }

  @Get('promo-banner')
  @ApiOperation({
    summary: 'PromoBanner',
    description: 'retourne la banniere promotionnelle homepage',
  })
  @ApiOkResponse({ type: PromoBannerDto })
  async promoBanner(): Promise<PromoBannerDto> {
    return this.homeService.getPromoBanner();
  }

  @Get('editorial')
  @ApiOperation({
    summary: 'EditorialSection',
    description: 'retourne les deux blocs editoriaux homepage',
  })
  @ApiOkResponse({ type: EditorialResponseDto })
  editorial(): EditorialResponseDto {
    return this.homeService.getEditorial();
  }

  @Get('savoir-faire')
  @ApiOperation({
    summary: 'SavoirFaire',
    description: 'retourne la section storytelling savoir-faire',
  })
  @ApiOkResponse({ type: SavoirFaireDto })
  savoirFaire(): SavoirFaireDto {
    return this.homeService.getSavoirFaire();
  }

  @Get('artisans')
  @ApiOperation({
    summary: 'Artisans',
    description: 'retourne les artisans mis en avant sur la homepage',
  })
  @ApiOkResponse({ type: HomeArtisansResponseDto })
  async artisans(): Promise<HomeArtisansResponseDto> {
    return this.homeService.getArtisans();
  }

  @Get('featured-products')
  @ApiOperation({
    summary: 'FeaturedProducts',
    description: 'retourne la selection singuliere de produits',
  })
  @ApiOkResponse({ type: FeaturedProductsResponseDto })
  async featuredProducts(): Promise<FeaturedProductsResponseDto> {
    return this.homeService.getFeaturedProducts();
  }

  @Get('stats')
  @ApiOperation({
    summary: 'StatsSection',
    description: 'retourne les statistiques publiques de la marque',
  })
  @ApiOkResponse({ type: StatsResponseDto })
  async stats(): Promise<StatsResponseDto> {
    return this.homeService.getStats();
  }

  @Get('press')
  @ApiOperation({
    summary: 'PressSection',
    description: 'retourne les elements de preuve sociale presse',
  })
  @ApiOkResponse({ type: PressResponseDto })
  async press(): Promise<PressResponseDto> {
    return this.homeService.getPress();
  }

  @Get('newsletter')
  @ApiOperation({
    summary: 'Newsletter',
    description: 'retourne le contenu de la section newsletter homepage',
  })
  @ApiOkResponse({ type: NewsletterContentDto })
  newsletter(): NewsletterContentDto {
    return this.homeService.getNewsletter();
  }
}
