import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  AddCartItemDto,
  CartAddItemSuccessDto,
  CartDeleteSuccessDto,
  CartPatchQuantityDto,
  CartPatchSuccessDto,
  CartResponseDto,
} from './dto/cart.dto';
import { CartService } from './cart.service';

@ApiTags('Cart')
@ApiBearerAuth()
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({
    summary: 'Panier courant',
    description:
      'lignes avec produit embarqué, totaux (sous-total, livraison forfaitaire, total)',
  })
  @ApiOkResponse({ type: CartResponseDto })
  async getCart(@CurrentUser() user: User): Promise<CartResponseDto> {
    return this.cartService.getCart(user);
  }

  @Post('items')
  @ApiOperation({
    summary: 'Ajouter un produit au panier',
    description: 'ajoute la quantité demandée à la ligne produit',
  })
  @ApiBody({ type: AddCartItemDto })
  @ApiOkResponse({ type: CartAddItemSuccessDto })
  async addItem(
    @CurrentUser() user: User,
    @Body() dto: AddCartItemDto,
  ): Promise<CartAddItemSuccessDto> {
    return this.cartService.addItem(user, dto.productId, dto.quantity);
  }

  @Patch('items/:productId')
  @ApiParam({ name: 'productId', example: 'p1' })
  @ApiOperation({
    summary: 'Mettre à jour la quantité',
    description: 'quantité 0 supprime la ligne',
  })
  @ApiBody({ type: CartPatchQuantityDto })
  @ApiOkResponse({ type: CartPatchSuccessDto })
  async patchQuantity(
    @CurrentUser() user: User,
    @Param('productId') productId: string,
    @Body() dto: CartPatchQuantityDto,
  ): Promise<CartPatchSuccessDto> {
    return this.cartService.patchItemQuantity(user, productId, dto.quantity);
  }

  @Delete('items/:productId')
  @ApiParam({ name: 'productId', example: 'p1' })
  @ApiOperation({ summary: 'Supprimer une ligne du panier' })
  @ApiOkResponse({ type: CartDeleteSuccessDto })
  async removeItem(
    @CurrentUser() user: User,
    @Param('productId') productId: string,
  ): Promise<CartDeleteSuccessDto> {
    return this.cartService.removeItem(user, productId);
  }
}
