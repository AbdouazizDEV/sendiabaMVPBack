import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  FavoriteArtisanBodyDto,
  FavoriteArtisanSuccessDto,
  FavoriteProductBodyDto,
  FavoriteProductsSuccessDto,
  PersonalInfoBodyDto,
  PersonalInfoSuccessDto,
  ProfileMeResponseDto,
} from './dto/profile.dto';
import { ProfileService } from './profile.service';

@ApiTags('Profile')
@ApiBearerAuth()
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Profil courant',
    description:
      'infos personnelles et favoris (ids publics usr_*, a*, p*)',
  })
  @ApiOkResponse({ type: ProfileMeResponseDto })
  async getMe(@CurrentUser() user: User): Promise<ProfileMeResponseDto> {
    return this.profileService.getMe(user);
  }

  @Put('me/personal-info')
  @ApiOperation({
    summary: 'Mettre à jour les infos personnelles',
    description: 'nom affiché, téléphone, pays, ville',
  })
  @ApiOkResponse({ type: PersonalInfoSuccessDto })
  async updatePersonal(
    @CurrentUser() user: User,
    @Body() dto: PersonalInfoBodyDto,
  ): Promise<PersonalInfoSuccessDto> {
    return this.profileService.updatePersonalInfo(user, dto);
  }

  @Put('me/favorite-artisan')
  @ApiOperation({
    summary: 'Définir ou retirer l’artisan favori',
    description: 'body { artisanId } public (ex: a2) ou { artisanId: null }',
  })
  @ApiOkResponse({ type: FavoriteArtisanSuccessDto })
  async setFavoriteArtisan(
    @CurrentUser() user: User,
    @Body() dto: FavoriteArtisanBodyDto,
  ): Promise<FavoriteArtisanSuccessDto> {
    return this.profileService.setFavoriteArtisan(user, dto);
  }

  @Post('me/favorite-products')
  @ApiOperation({
    summary: 'Ajouter un produit favori',
    description: 'identifiant public produit (ex: p1)',
  })
  @ApiOkResponse({ type: FavoriteProductsSuccessDto })
  async addFavoriteProduct(
    @CurrentUser() user: User,
    @Body() dto: FavoriteProductBodyDto,
  ): Promise<FavoriteProductsSuccessDto> {
    return this.profileService.addFavoriteProduct(user, dto);
  }

  @Delete('me/favorite-products/:productId')
  @ApiParam({ name: 'productId', example: 'p7' })
  @ApiOperation({ summary: 'Retirer un produit favori' })
  @ApiOkResponse({ type: FavoriteProductsSuccessDto })
  async removeFavoriteProduct(
    @CurrentUser() user: User,
    @Param('productId') productId: string,
  ): Promise<FavoriteProductsSuccessDto> {
    return this.profileService.removeFavoriteProduct(user, productId);
  }
}
