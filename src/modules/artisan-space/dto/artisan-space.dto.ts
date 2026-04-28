import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class ArtisanProductsQueryDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() search?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() category?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() @Type(() => Boolean) inStock?: boolean;
  @ApiProperty({ required: false, default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @ApiProperty({ required: false, default: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
}

export class UpsertArtisanProductDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string;
  @ApiProperty() @Type(() => Number) @IsNumber() price!: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() tag?: string;
  @ApiProperty({ required: false, default: true }) @IsOptional() @Type(() => Boolean) @IsBoolean() inStock?: boolean;
  @ApiProperty({ example: 'maroquinerie' }) @IsString() categorySlug!: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() subcategorySlug?: string;
  @ApiProperty({ required: false, type: [String] }) @IsOptional() details?: string[];
}

export class ArtisanCustomersQueryDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() search?: string;
  @ApiProperty({ required: false, default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @ApiProperty({ required: false, default: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
}

export class ArtisanProductItemDto {
  @ApiProperty({ example: 'p1' }) id!: string;
  @ApiProperty({ example: 'usr_3017' }) artisanId!: string;
  @ApiProperty() name!: string;
  @ApiProperty() price!: number;
  @ApiProperty({ nullable: true }) imageUrl!: string | null;
  @ApiProperty() inStock!: boolean;
  @ApiProperty({ example: 'maroquinerie' }) category!: string;
  @ApiProperty({ nullable: true, example: 'ceintures' }) subcategory!: string | null;
  @ApiProperty({ nullable: true }) tag!: string | null;
}

export class PaginationDto {
  @ApiProperty({ example: 1 }) page!: number;
  @ApiProperty({ example: 20 }) limit!: number;
  @ApiProperty({ example: 42 }) total!: number;
  @ApiProperty({ example: 3 }) totalPages!: number;
}

export class ArtisanProductsListResponseDto {
  @ApiProperty({ type: [ArtisanProductItemDto] }) items!: ArtisanProductItemDto[];
  @ApiProperty({ type: PaginationDto }) pagination!: PaginationDto;
}

export class CreateArtisanProductResponseDto {
  @ApiProperty({ example: true }) success!: boolean;
  @ApiProperty({ type: ArtisanProductItemDto }) data!: ArtisanProductItemDto;
}

export class SuccessResponseDto {
  @ApiProperty({ example: true }) success!: boolean;
}

export class UpdateArtisanProductResponseDto {
  @ApiProperty({ example: true }) success!: boolean;
  @ApiProperty({ type: ArtisanProductItemDto }) data!: ArtisanProductItemDto;
}

export class DeleteArtisanProductResponseDto {
  @ApiProperty({ example: true }) success!: boolean;
  @ApiProperty({ example: { id: 'p12', deleted: true } }) data!: { id: string; deleted: boolean };
}

export class ArtisanProductDetailResponseDto {
  @ApiProperty({ type: ArtisanProductItemDto }) data!: ArtisanProductItemDto;
}

export class ArtisanCustomerItemDto {
  @ApiProperty({ example: 'usr_4012' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() email!: string;
  @ApiProperty({ nullable: true }) city!: string | null;
  @ApiProperty() ordersCount!: number;
  @ApiProperty() totalSpent!: number;
  @ApiProperty() lastOrderAt!: string;
}

export class ArtisanCustomersListResponseDto {
  @ApiProperty({ type: [ArtisanCustomerItemDto] }) items!: ArtisanCustomerItemDto[];
  @ApiProperty({ type: PaginationDto }) pagination!: PaginationDto;
}

export class ArtisanMeResponseDto {
  @ApiProperty({ example: true }) success!: boolean;
  @ApiProperty({
    example: {
      userId: 'usr_3017',
      artisanId: 'a3017',
      displayName: 'Ibrahima Gueye',
      email: 'ibrahima@sendiaba.com',
      phone: '+221770000001',
      city: 'Dakar',
      craft: 'Maroquinier',
      bio: '...',
      avatarUrl: 'https://...',
      productsCount: 8,
    },
  })
  data!: {
    userId: string;
    artisanId: string;
    displayName: string;
    email: string;
    phone: string | null;
    city: string | null;
    craft: string | null;
    bio: string | null;
    avatarUrl: string | null;
    productsCount: number;
  };
}

export class ArtisanDashboardKpisResponseDto {
  @ApiProperty({ example: true }) success!: boolean;
  @ApiProperty({
    example: {
      totalProducts: 12,
      totalOrders: 26,
      totalCustomers: 18,
      totalItemsSold: 61,
      totalRevenue: 5340.5,
    },
  })
  data!: {
    totalProducts: number;
    totalOrders: number;
    totalCustomers: number;
    totalItemsSold: number;
    totalRevenue: number;
  };
}
