import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import {
  IBackofficeDashboardRepository,
  OrderMonthStats,
} from './backoffice-dashboard.repository.interface';

@Injectable()
export class BackofficeDashboardPrismaRepository
  implements IBackofficeDashboardRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async countUsers(): Promise<number> {
    return this.prisma.user.count();
  }

  async countCustomers(): Promise<number> {
    return this.prisma.user.count({ where: { role: UserRole.CUSTOMER } });
  }

  async countArtisans(): Promise<number> {
    return this.prisma.artisan.count();
  }

  async getCurrentMonthOrderStats(): Promise<OrderMonthStats> {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    const [orderCount, lines] = await Promise.all([
      this.prisma.order.count({
        where: { createdAt: { gte: start } },
      }),
      this.prisma.orderLine.findMany({
        where: { order: { createdAt: { gte: start } } },
        select: { unitPrice: true, quantity: true },
      }),
    ]);

    const revenue = lines.reduce(
      (sum, line) => sum + line.unitPrice * line.quantity,
      0,
    );

    return { orderCount, revenue };
  }
}
