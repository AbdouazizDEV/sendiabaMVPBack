import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ProfileMeResponseDto {
  @ApiProperty({ example: 'usr_4012' }) userId!: string;
  @ApiProperty() fullName!: string;
  @ApiProperty() phone!: string;
  @ApiProperty() country!: string;
  @ApiProperty() city!: string;
  @ApiProperty({ nullable: true, example: 'a2' }) favoriteArtisanId!: string | null;
  @ApiProperty({ type: [String], example: ['usr_3017', 'usr_3018'] })
  favoriteArtisanIds!: string[];
  @ApiProperty({ type: [String], example: ['p1', 'p7', 'p12'] })
  favoriteProductIds!: string[];
}

export class PersonalInfoBodyDto {
  @ApiProperty() @IsString() @MinLength(2) @MaxLength(120) fullName!: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(32) phone?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(80) country?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(80) city?: string;
}

export class PersonalInfoSuccessDto {
  @ApiProperty() success!: true;
  @ApiProperty({ type: ProfileMeResponseDto }) data!: ProfileMeResponseDto;
}

export class FavoriteArtisanBodyDto {
  @ApiProperty({
    nullable: true,
    example: 'a2',
    description: 'Identifiant public artisan (ex: a2), ou null pour retirer',
  })
  @IsOptional()
  @IsString()
  artisanId?: string | null;
}

export class FavoriteArtisanSuccessDto {
  @ApiProperty() success!: true;
  @ApiProperty({
    example: { favoriteArtisanId: 'a2' },
  })
  data!: { favoriteArtisanId: string | null };
}

export class FavoriteArtisansSuccessDto {
  @ApiProperty() success!: true;
  @ApiProperty({
    example: { favoriteArtisanIds: ['usr_3017', 'usr_3018'] },
  })
  data!: { favoriteArtisanIds: string[] };
}

export class FavoriteProductBodyDto {
  @ApiProperty({ example: 'p1' }) @IsString() productId!: string;
}

export class FavoriteProductsSuccessDto {
  @ApiProperty() success!: true;
  @ApiProperty({
    example: { favoriteProductIds: ['p1', 'p7', 'p12'] },
  })
  data!: { favoriteProductIds: string[] };
}
