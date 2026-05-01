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
import { PrismaService } from '../../database/prisma.service';
import type {
  CreateOrderBodyDto,
  CreateCheckoutSessionSuccessDto,
  CreateOrderSuccessDto,
} from './dto/create-order.dto';
import type {
  CreatePaymentAttemptBodyDto,
  PaymentProvidersQueryDto,
} from './dto/dexpay.dto';
import { DexpayService } from './dexpay.service';

const SHIPPING_FLAT_EUR = 35;

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

/** DEXPAY valide les URLs (success / failure / webhook) : pas de localhost. */
function isLocalhostUrl(url: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(url.trim());
}

/**
 * DEXPAY (SN) attend un numéro local sur 9 chiffres.
 * Exemples: +221771234567 / 221771234567 / 77 123 45 67 -> 771234567
 */
function normalizePhoneForDexpay(phone: string, countryISO: string): string {
  const digits = phone.replace(/\D/g, '');
  if (countryISO.trim().toUpperCase() !== 'SN') {
    return digits || phone.trim();
  }
  if (digits.length === 9) return digits;
  if (digits.length === 12 && digits.startsWith('221')) return digits.slice(-9);
  return digits || phone.trim();
}

@Injectable()
export class OrdersService {
  constructor(
    @Inject(ORDERS_REPOSITORY)
    private readonly ordersRepository: IOrdersRepository,
    private readonly prisma: PrismaService,
    private readonly dexpay: DexpayService,
  ) {}

