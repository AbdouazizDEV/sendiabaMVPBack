import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { publicUserId } from '../../common/utils/public-ids.util';
import { ArtisanCustomersQueryDto } from './dto/artisan-space.dto';

@Injectable()
export class ArtisanCustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: User, query: ArtisanCustomersQueryDto) {
    const orders = await this.prisma.order.findMany({
      where: {
        lines: { some: { product: { artisanId: user.id } } },
      },
      include: {
        user: { include: { profile: true } },
        lines: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const acc = new Map<
      string,
      { userId: string; referenceCode: string; displayName: string; email: string; city: string | null; ordersCount: number; totalSpent: number; lastOrderAt: Date }
    >();
    for (const order of orders) {
      const amount = order.lines
        .filter((l) => l.product.artisanId === user.id)
        .reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
      const existing = acc.get(order.userId);
      if (!existing) {
        acc.set(order.userId, {
          userId: order.user.id,
          referenceCode: order.user.referenceCode,
          displayName: order.user.displayName,
          email: order.user.email,
          city: order.user.profile?.city ?? null,
          ordersCount: 1,
          totalSpent: amount,
          lastOrderAt: order.createdAt,
        });
      } else {
        existing.ordersCount += 1;
        existing.totalSpent += amount;
        if (order.createdAt > existing.lastOrderAt) existing.lastOrderAt = order.createdAt;
      }
    }

    let rows = Array.from(acc.values());
    if (query.search?.trim()) {
      const q = query.search.trim().toLowerCase();
      rows = rows.filter((r) => r.displayName.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));
    }
    const total = rows.length;
    const start = (query.page - 1) * query.limit;
    rows = rows.slice(start, start + query.limit);
    return {
      items: rows.map((r) => ({
        id: publicUserId({ referenceCode: r.referenceCode }),
        name: r.displayName,
        email: r.email,
        city: r.city,
        ordersCount: r.ordersCount,
        totalSpent: Number(r.totalSpent.toFixed(2)),
        lastOrderAt: r.lastOrderAt.toISOString(),
      })),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }
}
