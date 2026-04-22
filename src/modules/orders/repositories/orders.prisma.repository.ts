import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import type {
  CartSnapshot,
  CheckoutPayload,
  CreatedOrderBundle,
  IOrdersRepository,
} from './orders.repository.interface';

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

      const order = await tx.order.create({
        data: {
          userId,
          lines: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              productName: item.product.name,
              productImage: item.product.imageUrl,
              unitPrice: item.product.price,
              quantity: item.quantity,
            })),
          },
          checkout: {
            create: {
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
          },
        },
        include: {
          lines: {
            include: {
              product: true,
            },
          },
          checkout: true,
          user: true,
        },
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
      include: {
        lines: {
          include: {
            product: true,
          },
        },
        checkout: true,
        user: true,
      },
    });
  }
}
