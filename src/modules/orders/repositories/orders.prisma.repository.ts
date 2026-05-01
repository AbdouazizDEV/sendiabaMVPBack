import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import type {
  CartSnapshot,
  CheckoutPayload,
  CreatedOrderBundle,
  IOrdersRepository,
} from './orders.repository.interface';

const orderBundleSelect = {
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: { id: true, referenceCode: true, displayName: true, email: true },
  },
  checkout: {
    select: {
      fullName: true,
      phone: true,
      country: true,
      city: true,
      district: true,
      addressLine: true,
      postalCode: true,
      notes: true,
      paymentMethod: true,
    },
  },
  lines: {
    select: {
      productId: true,
      productName: true,
      productImage: true,
      unitPrice: true,
      quantity: true,
      product: {
        select: {
          referenceCode: true,
          artisanId: true,
        },
      },
    },
  },
} satisfies Prisma.OrderSelect;

const cartInclude = {
  items: {
    include: {
      product: true,
    },
  },
} satisfies Prisma.CartInclude;

@Injectable()
export class OrdersPrismaRepository implements IOrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserCart(userId: string): Promise<CartSnapshot | null> {
    return this.prisma.cart.findUnique({
      where: { userId },
      include: cartInclude,
    });
  }

  async createOrderFromCart(
    userId: string,
    checkout: CheckoutPayload,
  ): Promise<CreatedOrderBundle | null> {
    return this.prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: cartInclude,
      });
      if (!cart || cart.items.length === 0) {
        return null;
      }

      const orderId = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      await tx.$executeRawUnsafe(
        `INSERT INTO orders (id, "userId", status, "createdAt", "updatedAt")
         VALUES ($1, $2, $3::"OrderStatus", NOW(), NOW())`,
        orderId,
        userId,
        'PENDING',
      );

      await tx.orderLine.createMany({
        data: cart.items.map((item) => ({
          orderId,
          productId: item.productId,
          productName: item.product.name,
          productImage: item.product.imageUrl,
          unitPrice: item.product.price,
          quantity: item.quantity,
        })),
      });

      await tx.orderCheckout.create({
        data: {
          orderId,
          fullName: checkout.fullName,
          phone: checkout.phone,
          country: checkout.country,
          city: checkout.city,
          district: checkout.district,
          addressLine: checkout.addressLine,
          postalCode: checkout.postalCode,
          notes: checkout.notes,
          paymentMethod: checkout.paymentMethod,
        },
      });

      const order = await tx.order.findUniqueOrThrow({
        where: { id: orderId },
        select: orderBundleSelect,
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return order;
    });
  }

  async findOrderForUser(
    userId: string,
    orderIdentifier: string,
    publicSuffix?: string | null,
  ): Promise<CreatedOrderBundle | null> {
    return this.prisma.order.findFirst({
      where: {
        userId,
        OR: [
          { id: orderIdentifier },
          ...(publicSuffix ? [{ id: { endsWith: publicSuffix } }] : []),
        ],
      },
      select: orderBundleSelect,
    });
  }
}
