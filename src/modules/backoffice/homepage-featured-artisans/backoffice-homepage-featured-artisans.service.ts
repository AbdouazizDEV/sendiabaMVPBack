import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  parseArtisanPublicId,
  publicArtisanId,
} from '../../../common/utils/public-ids.util';
import { PrismaService } from '../../../database/prisma.service';
import {
  HomepageFeaturedArtisanAdminItemDto,
  HomepageFeaturedArtisansListResponseDto,
  SetHomepageFeaturedArtisansDto,
  SetHomepageFeaturedArtisansResponseDto,
} from './dto/backoffice-homepage-featured-artisans.dto';

@Injectable()
export class BackofficeHomepageFeaturedArtisansService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<HomepageFeaturedArtisansListResponseDto> {
    const rows = await this.prisma.homepageFeaturedArtisan.findMany({
      where: { artisan: { role: UserRole.ARTISAN } },
      orderBy: { sortOrder: 'asc' },
      include: {
        artisan: {
          include: {
            profile: {
              select: { city: true, craft: true, avatarUrl: true },
            },
          },
        },
      },
    });
    return {
      items: rows.map((r) => this.toAdminItem(r.sortOrder, r.artisan)),
    };
  }

  async setFeatured(
    dto: SetHomepageFeaturedArtisansDto,
  ): Promise<SetHomepageFeaturedArtisansResponseDto> {
    const resolved: string[] = [];
    for (const raw of dto.artisanIds) {
      const id = await this.resolveArtisanUserId(raw);
      if (!resolved.includes(id)) {
        resolved.push(id);
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.homepageFeaturedArtisan.deleteMany({});
      if (resolved.length > 0) {
        await tx.homepageFeaturedArtisan.createMany({
          data: resolved.map((artisanId, index) => ({
            artisanId,
            sortOrder: index,
          })),
        });
      }
    });

    const list = await this.list();
    return {
      success: true,
      message: 'Sélection artisans homepage mise à jour.',
      items: list.items,
    };
  }

  private toAdminItem(
    sortOrder: number,
    artisan: {
      id: string;
      referenceCode: string;
      displayName: string;
      profile: { city: string | null; craft: string | null; avatarUrl: string | null } | null;
    },
  ): HomepageFeaturedArtisanAdminItemDto {
    return {
      sortOrder,
      publicId: publicArtisanId(artisan),
      userId: artisan.id,
      displayName: artisan.displayName,
      referenceCode: artisan.referenceCode,
      craft: artisan.profile?.craft ?? null,
      city: artisan.profile?.city ?? null,
      avatarUrl: artisan.profile?.avatarUrl ?? null,
    };
  }

  private async resolveArtisanUserId(raw: string): Promise<string> {
    const trimmed = raw.trim();
    if (!trimmed) {
      throw new BadRequestException({
        code: 'EMPTY_ARTISAN_ID',
        message: 'Identifiant artisan vide.',
      });
    }

    const direct = await this.prisma.user.findFirst({
      where: {
        role: UserRole.ARTISAN,
        OR: [{ id: trimmed }, { referenceCode: trimmed }],
      },
      select: { id: true },
    });
    if (direct) {
      return direct.id;
    }

    const ref = parseArtisanPublicId(trimmed);
    if (ref) {
      const byRef = await this.prisma.user.findFirst({
        where: { role: UserRole.ARTISAN, referenceCode: ref },
        select: { id: true },
      });
      if (byRef) {
        return byRef.id;
      }
    }

    throw new NotFoundException({
      code: 'ARTISAN_NOT_FOUND',
      message: `Artisan introuvable ou identifiant invalide : ${trimmed}`,
    });
  }
}
