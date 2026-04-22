import type { PaymentMethod, Prisma } from '@prisma/client';

export const ORDERS_REPOSITORY = Symbol('IOrdersRepository');

export type CartSnapshot = Prisma.CartGetPayload<{
  include: {
    items: {
      include: {
        product: true;
      };
    };
  };
}>;

export type CreatedOrderBundle = Prisma.OrderGetPayload<{
  include: {
    lines: {
      include: {
        product: true;
      };
    };
    checkout: true;
    user: true;
  };
}>;

export interface CheckoutPayload {
  fullName: string;
  phone: string;
  country: string;
  city: string;
  district?: string;
  addressLine: string;
  postalCode?: string;
  notes?: string;
  paymentMethod: PaymentMethod;
}

export interface IOrdersRepository {
  findUserCart(userId: string): Promise<CartSnapshot | null>;
  createOrderFromCart(
    userId: string,
    checkout: CheckoutPayload,
  ): Promise<CreatedOrderBundle | null>;
  findOrderForUser(
    userId: string,
    orderIdentifier: string,
    publicSuffix?: string | null,
  ): Promise<CreatedOrderBundle | null>;
}