  async createCheckoutSession(
    user: User,
    dto: CreateOrderBodyDto,
  ): Promise<CreateCheckoutSessionSuccessDto> {
    const cart = await this.ordersRepository.findUserCart(user.id);
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException({
        code: 'EMPTY_CART',
        message: 'Votre panier est vide.',
      });
    }
    const insufficient = cart.items.find((item) => item.quantity > item.product.stockQuantity);
    if (insufficient) {
      throw new BadRequestException({
        code: 'INSUFFICIENT_STOCK',
        message: `Stock insuffisant pour ${insufficient.product.name}.`,
      });
    }
    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.quantity * item.product.price,
      0,
    );
    const shippingFee = subtotal > 0 ? SHIPPING_FLAT_EUR : 0;
    const total = subtotal + shippingFee;
    const reference = `PAY_${Date.now()}_${user.id.slice(-6)}`;
    const frontendBase = stripTrailingSlash(
      process.env.FRONTEND_HOME_URL ?? process.env.FRONTEND_URL ?? '',
    );
    const successUrl = stripTrailingSlash(
      process.env.DEXPAY_SUCCESS_URL ??
        process.env.FRONTEND_SUCCESS_URL ??
        (frontendBase ? `${frontendBase}/checkout/success` : 'http://localhost:3000/checkout/success'),
    );
    const failureUrl = stripTrailingSlash(
      process.env.DEXPAY_FAILURE_URL ??
        process.env.FRONTEND_FAILURE_URL ??
        (frontendBase ? `${frontendBase}/checkout/failure` : 'http://localhost:3000/checkout/failure'),
    );
    const apiBaseCandidate =
      process.env.API_PUBLIC_URL ?? process.env.RENDER_EXTERNAL_URL ?? '';
    const apiBase =
      apiBaseCandidate && !isLocalhostUrl(apiBaseCandidate)
        ? stripTrailingSlash(apiBaseCandidate)
        : '';
    if (!apiBase) {
      throw new InternalServerErrorException({
        code: 'DEXPAY_PUBLIC_API_URL_REQUIRED',
        message:
          'DEXPAY refuse les URLs en localhost pour webhook_url. Définissez API_PUBLIC_URL avec l’URL HTTPS publique de cette API (ex. déploiement ou tunnel ngrok), suffixe /api/v1 inclus.',
      });
    }
    const webhookUrl = `${apiBase}/orders/webhooks/dexpay`;

    const session = await this.dexpay.createCheckoutSession({
      reference,
      itemName: `Commande Sendiaba (${cart.items.length} article(s))`,
      amount: total,
      webhookUrl,
      successUrl,
      failureUrl,
      metadata: { userId: user.id },
    });

    await this.prisma.paymentSession.create({
      data: {
        userId: user.id,
        provider: 'DEXPAY',
        reference,
        paymentUrl: session.paymentUrl,
        amount: total,
        currency: 'XOF',
        checkoutPayload: dto.checkout as unknown as object,
        providerPayload: session.raw as object,
        status: 'PENDING',
      },
    });

    return {
      success: true,
      data: { reference, paymentUrl: session.paymentUrl, status: 'pending' },
    };
  }

  async listDexpayPaymentProviders(query: PaymentProvidersQueryDto) {
    const data = await this.dexpay.listPaymentProviders(query);
    return { success: true as const, data };
  }

  async createDexpayPaymentAttempt(
    user: User,
    reference: string,
    dto: CreatePaymentAttemptBodyDto,
  ) {
    const session = await this.prisma.paymentSession.findFirst({
      where: {
        reference: reference.trim(),
        userId: user.id,
        status: 'PENDING',
      },
    });
    if (!session) {
      throw new NotFoundException({
        code: 'PAYMENT_SESSION_NOT_FOUND',
        message:
          'Session de paiement introuvable, expirée ou déjà utilisée. Créez une nouvelle session depuis le panier.',
      });
    }
    const data = await this.dexpay.createTransactionAttempt(reference.trim(), {
      payment_method: dto.payment_method,
      operator: dto.operator,
      customer: {
        ...dto.customer,
        phone: normalizePhoneForDexpay(dto.customer.phone, dto.countryISO),
      },
      countryISO: dto.countryISO,
    });
    return { success: true as const, data };
  }

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
    const insufficient = cart.items.find((item) => item.quantity > item.product.stockQuantity);
    if (insufficient) {
      throw new BadRequestException({
        code: 'INSUFFICIENT_STOCK',
        message: `Stock insuffisant pour ${insufficient.product.name}.`,
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

    await this.prisma.orderStatusEvent.create({
      data: {
        orderId: created.id,
        status: created.status,
        note: 'Commande créée',
        changedById: user.id,
      },
    });
    const artisanIds = Array.from(
      new Set(created.lines.map((line) => line.product.artisanId)),
    );
    await Promise.all(
      created.lines.map((line) =>
        this.prisma.product.update({
          where: { id: line.productId },
          data: {
            stockQuantity: { decrement: line.quantity },
          },
        }),
      ),
    );
    if (artisanIds.length > 0) {
      await this.prisma.artisanNotification.createMany({
        data: artisanIds.map((artisanId) => ({
          artisanId,
          orderId: created.id,
          type: 'ORDER_CREATED',
          title: 'Nouvelle commande',
          message: `Une nouvelle commande ${publicOrderId(created)} contient vos produits.`,
          payload: { orderId: publicOrderId(created) },
        })),
      });
    }
    return { success: true, data: this.toOrderData(created, subtotal, shippingFee) };
  }

  async confirmDexpayWebhook(payload: Record<string, unknown>) {
    const data = (payload.data as Record<string, unknown> | undefined) ?? payload;
    const reference = String(data.reference ?? '');
    const status = String(data.status ?? '').toLowerCase();
    if (!reference) {
      throw new BadRequestException({ code: 'INVALID_WEBHOOK', message: 'Reference absente.' });
    }
    const paymentSession = await this.prisma.paymentSession.findUnique({ where: { reference } });
    if (!paymentSession) {
      throw new NotFoundException({ code: 'PAYMENT_SESSION_NOT_FOUND', message: 'Session paiement introuvable.' });
    }
    if (paymentSession.status === 'SUCCESS') {
      return { success: true };
    }
    if (status !== 'success' && status !== 'completed') {
      await this.prisma.paymentSession.update({
        where: { id: paymentSession.id },
        data: { status: 'FAILED', providerPayload: payload as object },
      });
      return { success: true };
    }

    const checkout = paymentSession.checkoutPayload as unknown as CreateOrderBodyDto['checkout'];
    const created = await this.ordersRepository.createOrderFromCart(paymentSession.userId, {
      fullName: checkout.fullName,
      phone: checkout.phone,
      country: checkout.country,
      city: checkout.city,
      district: checkout.district,
      addressLine: checkout.addressLine,
      postalCode: checkout.postalCode,
      notes: checkout.notes,
      paymentMethod: this.toPrismaPaymentMethod(checkout.paymentMethod),
    });
    if (!created) {
      throw new BadRequestException({ code: 'EMPTY_CART', message: 'Panier vide au moment de la confirmation.' });
    }

    await this.prisma.paymentSession.update({
      where: { id: paymentSession.id },
      data: { status: 'SUCCESS', orderId: created.id, providerPayload: payload as object },
    });

    await this.prisma.orderStatusEvent.create({
      data: {
        orderId: created.id,
        status: created.status,
        note: 'Paiement confirmé via DEXPAY',
        changedById: paymentSession.userId,
      },
    });

    const artisanIds = Array.from(new Set(created.lines.map((line) => line.product.artisanId)));
    await Promise.all(
      created.lines.map((line) =>
        this.prisma.product.update({
          where: { id: line.productId },
          data: {
            stockQuantity: { decrement: line.quantity },
          },
        }),
      ),
    );
    if (artisanIds.length > 0) {
      await this.prisma.artisanNotification.createMany({
        data: artisanIds.map((artisanId) => ({
          artisanId,
          orderId: created.id,
          type: 'ORDER_PAID',
          title: 'Commande payée',
          message: `La commande ${publicOrderId(created)} est payée et en attente de validation.`,
          payload: { orderId: publicOrderId(created) },
        })),
      });
    }
    if (artisanIds.length > 1) {
      const admins = await this.prisma.user.findMany({ where: { role: 'ADMIN' } });
      if (admins.length > 0) {
        await this.prisma.adminNotification.createMany({
          data: admins.map((admin) => ({
            adminId: admin.id,
            orderId: created.id,
            type: 'MULTI_ARTISAN_ORDER',
            title: 'Commande multi-artisans',
            message: `La commande ${publicOrderId(created)} concerne ${artisanIds.length} artisans.`,
            payload: { orderId: publicOrderId(created), artisanCount: artisanIds.length },
          })),
        });
      }
    }
    return { success: true };
  }

  async findOrderById(user: User, orderId: string): Promise<CreateOrderSuccessDto['data']> {
    const suffix = parsePublicOrderId(orderId);
    const found = await this.prisma.order.findFirst({
      where: {
        userId: user.id,
        OR: [{ id: orderId }, ...(suffix ? [{ id: { endsWith: suffix } }] : [])],
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        user: true,
        checkout: true,
        lines: { include: { product: true } },
      },
    });
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

  async listOrders(user: User) {
    const rows = await this.prisma.order.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        status: true,
        createdAt: true,
        user: true,
        checkout: true,
        lines: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const completeRows = rows.filter((row) => row.checkout);
    return {
      data: completeRows.map((row) => {
        const subtotal = row.lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
        const shippingFee = subtotal > 0 ? SHIPPING_FLAT_EUR : 0;
        return this.toOrderData(row, subtotal, shippingFee);
      }),
    };
  }

  async trackOrder(user: User, orderId: string) {
    const suffix = parsePublicOrderId(orderId);
    const realOrder = await this.prisma.order.findFirst({
      where: {
        userId: user.id,
        OR: [{ id: orderId }, ...(suffix ? [{ id: { endsWith: suffix } }] : [])],
      },
      select: { id: true },
    });
    if (!realOrder) {
      throw new NotFoundException({ code: 'ORDER_NOT_FOUND', message: 'Commande introuvable.' });
    }
    const timeline = await this.prisma.orderStatusEvent.findMany({
      where: { orderId: realOrder.id },
      orderBy: { createdAt: 'asc' },
    });
    return {
      data: {
        orderId: publicOrderId(realOrder),
        timeline: timeline.map((t) => ({
          status: this.toPublicStatus(t.status),
          note: t.note ?? null,
          at: t.createdAt.toISOString(),
        })),
      },
    };
  }

  async listClientNotifications(user: User) {
    const events = await this.prisma.orderStatusEvent.findMany({
      where: {
        order: { userId: user.id },
        status: { in: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
      },
      include: { order: { select: { id: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return {
      data: {
        items: events.map((e) => ({
          orderId: publicOrderId(e.order),
          status: this.toPublicStatus(e.status),
          note: e.note ?? null,
          at: e.createdAt.toISOString(),
        })),
      },
    };
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
    created: {
      id: string;
      status: OrderStatus;
      createdAt: Date;
      user: { referenceCode: string };
      lines: Array<{
        productName: string;
        productImage: string | null;
        unitPrice: number;
        quantity: number;
        product: { referenceCode: string };
      }>;
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
    },
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
