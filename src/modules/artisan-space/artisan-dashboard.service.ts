import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ArtisanDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async kpis(user: User) {
    const [orders, products] = await Promise.all([
      this.prisma.order.findMany({
        where: { lines: { some: { product: { artisanId: user.id } } } },
        include: { lines: { include: { product: true } } },
      }),
      this.prisma.product.count({ where: { artisanId: user.id } }),
    ]);
    let revenue = 0;
    let itemsSold = 0;
    const customerSet = new Set<string>();
    for (const order of orders) {
      customerSet.add(order.userId);
      for (const line of order.lines) {
        if (line.product.artisanId === user.id) {
          revenue += line.unitPrice * line.quantity;
          itemsSold += line.quantity;
        }
      }
    }
    return {
      success: true,
      data: {
        totalProducts: products,
        totalOrders: orders.length,
        totalCustomers: customerSet.size,
        totalItemsSold: itemsSold,
        totalRevenue: Number(revenue.toFixed(2)),
      },
    };
  }
}
