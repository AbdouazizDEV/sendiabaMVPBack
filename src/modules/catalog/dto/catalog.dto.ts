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
  @ApiProperty() bio!: string;
  @ApiProperty() imageUrl!: string;
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
