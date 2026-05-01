import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, User } from '@prisma/client';
import { parsePublicOrderId, publicOrderId, publicProductId, publicUserId } from '../../common/utils/public-ids.util';
import { PrismaService } from '../../database/prisma.service';
import {
  ArtisanOrderProgressMailDto,
  ArtisanOrderQueryDto,
  ArtisanOrderStatusUpdateDto,
} from './dto/artisan-space.dto';
import { ArtisanMailService } from './artisan-mail.service';

@Injectable()
export class ArtisanOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly artisanMail: ArtisanMailService,
  ) {}

  async list(user: User, query: ArtisanOrderQueryDto) {
    const where = {
      lines: { some: { product: { artisanId: user.id } } },
      status: query.status ? this.toPrismaStatus(query.status) : undefined,
      OR: query.search
        ? [
            { id: { endsWith: query.search } },
            { user: { email: { contains: query.search, mode: 'insensitive' as const } } },
            { checkout: { fullName: { contains: query.search, mode: 'insensitive' as const } } },
          ]
        : undefined,
    };
    const [rows, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        select: {
          id: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          user: true,
          checkout: true,
          lines: { include: { product: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.order.count({ where }),
    ]);
    return {
      items: rows.map((o) => this.toOrderSummary(o, user.id)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  async updateStatus(user: User, orderId: string, dto: ArtisanOrderStatusUpdateDto) {
    const order = await this.findOwnedOrder(user.id, orderId);
    const status = this.toPrismaStatus(dto.status);
    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: { status },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        user: true,
        checkout: true,
        lines: { include: { product: true } },
      },
    });
    await this.prisma.orderStatusEvent.create({
      data: {
        orderId: updated.id,
        status: updated.status,
        note: dto.note ?? `Commande ${dto.status}`,
        changedById: user.id,
      },
    });
    return { success: true, data: this.toOrderSummary(updated, user.id) };
  }

  async sendProgressMail(user: User, orderId: string, dto: ArtisanOrderProgressMailDto) {
    const order = await this.findOwnedOrder(user.id, orderId);
    const publicId = publicOrderId(order);
    const customerName = order.checkout?.fullName ?? order.user.displayName;
    await this.artisanMail.sendOrderProgressMail({
      to: order.user.email,
      customerName,
      orderPublicId: publicId,
      status: dto.status,
      message: dto.message,
    });
    await this.prisma.orderStatusEvent.create({
      data: {
        orderId: order.id,
        status: this.toPrismaStatus(dto.status),
        note: dto.message ?? `Email de progression envoyé (${dto.status})`,
        changedById: user.id,
      },
    });
    return { success: true };
  }

  async track(user: User, orderId: string) {
    const order = await this.findOwnedOrder(user.id, orderId);
    const events = await this.prisma.orderStatusEvent.findMany({
      where: { orderId: order.id },
      orderBy: { createdAt: 'asc' },
    });
    return {
      data: {
        order: this.toOrderSummary(order, user.id),
        timeline: events.map((e) => ({
          status: e.status.toLowerCase(),
          note: e.note ?? null,
          at: e.createdAt.toISOString(),
        })),
      },
    };
  }

  private async findOwnedOrder(artisanId: string, orderPublicOrRawId: string) {
    const suffix = parsePublicOrderId(orderPublicOrRawId);
    const row = await this.prisma.order.findFirst({
      where: {
        lines: { some: { product: { artisanId } } },
        OR: [{ id: orderPublicOrRawId }, ...(suffix ? [{ id: { endsWith: suffix } }] : [])],
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        user: true,
        checkout: true,
        lines: { include: { product: true } },
      },
    });
    if (!row) {
      throw new NotFoundException({ code: 'ORDER_NOT_FOUND', message: 'Commande introuvable.' });
    }
    return row;
  }

  private toPrismaStatus(status: string): OrderStatus {
    switch (status.toLowerCase()) {
      case 'pending':
        return OrderStatus.PENDING;
      case 'confirmed':
        return OrderStatus.CONFIRMED;
      case 'in_preparation':
        return OrderStatus.IN_PREPARATION;
      case 'shipped':
        return OrderStatus.SHIPPED;
      case 'delivered':
        return OrderStatus.DELIVERED;
      case 'cancelled':
        return OrderStatus.CANCELLED;
      default:
        throw new BadRequestException({ code: 'INVALID_ORDER_STATUS', message: 'Statut commande invalide.' });
    }
  }

  private toOrderSummary(
    o: Awaited<ReturnType<ArtisanOrdersService['findOwnedOrder']>>,
    artisanId: string,
  ) {
    const lines = o.lines.filter((l) => l.product.artisanId === artisanId);
    const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
    return {
      id: publicOrderId(o),
      status: o.status.toLowerCase(),
      customer: {
        id: publicUserId(o.user),
        name: o.user.displayName,
        email: o.user.email,
      },
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
      subtotal,
      lines: lines.map((l) => ({
        productId: publicProductId(l.product),
        productName: l.productName,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
      })),
    };
  }
}
