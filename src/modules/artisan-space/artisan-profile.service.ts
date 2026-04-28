import { Injectable, NotFoundException } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { publicArtisanId, publicUserId } from '../../common/utils/public-ids.util';

@Injectable()
export class ArtisanProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async me(user: User) {
    const row = await this.prisma.user.findFirst({
      where: { id: user.id, role: UserRole.ARTISAN },
      include: { profile: true, _count: { select: { artisanProducts: true } } },
    });
    if (!row) {
      throw new NotFoundException({ code: 'ARTISAN_NOT_FOUND', message: 'Artisan introuvable.' });
    }
    return {
      success: true,
      data: {
        userId: publicUserId(row),
        artisanId: publicArtisanId(row),
        displayName: row.displayName,
        email: row.email,
        phone: row.profile?.phone ?? null,
        city: row.profile?.city ?? null,
        craft: row.profile?.craft ?? null,
        bio: row.profile?.bio ?? null,
        avatarUrl: row.profile?.avatarUrl ?? null,
        productsCount: row._count.artisanProducts,
      },
    };
  }
}
