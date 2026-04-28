import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  parseArtisanPublicId,
  parseProductPublicId,
  publicArtisanId,
  publicProductId,
  publicUserId,
} from '../../common/utils/public-ids.util';
import type {
  FavoriteArtisanBodyDto,
  FavoriteProductBodyDto,
  PersonalInfoBodyDto,
  ProfileMeResponseDto,
} from './dto/profile.dto';

const profileInclude = {
  favoriteArtisan: true,
  favoriteProducts: { include: { product: true } },
} satisfies Prisma.ProfileInclude;

type ProfileWithRelations = Prisma.ProfileGetPayload<{
  include: typeof profileInclude;
}>;

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(user: User): Promise<ProfileMeResponseDto> {
    const { user: u, profile } = await this.loadBundle(user.id);
    return this.toMeDto(u, profile);
  }

  async updatePersonalInfo(
    user: User,
    dto: PersonalInfoBodyDto,
  ): Promise<{ success: true; data: ProfileMeResponseDto }> {
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { displayName: dto.fullName },
      }),
      this.prisma.profile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          phone: dto.phone ?? null,
          country: dto.country ?? null,
          city: dto.city ?? null,
        },
        update: {
          phone: dto.phone ?? null,
          country: dto.country ?? null,
          city: dto.city ?? null,
        },
      }),
    ]);

    const fresh = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: { profile: { include: profileInclude } },
    });
    const profile = fresh.profile ?? (await this.ensureProfileWithRelations(user.id));

    return {
      success: true,
      data: this.toMeDto(fresh, profile),
    };
  }

  async setFavoriteArtisan(
    user: User,
    dto: FavoriteArtisanBodyDto,
  ): Promise<{ success: true; data: { favoriteArtisanId: string | null } }> {
    const raw = dto.artisanId;
    if (raw === null || raw === undefined || raw === '') {
      await this.ensureProfile(user.id);
      await this.prisma.profile.update({
        where: { userId: user.id },
        data: { favoriteArtisanId: null },
      });
      return { success: true, data: { favoriteArtisanId: null } };
    }

    const ref = parseArtisanPublicId(raw);
    if (!ref) {
      throw new BadRequestException({
        code: 'INVALID_ARTISAN_ID',
        message: 'Identifiant artisan invalide.',
      });
    }

    const artisan = await this.prisma.user.findFirst({
      where: { referenceCode: ref, role: 'ARTISAN' },
    });
    if (!artisan) {
      throw new NotFoundException({
        code: 'ARTISAN_NOT_FOUND',
        message: 'Artisan introuvable.',
      });
    }

    await this.ensureProfile(user.id);
    await this.prisma.profile.update({
      where: { userId: user.id },
      data: { favoriteArtisanId: artisan.id },
    });

    return {
      success: true,
      data: { favoriteArtisanId: publicArtisanId(artisan) },
    };
  }

  async addFavoriteProduct(
    user: User,
    dto: FavoriteProductBodyDto,
  ): Promise<{ success: true; data: { favoriteProductIds: string[] } }> {
    const ref = parseProductPublicId(dto.productId);
    if (!ref) {
      throw new BadRequestException({
        code: 'INVALID_PRODUCT_ID',
        message: 'Identifiant produit invalide.',
      });
    }

    const product = await this.prisma.product.findUnique({
      where: { referenceCode: ref },
    });
    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Produit introuvable.',
      });
    }

    const profile = await this.ensureProfile(user.id);
    await this.prisma.profileFavoriteProduct.upsert({
      where: {
        profileId_productId: { profileId: profile.id, productId: product.id },
      },
      create: { profileId: profile.id, productId: product.id },
      update: {},
    });

    const ids = await this.listFavoriteProductPublicIds(profile.id);
    return { success: true, data: { favoriteProductIds: ids } };
  }

  async removeFavoriteProduct(
    user: User,
    productPublicId: string,
  ): Promise<{ success: true; data: { favoriteProductIds: string[] } }> {
    const ref = parseProductPublicId(productPublicId);
    if (!ref) {
      throw new BadRequestException({
        code: 'INVALID_PRODUCT_ID',
        message: 'Identifiant produit invalide.',
      });
    }

    const product = await this.prisma.product.findUnique({
      where: { referenceCode: ref },
    });
    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Produit introuvable.',
      });
    }

    const profile = await this.prisma.profile.findUnique({
      where: { userId: user.id },
    });
    if (!profile) {
      return { success: true, data: { favoriteProductIds: [] } };
    }

    await this.prisma.profileFavoriteProduct.deleteMany({
      where: { profileId: profile.id, productId: product.id },
    });

    const ids = await this.listFavoriteProductPublicIds(profile.id);
    return { success: true, data: { favoriteProductIds: ids } };
  }

  private async listFavoriteProductPublicIds(
    profileId: string,
  ): Promise<string[]> {
    const rows = await this.prisma.profileFavoriteProduct.findMany({
      where: { profileId },
      include: { product: true },
      orderBy: { addedAt: 'asc' },
    });
    return rows.map((r) => publicProductId(r.product));
  }

  private async loadBundle(userId: string): Promise<{
    user: User;
    profile: ProfileWithRelations;
  }> {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: { include: profileInclude } },
    });
    if (!u) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'Utilisateur introuvable.',
      });
    }
    let profile = u.profile;
    if (!profile) {
      profile = await this.prisma.profile.create({
        data: { userId },
        include: profileInclude,
      });
    }
    return { user: u, profile };
  }

  private async ensureProfile(userId: string) {
    return this.prisma.profile.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  private async ensureProfileWithRelations(
    userId: string,
  ): Promise<ProfileWithRelations> {
    return this.prisma.profile.upsert({
      where: { userId },
      create: { userId },
      update: {},
      include: profileInclude,
    });
  }

  private toMeDto(user: User, profile: ProfileWithRelations): ProfileMeResponseDto {
    return {
      userId: publicUserId(user),
      fullName: user.displayName,
      phone: profile.phone ?? '',
      country: profile.country ?? '',
      city: profile.city ?? '',
      favoriteArtisanId: profile.favoriteArtisan
        ? publicArtisanId(profile.favoriteArtisan)
        : null,
      favoriteProductIds: profile.favoriteProducts.map((fp) =>
        publicProductId(fp.product),
      ),
    };
  }
}
