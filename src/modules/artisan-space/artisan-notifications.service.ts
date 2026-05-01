import { Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ArtisanNotificationQueryDto } from './dto/artisan-space.dto';

@Injectable()
export class ArtisanNotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: User, query: ArtisanNotificationQueryDto) {
    const where = {
      artisanId: user.id,
      readAt: query.unreadOnly ? null : undefined,
    };
    const [rows, total, unreadCount] = await Promise.all([
      this.prisma.artisanNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.artisanNotification.count({ where }),
      this.prisma.artisanNotification.count({ where: { artisanId: user.id, readAt: null } }),
    ]);

    return {
      items: rows.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        orderId: n.orderId,
        payload: n.payload,
        readAt: n.readAt?.toISOString() ?? null,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  async markAsRead(user: User, id: string) {
    await this.prisma.artisanNotification.updateMany({
      where: { id, artisanId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true };
  }

  async markAllAsRead(user: User) {
    await this.prisma.artisanNotification.updateMany({
      where: { artisanId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true };
  }
}
