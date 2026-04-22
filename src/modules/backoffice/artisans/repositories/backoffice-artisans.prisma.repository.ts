import { Injectable } from '@nestjs/common';
import { Artisan, ArtisanStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import {
  ArtisanListFilters,
  IBackofficeArtisansRepository,
} from './backoffice-artisans.repository.interface';

@Injectable()
export class BackofficeArtisansPrismaRepository
  implements IBackofficeArtisansRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: ArtisanListFilters): Promise<Artisan[]> {
    return this.prisma.artisan.findMany({
      where: this.buildWhere(filters),
      orderBy: { createdAt: 'desc' },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    });
  }

  async count(
    filters: Omit<ArtisanListFilters, 'page' | 'limit'>,
  ): Promise<number> {
    return this.prisma.artisan.count({
      where: this.buildWhere(filters),
    });
  }

  async findByIdentifier(identifier: string): Promise<Artisan | null> {
    return this.prisma.artisan.findFirst({
      where: {
        OR: [{ id: identifier }, { referenceCode: identifier }],
      },
    });
  }

  async update(id: string, data: Prisma.ArtisanUpdateInput): Promise<Artisan> {
    return this.prisma.artisan.update({ where: { id }, data });
  }

  async updateStatus(id: string, status: ArtisanStatus): Promise<Artisan> {
    return this.prisma.artisan.update({ where: { id }, data: { status } });
  }

  async updatePhoto(id: string, photoUrl: string): Promise<Artisan> {
    return this.prisma.artisan.update({ where: { id }, data: { photoUrl } });
  }

  private buildWhere(
    filters: Pick<ArtisanListFilters, 'search' | 'status'>,
  ): Prisma.ArtisanWhereInput {
    return {
      status: filters.status,
      OR: filters.search
        ? [
            { fullName: { contains: filters.search, mode: 'insensitive' } },
            { craft: { contains: filters.search, mode: 'insensitive' } },
            { city: { contains: filters.search, mode: 'insensitive' } },
            { email: { contains: filters.search, mode: 'insensitive' } },
            {
              referenceCode: {
                contains: filters.search,
                mode: 'insensitive',
              },
            },
          ]
        : undefined,
    };
  }
}
