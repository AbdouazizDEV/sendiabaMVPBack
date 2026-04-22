import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class HomeHeroDto {
  @ApiProperty() badge!: string;
  @ApiProperty() title!: string;
  @ApiProperty() cta!: string;
  @ApiProperty() backgroundImageUrl!: string;
}

export class BrandTickerDto {
  @ApiProperty({ type: [String] }) items!: string[];
}

export class TrustItemDto {
  @ApiProperty() title!: string;
  @ApiProperty() desc!: string;
}

export class TrustBarDto {
  @ApiProperty({ type: [TrustItemDto] }) items!: TrustItemDto[];
}

export class ManifestoDto {
  @ApiProperty() title!: string;
  @ApiProperty({ type: [String] }) paragraphs!: string[];
}

export class HomeCategoryItemDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() description!: string;
  @ApiProperty() imageUrl!: string;
  @ApiProperty() href!: string;
}

export class HomeCategoriesDto {
  @ApiProperty() title!: string;
  @ApiProperty() subtitle!: string;
  @ApiProperty({ type: [HomeCategoryItemDto] }) items!: HomeCategoryItemDto[];
}

export class ShopTabDto {
  @ApiProperty() id!: string;
  @ApiProperty() label!: string;
  @ApiProperty() accent!: string;
}

export class ShopTabsResponseDto {
  @ApiProperty() badge!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ type: [ShopTabDto] }) tabs!: ShopTabDto[];
}

export class ShopProductsQueryDto {
  @ApiProperty({ example: 'maroquinerie' })
  @IsString()
  category!: string;

  @ApiProperty({ example: 4, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number = 4;
}

export class ArtisanShortDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
}

export class HomeProductDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() price!: number;
  @ApiProperty() imageUrl!: string;
  @ApiProperty() tag!: string;
  @ApiProperty() inStock!: boolean;
  @ApiProperty() href!: string;
  @ApiProperty({ type: ArtisanShortDto }) artisan!: ArtisanShortDto;
}

export class ShopProductsResponseDto {
  @ApiProperty() category!: string;
  @ApiProperty({ type: [HomeProductDto] }) items!: HomeProductDto[];
}

export class PromoBannerDto {
  @ApiProperty() badge!: string;
  @ApiProperty() title!: string;
  @ApiProperty() subtitle!: string;
  @ApiProperty() cta!: string;
  @ApiProperty() targetDate!: string;
  @ApiProperty() remainingPieces!: number;
  @ApiProperty() backgroundImageUrl!: string;
  @ApiProperty() href!: string;
}

export class EditorialBlockDto {
  @ApiProperty() label!: string;
  @ApiProperty() title!: string;
  @ApiProperty() description!: string;
  @ApiProperty() imageUrl!: string;
  @ApiProperty() href!: string;
}

export class EditorialResponseDto {
  @ApiProperty({ type: EditorialBlockDto }) block1!: EditorialBlockDto;
  @ApiProperty({ type: EditorialBlockDto }) block2!: EditorialBlockDto;
}

export class SavoirFaireDto {
  @ApiProperty() badge!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ type: [String] }) paragraphs!: string[];
  @ApiProperty() imageUrl!: string;
  @ApiProperty() cta!: string;
}

export class HomeArtisanItemDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() title!: string;
  @ApiProperty() location!: string;
  @ApiProperty() heritage!: string;
  @ApiProperty() quote!: string;
  @ApiProperty() imageUrl!: string;
}

export class HomeArtisansResponseDto {
  @ApiProperty() title!: string;
  @ApiProperty() subtitle!: string;
  @ApiProperty({ type: [HomeArtisanItemDto] }) items!: HomeArtisanItemDto[];
}

export class FeaturedProductsResponseDto {
  @ApiProperty() title!: string;
  @ApiProperty() subtitle!: string;
  @ApiProperty({ type: [HomeProductDto] }) items!: HomeProductDto[];
}

export class StatItemDto {
  @ApiProperty() value!: number;
  @ApiProperty() suffix!: string;
  @ApiProperty() label!: string;
}

export class StatsResponseDto {
  @ApiProperty({ type: [StatItemDto] }) items!: StatItemDto[];
}

export class PressLogoDto {
  @ApiProperty() name!: string;
}

export class PressQuoteDto {
  @ApiProperty() text!: string;
  @ApiProperty() source!: string;
}

export class PressResponseDto {
  @ApiProperty() badge!: string;
  @ApiProperty() subtitle!: string;
  @ApiProperty({ type: [PressLogoDto] }) logos!: PressLogoDto[];
  @ApiProperty({ type: PressQuoteDto }) quote!: PressQuoteDto;
}

export class NewsletterContentDto {
  @ApiProperty() title!: string;
  @ApiProperty() subtitle!: string;
  @ApiProperty() consentText!: string;
  @ApiProperty() placeholder!: string;
  @ApiProperty() buttonLabel!: string;
}
