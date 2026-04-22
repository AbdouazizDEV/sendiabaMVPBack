import { Body, Controller, Get, Param, Post } from '@nestjs/common';
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
  CreateOrderBodyDto,
  CreatedOrderDataDto,
  CreateOrderSuccessDto,
} from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({
    summary: 'Créer une commande depuis le checkout',
    description:
      'valide les données de livraison, crée la commande à partir du panier courant puis vide le panier',
  })
  @ApiBody({ type: CreateOrderBodyDto })
  @ApiOkResponse({ type: CreateOrderSuccessDto })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateOrderBodyDto,
  ): Promise<CreateOrderSuccessDto> {
    return this.ordersService.createOrder(user, dto);
  }

  @Get(':orderId')
  @ApiParam({ name: 'orderId', example: 'cmd_x8a91k2p' })
  @ApiOperation({
    summary: 'Récupérer une commande',
    description:
      "retourne les détails de tracking de la commande si elle appartient à l'utilisateur connecté",
  })
  @ApiOkResponse({ type: CreatedOrderDataDto })
  async findOne(
    @CurrentUser() user: User,
    @Param('orderId') orderId: string,
  ): Promise<CreatedOrderDataDto> {
    return this.ordersService.findOrderById(user, orderId);
  }
}
