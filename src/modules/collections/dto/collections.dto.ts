import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CollectionsHeroDto {
  @ApiProperty({ example: 'Le Catalogue Sendiaba' }) badge!: string;
  @ApiProperty({ example: 'Nos Collections' }) title!: string;
  @ApiProperty({
    example:
      "Le veritable luxe est celui qui porte en lui l'empreinte d'une culture, la noblesse d'une matiere et la passion d'un createur.",
  })
  quote!: string;
}

export class ShowcaseCategoryItemDto {
  @ApiProperty({ example: 'maroquinerie' }) id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() subtitle!: string;
  @ApiProperty() description!: string;
  @ApiProperty() imageUrl!: string;
  @ApiProperty({ example: 5 }) productCount!: number;
  @ApiProperty({ example: '/collections/maroquinerie' }) href!: string;
}

export class CollectionsShowcaseCategoriesDto {
  @ApiProperty({ type: [ShowcaseCategoryItemDto] })
  items!: ShowcaseCategoryItemDto[];
}

export class CategoryMetaDto {
  @ApiProperty({ example: 'maroquinerie' }) categoryId!: string;
  @ApiProperty({ example: 'Maroquinerie & Cuir' }) title!: string;
  @ApiProperty() description!: string;
  @ApiProperty({
    example: 'https://cdn.sendiaba.com/categories/maroquinerie-hero.png',
  })
  heroImageUrl!: string;
}

export class CategoryCatalogQueryDto {
  @ApiProperty({ required: false, example: 'sacs,ceintures' })
  @IsOptional()
  @IsString()
  subcategories?: string;

  @ApiProperty({ required: false, example: 'a1,a2' })
  @IsOptional()
  @IsString()
  artisans?: string;

  @ApiProperty({ required: false, example: '100-250' })
  @IsOptional()
  @IsString()
  priceRange?: string;

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  inStockOnly?: boolean;

  @ApiProperty({ required: false, example: 'prix_asc' })
  @IsOptional()
  @IsString()
  sort?: string;
}

export class CatalogArtisanFilterDto {
  @ApiProperty({ example: 'a1' }) id!: string;
  @ApiProperty({ example: 'Ibrahima Guèye' }) name!: string;
}

export class CategoryCatalogItemDto {
  @ApiProperty({ example: 'p1' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() price!: number;
  @ApiProperty({ example: 'Sacs à Main' }) subcategory!: string;
  @ApiProperty() imageUrl!: string;
  @ApiProperty({ nullable: true }) tag!: string | null;
  @ApiProperty() inStock!: boolean;
  @ApiProperty({
    example: { id: 'a1', name: 'Ibrahima Guèye' },
  })
  artisan!: CatalogArtisanFilterDto;
  @ApiProperty({ example: '/produit/p1' }) href!: string;
}

export class CategoryCatalogDto {
  @ApiProperty({ example: 'maroquinerie' }) categoryId!: string;
  @ApiProperty({
    example: {
      subcategories: ['Sacs à Main', 'Ceintures', 'Portefeuilles'],
      artisans: [{ id: 'a1', name: 'Ibrahima Guèye' }],
      priceRanges: ['all', 'under100', '100-250', '250-500', 'over500'],
    },
  })
  availableFilters!: {
    subcategories: string[];
    artisans: CatalogArtisanFilterDto[];
    priceRanges: string[];
  };
  @ApiProperty({
    example: {
      subcategories: ['Sacs à Main'],
      artisans: ['a1'],
      priceRange: '100-250',
      inStockOnly: true,
      sort: 'prix_asc',
    },
  })
  appliedFilters!: {
    subcategories: string[];
    artisans: string[];
    priceRange: string;
    inStockOnly: boolean;
    sort: string;
  };
  @ApiProperty({ example: { totalFound: 2 } })
  summary!: { totalFound: number };
  @ApiProperty({ type: [CategoryCatalogItemDto] })
  items!: CategoryCatalogItemDto[];
}
