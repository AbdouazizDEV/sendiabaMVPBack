import { Injectable } from '@nestjs/common';
import {
  ArtisanStatus,
  Prisma,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import {
  ArtisanListFilters,
  BackofficeArtisanUserRow,
  IBackofficeArtisansRepository,
  UpdateBackofficeArtisanUserData,
} from './backoffice-artisans.repository.interface';

const userArtisanSelect = {
  id: true,
  referenceCode: true,
  displayName: true,
  email: true,
  status: true,
  updatedAt: true,
  profile: { select: { city: true, phone: true, avatarUrl: true } },
} satisfies Prisma.UserSelect;

@Injectable()
export class BackofficeArtisansPrismaRepository implements IBackofficeArtisansRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    filters: ArtisanListFilters,
  ): Promise<BackofficeArtisanUserRow[]> {
    const rows = await this.prisma.user.findMany({
      where: this.buildWhere(filters),
      orderBy: { createdAt: 'desc' },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      select: userArtisanSelect,
    });
    return rows;
  }

  async count(
    filters: Omit<ArtisanListFilters, 'page' | 'limit'>,
  ): Promise<number> {
    return this.prisma.user.count({
      where: this.buildWhere(filters),
    });
  }

  async findByIdentifier(
    identifier: string,
  ): Promise<BackofficeArtisanUserRow | null> {
    const row = await this.prisma.user.findFirst({
      where: {
        role: UserRole.ARTISAN,
        OR: [{ id: identifier }, { referenceCode: identifier }],
      },
      select: userArtisanSelect,
    });
    return row;
  }

  async update(
    id: string,
    data: UpdateBackofficeArtisanUserData,
  ): Promise<BackofficeArtisanUserRow | null> {
    const ok = await this.prisma.user.count({
      where: { id, role: UserRole.ARTISAN },
    });
    if (!ok) {
      return null;
    }
    const row = await this.prisma.user.update({
      where: { id },
      data: {
        displayName: data.fullName,
        email: data.email,
        status: data.status,
        profile: {
          upsert: {
            create: {
              city: data.city,
              phone: data.phone ?? null,
            },
            update: {
              city: data.city,
              phone: data.phone ?? null,
            },
          },
        },
      },
      select: userArtisanSelect,
    });
    return row;
  }

  async updateStatus(
    id: string,
    status: UserStatus,
  ): Promise<BackofficeArtisanUserRow | null> {
    const ok = await this.prisma.user.count({
      where: { id, role: UserRole.ARTISAN },
    });
    if (!ok) {
      return null;
    }
    const row = await this.prisma.user.update({
      where: { id },
      data: { status },
      select: userArtisanSelect,
    });
    return row;
  }

  async updatePhoto(
    id: string,
    photoUrl: string,
  ): Promise<BackofficeArtisanUserRow | null> {
    const ok = await this.prisma.user.count({
      where: { id, role: UserRole.ARTISAN },
    });
    if (!ok) {
      return null;
    }
    const row = await this.prisma.user.update({
      where: { id },
      data: {
        profile: {
          upsert: {
            create: { avatarUrl: photoUrl },
            update: { avatarUrl: photoUrl },
          },
        },
      },
      select: userArtisanSelect,
    });
    return row;
  }

  private buildWhere(
    filters: Pick<ArtisanListFilters, 'search' | 'status'>,
  ): Prisma.UserWhereInput {
    return {
      role: UserRole.ARTISAN,
      status: filters.status,
      OR: filters.search
        ? [
            { displayName: { contains: filters.search, mode: 'insensitive' } },
            { email: { contains: filters.search, mode: 'insensitive' } },
            {
              referenceCode: {
                contains: filters.search,
                mode: 'insensitive',
              },
            },
            {
              profile: {
                city: { contains: filters.search, mode: 'insensitive' },
              },
            },
          ]
        : undefined,
    };
  }

  async findCatalogByIdentifier(identifier: string) {
    return this.prisma.artisan.findFirst({
      where: {
        OR: [{ id: identifier }, { referenceCode: identifier }],
      },
    });
  }

  async updateCatalog(id: string, data: Prisma.ArtisanUpdateInput) {
    try {
      return await this.prisma.artisan.update({ where: { id }, data });
    } catch {
      return null;
    }
  }

  async updateCatalogStatus(id: string, status: ArtisanStatus) {
    try {
      return await this.prisma.artisan.update({ where: { id }, data: { status } });
    } catch {
      return null;
    }
  }

  async updateCatalogPhoto(id: string, photoUrl: string) {
    try {
      return await this.prisma.artisan.update({
        where: { id },
        data: { photoUrl },
      });
    } catch {
      return null;
    }
  }
}
