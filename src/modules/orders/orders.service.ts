import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, PaymentMethod } from '@prisma/client';
import type { User } from '@prisma/client';
import {
  parsePublicOrderId,
  publicOrderId,
  publicProductId,
  publicUserId,
} from '../../common/utils/public-ids.util';
import {
  ORDERS_REPOSITORY,
  type IOrdersRepository,
} from './repositories/orders.repository.interface';
import type {
  CreateOrderBodyDto,
  CreateOrderSuccessDto,
} from './dto/create-order.dto';

const SHIPPING_FLAT_EUR = 35;

@Injectable()
export class OrdersService {
  constructor(
    @Inject(ORDERS_REPOSITORY)
    private readonly ordersRepository: IOrdersRepository,
  ) {}

  async createOrder(
    user: User,
    dto: CreateOrderBodyDto,
  ): Promise<CreateOrderSuccessDto> {
    const cart = await this.ordersRepository.findUserCart(user.id);
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException({
        code: 'EMPTY_CART',
        message: 'Votre panier est vide.',
      });
    }

    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.quantity * item.product.price,
      0,
    );
    const shippingFee = subtotal > 0 ? SHIPPING_FLAT_EUR : 0;

    const created = await this.ordersRepository.createOrderFromCart(user.id, {
      fullName: dto.checkout.fullName,
      phone: dto.checkout.phone,
      country: dto.checkout.country,
      city: dto.checkout.city,
      district: dto.checkout.district,
      addressLine: dto.checkout.addressLine,
      postalCode: dto.checkout.postalCode,
      notes: dto.checkout.notes,
      paymentMethod: this.toPrismaPaymentMethod(dto.checkout.paymentMethod),
    });
    if (!created) {
      throw new BadRequestException({
        code: 'EMPTY_CART',
        message: 'Votre panier est vide.',
      });
    }
    const checkout = created.checkout;
    if (!checkout) {
      throw new InternalServerErrorException({
        code: 'CHECKOUT_NOT_CREATED',
        message: 'Le checkout de la commande est introuvable.',
      });
    }

    return { success: true, data: this.toOrderData(created, subtotal, shippingFee) };
  }

  async findOrderById(user: User, orderId: string): Promise<CreateOrderSuccessDto['data']> {
    const suffix = parsePublicOrderId(orderId);
    const found = await this.ordersRepository.findOrderForUser(user.id, orderId, suffix);
    if (!found || !found.checkout) {
      throw new NotFoundException({
        code: 'ORDER_NOT_FOUND',
        message: 'Commande introuvable.',
      });
    }

    const subtotal = found.lines.reduce(
      (sum, line) => sum + line.quantity * line.unitPrice,
      0,
    );
    const shippingFee = subtotal > 0 ? SHIPPING_FLAT_EUR : 0;

    return this.toOrderData(found, subtotal, shippingFee);
  }

  private toPrismaPaymentMethod(value: string): PaymentMethod {
    switch (value) {
      case 'mobile_money':
        return PaymentMethod.MOBILE_MONEY;
      case 'card':
        return PaymentMethod.CARD;
      case 'bank_transfer':
        return PaymentMethod.BANK_TRANSFER;
      default:
        throw new BadRequestException({
          code: 'INVALID_PAYMENT_METHOD',
          message: 'Moyen de paiement invalide.',
        });
    }
  }

  private toPublicPaymentMethod(
    paymentMethod: PaymentMethod,
  ): 'mobile_money' | 'card' | 'bank_transfer' {
    switch (paymentMethod) {
      case PaymentMethod.MOBILE_MONEY:
        return 'mobile_money';
      case PaymentMethod.CARD:
        return 'card';
      case PaymentMethod.BANK_TRANSFER:
        return 'bank_transfer';
    }
  }

  private toPublicStatus(
    status: OrderStatus,
  ): CreateOrderSuccessDto['data']['status'] {
    switch (status) {
      case OrderStatus.PENDING:
        return 'pending';
      case OrderStatus.CONFIRMED:
        return 'confirmed';
      case OrderStatus.IN_PREPARATION:
        return 'in_preparation';
      case OrderStatus.SHIPPED:
        return 'shipped';
      case OrderStatus.DELIVERED:
        return 'delivered';
      case OrderStatus.CANCELLED:
        return 'cancelled';
    }
  }

  private toOrderData(
    created: NonNullable<Awaited<ReturnType<IOrdersRepository['createOrderFromCart']>>>,
    subtotal: number,
    shippingFee: number,
  ): CreateOrderSuccessDto['data'] {
    const checkout = created.checkout;
    if (!checkout) {
      throw new InternalServerErrorException({
        code: 'CHECKOUT_NOT_CREATED',
        message: 'Le checkout de la commande est introuvable.',
      });
    }

    return {
      id: publicOrderId(created),
      userId: publicUserId(created.user),
      status: this.toPublicStatus(created.status),
      createdAt: created.createdAt.toISOString(),
      lines: created.lines.map((line) => ({
        productId: publicProductId(line.product),
        productName: line.productName,
        productImage: line.productImage ?? null,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
      })),
      subtotal,
      shippingFee,
      total: subtotal + shippingFee,
      checkout: {
        fullName: checkout.fullName,
        phone: checkout.phone,
        country: checkout.country,
        city: checkout.city,
        district: checkout.district ?? null,
        addressLine: checkout.addressLine,
        postalCode: checkout.postalCode ?? null,
        notes: checkout.notes ?? null,
        paymentMethod: this.toPublicPaymentMethod(checkout.paymentMethod),
      },
    };
  }
}
