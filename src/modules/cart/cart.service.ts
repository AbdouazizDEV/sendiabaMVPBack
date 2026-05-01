import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Cart, CartItem, Prisma, Product, User } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  parseProductPublicId,
  publicProductId,
} from '../../common/utils/public-ids.util';
import type {
  CartAddItemSuccessDto,
  CartDeleteSuccessDto,
  CartPatchSuccessDto,
  CartResponseDto,
} from './dto/cart.dto';

const SHIPPING_FLAT_EUR = 35;

const cartInclude = {
  items: {
    include: {
      product: { include: { category: true } },
    },
  },
} satisfies Prisma.CartInclude;

type CartLoaded = Cart & {
  items: (CartItem & {
    product: Product & { category: { slug: string } };
  })[];
};

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(user: User): Promise<CartResponseDto> {
    const cart = await this.loadOrCreateCart(user.id);
    return this.toFullCartDto(cart);
  }

  async patchItemQuantity(
    user: User,
    productPublicId: string,
    quantity: number,
  ): Promise<CartPatchSuccessDto> {
    const product = await this.resolveProductByPublicId(productPublicId);
    const cart = await this.loadOrCreateCart(user.id);

    if (quantity > product.stockQuantity) {
      throw new BadRequestException({
        code: 'INSUFFICIENT_STOCK',
        message: 'Stock insuffisant pour ce produit.',
      });
    }

    if (quantity <= 0) {
      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id, productId: product.id },
      });
    } else {
      await this.prisma.cartItem.upsert({
        where: {
          cartId_productId: { cartId: cart.id, productId: product.id },
        },
        create: { cartId: cart.id, productId: product.id, quantity },
        update: { quantity },
      });
    }

    const refreshed = await this.reloadCart(cart.id);
    const totals = this.computeTotals(refreshed.items);
    const line = refreshed.items.find((i) => i.productId === product.id);
    const actualQty = line?.quantity ?? 0;

    return {
      success: true,
      data: {
        productId: publicProductId(product),
        quantity: actualQty,
      },
      cart: totals,
    };
  }

  async addItem(
    user: User,
    productPublicId: string,
    quantity: number,
  ): Promise<CartAddItemSuccessDto> {
    const product = await this.resolveProductByPublicId(productPublicId);
    const cart = await this.loadOrCreateCart(user.id);
    const existing = await this.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId: product.id } },
    });
    const nextQty = (existing?.quantity ?? 0) + quantity;
    if (nextQty > product.stockQuantity) {
      throw new BadRequestException({
        code: 'INSUFFICIENT_STOCK',
        message: 'Stock insuffisant pour ce produit.',
      });
    }

    await this.prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId: product.id } },
      create: { cartId: cart.id, productId: product.id, quantity: nextQty },
      update: { quantity: nextQty },
    });

    const refreshed = await this.reloadCart(cart.id);
    return {
      success: true,
      cart: {
        items: refreshed.items.map((i) => ({
          productId: publicProductId(i.product),
          quantity: i.quantity,
        })),
        itemCount: refreshed.items.reduce((sum, i) => sum + i.quantity, 0),
      },
    };
  }

  async removeItem(
    user: User,
    productPublicId: string,
  ): Promise<CartDeleteSuccessDto> {
    const product = await this.resolveProductByPublicId(productPublicId);
    const cart = await this.loadOrCreateCart(user.id);

    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id, productId: product.id },
    });

    const refreshed = await this.reloadCart(cart.id);
    return {
      success: true,
      cart: this.toFullCartDto(refreshed),
    };
  }

  private async resolveProductByPublicId(
    productPublicId: string,
  ): Promise<Product> {
    const ref = parseProductPublicId(productPublicId);
    if (!ref) {
      throw new BadRequestException({
        code: 'INVALID_PRODUCT_ID',
        message: 'Identifiant produit invalide.',
      });
    }
    const product = await this.prisma.product.findUnique({
      where: { referenceCode: ref },
    });
    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Produit introuvable.',
      });
    }
    return product;
  }

  private async loadOrCreateCart(userId: string): Promise<CartLoaded> {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: cartInclude,
    });
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: cartInclude,
      });
    }
    return cart;
  }

  private async reloadCart(cartId: string): Promise<CartLoaded> {
    return this.prisma.cart.findUniqueOrThrow({
      where: { id: cartId },
      include: cartInclude,
    });
  }

  private computeTotals(
    items: CartLoaded['items'],
  ): {
    itemCount: number;
    subtotal: number;
    shipping: number;
    shippingFee: number;
    total: number;
  } {
    const itemCount = items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = items.reduce(
      (s, i) => s + i.quantity * i.product.price,
      0,
    );
    const shipping = itemCount > 0 ? SHIPPING_FLAT_EUR : 0;
    const total = subtotal + shipping;
    return { itemCount, subtotal, shipping, shippingFee: shipping, total };
  }

  private toFullCartDto(cart: CartLoaded): CartResponseDto {
    const totals = this.computeTotals(cart.items);
    return {
      items: cart.items.map((line) => ({
        productId: publicProductId(line.product),
        quantity: line.quantity,
        product: this.toProductEmbedded(line.product),
      })),
      ...totals,
      currency: 'EUR',
    };
  }

  private toProductEmbedded(
    product: Product & { category: { slug: string } },
  ) {
    return {
      id: publicProductId(product),
      name: product.name,
      description: product.description ?? '',
      category: product.category.slug,
      price: product.price,
      imageUrl:
        product.imageUrl ??
        `https://cdn.sendiaba.com/products/${publicProductId(product)}.png`,
    };
  }
}
