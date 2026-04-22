import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import type {
  BackofficeUserListRow,
  IBackofficeUsersRepository,
  UserListFilters,
} from './backoffice-users.repository.interface';

const listSelect = {
  id: true,
  referenceCode: true,
  displayName: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  profile: { select: { city: true } },
  _count: { select: { orders: true } },
} satisfies Prisma.UserSelect;

@Injectable()
export class BackofficeUsersPrismaRepository implements IBackofficeUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(filters: UserListFilters): Promise<BackofficeUserListRow[]> {
    const rows = await this.prisma.user.findMany({
      where: this.buildWhere(filters),
      orderBy: { createdAt: 'desc' },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      select: listSelect,
    });
    return rows as BackofficeUserListRow[];
  }

  async count(filters: Omit<UserListFilters, 'page' | 'limit'>): Promise<number> {
    return this.prisma.user.count({
      where: this.buildWhere(filters),
    });
  }

  async findByIdentifier(identifier: string): Promise<BackofficeUserListRow | null> {
    const row = await this.prisma.user.findFirst({
      where: {
        OR: [{ id: identifier }, { referenceCode: identifier }],
      },
      select: listSelect,
    });
    return row as BackofficeUserListRow | null;
  }

  private buildWhere(
    filters: Pick<UserListFilters, 'search' | 'role' | 'status'>,
  ): Prisma.UserWhereInput {
    return {
      role: filters.role,
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
          ]
        : undefined,
    };
  }
}
