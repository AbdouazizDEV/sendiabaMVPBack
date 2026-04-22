import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class ArtisansCatalogQueryDto {
  @ApiProperty({ required: false, default: 200, maximum: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit: number = 200;
}

export class ProductsCatalogQueryDto {
  @ApiProperty({ required: false, default: 500, maximum: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit: number = 500;
}

export class CatalogArtisanItemDto {
  @ApiProperty({ example: 'a2' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ example: "Tisserande d'Art" }) title!: string;
  @ApiProperty({ example: 'Ségou, Mali' }) location!: string;
  @ApiProperty({ example: 'Troisième génération, depuis 1987' }) heritage!: string;
  @ApiProperty({ example: 'Le cuir ne ment pas...' }) quote!: string;
  @ApiProperty() bio!: string;
  @ApiProperty() imageUrl!: string;
  @ApiProperty({ example: 'Maroquinerie' }) speciality!: string;
  @ApiProperty({ example: 35 }) yearsExperience!: number;
  @ApiProperty({ example: 42 }) productsCount!: number;
}

export class ArtisansCatalogResponseDto {
  @ApiProperty({ type: [CatalogArtisanItemDto] }) items!: CatalogArtisanItemDto[];
}

export class CatalogProductItemDto {
  @ApiProperty({ example: 'p1' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() price!: number;
  @ApiProperty() imageUrl!: string;
}

export class ProductsCatalogResponseDto {
  @ApiProperty({ type: [CatalogProductItemDto] }) items!: CatalogProductItemDto[];
}

export class ProductDetailDto {
  @ApiProperty({ example: 'p1' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ example: 'a1' }) artisanId!: string;
  @ApiProperty({ example: 'maroquinerie' }) category!: string;
  @ApiProperty({ example: 'Sacs à Main' }) subcategory!: string;
  @ApiProperty() price!: number;
  @ApiProperty() description!: string;
  @ApiProperty({ type: [String] }) details!: string[];
  @ApiProperty() imageUrl!: string;
  @ApiProperty({ nullable: true }) tag!: string | null;
  @ApiProperty() inStock!: boolean;
}

export class ProductSimilarItemDto {
  @ApiProperty({ example: 'p2' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ example: 'a1' }) artisanId!: string;
  @ApiProperty({ example: 'maroquinerie' }) category!: string;
  @ApiProperty() price!: number;
  @ApiProperty() imageUrl!: string;
  @ApiProperty({ nullable: true }) tag!: string | null;
  @ApiProperty() inStock!: boolean;
}

export class ProductSimilarResponseDto {
  @ApiProperty({ type: [ProductSimilarItemDto] }) items!: ProductSimilarItemDto[];
}

export class ProductSimilarQueryDto {
  @ApiProperty({ required: false, default: 4, maximum: 24 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  limit: number = 4;
}

export class ArtisanDetailDto {
  @ApiProperty({ example: 'a1' }) id!: string;
  @ApiProperty({ example: 'Ibrahima Guèye' }) name!: string;
  @ApiProperty({ example: 'Maître Cordonnier' }) title!: string;
  @ApiProperty({ example: 'Ngaye Mékhé, Sénégal' }) location!: string;
  @ApiProperty({ example: 'Troisième génération, depuis 1987' }) heritage!: string;
  @ApiProperty({ example: 'Le cuir ne ment pas...' }) quote!: string;
  @ApiProperty() bio!: string;
  @ApiProperty() imageUrl!: string;
  @ApiProperty({ example: 'Maroquinerie' }) speciality!: string;
  @ApiProperty({ example: 35 }) yearsExperience!: number;
  @ApiProperty({ example: 42 }) productsCount!: number;
}

export class ArtisanProductsItemDto {
  @ApiProperty({ example: 'p1' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ example: 'maroquinerie' }) category!: string;
  @ApiProperty() price!: number;
  @ApiProperty() imageUrl!: string;
  @ApiProperty({ nullable: true }) tag!: string | null;
  @ApiProperty() inStock!: boolean;
  @ApiProperty({ example: '/produit/p1' }) href!: string;
}

export class ArtisanProductsResponseDto {
  @ApiProperty({ example: 'a1' }) artisanId!: string;
  @ApiProperty({ type: [ArtisanProductsItemDto] }) items!: ArtisanProductsItemDto[];
}

export class NewArrivalsQueryDto {
  @ApiProperty({ required: false, default: 4, maximum: 24 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  limit: number = 4;
}

export class NewArrivalItemDto {
  @ApiProperty({ example: 'p3' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() price!: number;
  @ApiProperty({ example: 'Nouveau' }) tag!: string;
  @ApiProperty() imageUrl!: string;
  @ApiProperty({ example: '/produit/p3' }) href!: string;
}

export class NewArrivalsResponseDto {
  @ApiProperty({ type: [NewArrivalItemDto] }) items!: NewArrivalItemDto[];
}
