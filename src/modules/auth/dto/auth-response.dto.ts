import { ApiProperty } from '@nestjs/swagger';

export class SessionDto {
  @ApiProperty({ example: 'usr_4012' })
  id!: string;

  @ApiProperty({ example: 'DIOP Abdou Aziz' })
  displayName!: string;

  @ApiProperty({ example: 'abdouazizdiop583@gmail.com' })
  email!: string;

  @ApiProperty({ example: 'customer', enum: ['customer', 'artisan', 'admin'] })
  role!: 'customer' | 'artisan' | 'admin';
}

export class TokenDto {
  @ApiProperty({ example: 'jwt_access_token' })
  accessToken!: string;

  @ApiProperty({ example: 'jwt_refresh_token' })
  refreshToken!: string;

  @ApiProperty({ example: 3600 })
  expiresIn!: number;
}

export class AuthSuccessResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: SessionDto })
  session!: SessionDto;

  @ApiProperty({ type: TokenDto })
  token!: TokenDto;
}

export class SessionStatusResponseDto {
  @ApiProperty({ example: true })
  authenticated!: boolean;

  @ApiProperty({ type: SessionDto, nullable: true })
  session!: SessionDto | null;
}

export class ShowcaseArtisanDto {
  @ApiProperty({ example: 'a1' })
  id!: string;

  @ApiProperty({ example: 'Ibrahima Gueye' })
  name!: string;
}

export class ShowcaseProductDto {
  @ApiProperty({ example: 'p1' })
  id!: string;

  @ApiProperty({ example: 'Sac Signature en Cuir' })
  name!: string;

  @ApiProperty({ example: 350 })
  price!: number;

  @ApiProperty({ example: 'https://cdn.sendiaba.com/products/p1.png' })
  imageUrl!: string;

  @ApiProperty({ type: ShowcaseArtisanDto })
  artisan!: ShowcaseArtisanDto;
}

export class AuthShowcaseResponseDto {
  @ApiProperty({
    example: 'Le luxe artisanal africain, signe par son createur.',
  })
  headline!: string;

  @ApiProperty({
    example: 'Connectez-vous pour sauvegarder vos selections...',
  })
  subtitle!: string;

  @ApiProperty({ type: ShowcaseProductDto })
  featuredProduct!: ShowcaseProductDto;
}
