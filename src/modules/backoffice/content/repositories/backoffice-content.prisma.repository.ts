import { Injectable } from '@nestjs/common';
import { ContentEntry, Prisma } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import {
  ContentEntryListFilters,
  ContentEntryWithUpdater,
  IBackofficeContentRepository,
} from './backoffice-content.repository.interface';

@Injectable()
export class BackofficeContentPrismaRepository
  implements IBackofficeContentRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async findMany(filters: ContentEntryListFilters): Promise<ContentEntry[]> {
    return this.prisma.contentEntry.findMany({
      where: this.buildWhere(filters),
      orderBy: [{ scope: 'asc' }, { key: 'asc' }],
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    });
  }

  async count(
    filters: Omit<ContentEntryListFilters, 'page' | 'limit'>,
  ): Promise<number> {
    return this.prisma.contentEntry.count({
      where: this.buildWhere(filters),
    });
  }

  async findByKey(key: string): Promise<ContentEntryWithUpdater | null> {
    const entry = await this.prisma.contentEntry.findUnique({
      where: { key },
    });
    if (!entry) {
      return null;
    }
    const updatedBy = entry.updatedById
      ? await this.prisma.user.findUnique({
          where: { id: entry.updatedById },
          select: { id: true, displayName: true, role: true, email: true },
        })
      : null;
    return { ...entry, updatedBy };
  }

  async updateByKey(
    key: string,
    data: { overrideValue: string | null; updatedById: string | null },
  ): Promise<ContentEntry> {
    return this.prisma.contentEntry.update({
      where: { key },
      data: {
        overrideValue: data.overrideValue,
        updatedById: data.updatedById,
      },
    });
  }

  private buildWhere(
    filters: Pick<ContentEntryListFilters, 'scope' | 'search'>,
  ): Prisma.ContentEntryWhereInput {
    return {
      scope: filters.scope,
      OR: filters.search
        ? [
            { key: { contains: filters.search, mode: 'insensitive' } },
            { label: { contains: filters.search, mode: 'insensitive' } },
            { defaultValue: { contains: filters.search, mode: 'insensitive' } },
            {
              overrideValue: {
                contains: filters.search,
                mode: 'insensitive',
              },
            },
          ]
        : undefined,
    };
  }
}
