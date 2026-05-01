import type { OrderStatus, PaymentMethod, Prisma } from '@prisma/client';

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

export interface CreatedOrderBundle {
  id: string;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    referenceCode: string;
    displayName: string;
    email: string;
  };
  checkout: {
    fullName: string;
    phone: string;
    country: string;
    city: string;
    district: string | null;
    addressLine: string;
    postalCode: string | null;
    notes: string | null;
    paymentMethod: PaymentMethod;
  } | null;
  lines: Array<{
    productId: string;
    productName: string;
    productImage: string | null;
    unitPrice: number;
    quantity: number;
    product: {
      referenceCode: string;
      artisanId: string;
    };
  }>;
}

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
