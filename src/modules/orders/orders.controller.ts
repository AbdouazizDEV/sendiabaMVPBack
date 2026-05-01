import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  ClientNotificationsResponseDto,
  CreateCheckoutSessionSuccessDto,
  CreateOrderBodyDto,
  CreatedOrderDataDto,
  OrderTrackingResponseDto,
} from './dto/create-order.dto';
import {
  CreatePaymentAttemptBodyDto,
  CreatePaymentAttemptSuccessDto,
  PaymentProvidersQueryDto,
  PaymentProvidersSuccessDto,
} from './dto/dexpay.dto';
import { Public } from '../../common/decorators/public.decorator';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout-session')
  @ApiOperation({
    summary: 'Créer une session de paiement DEXPAY',
    description:
      'prépare le paiement ; la commande est créée après webhook de paiement réussi',
  })
  @ApiBody({ type: CreateOrderBodyDto })
  @ApiOkResponse({ type: CreateCheckoutSessionSuccessDto })
  async createCheckoutSession(
    @CurrentUser() user: User,
    @Body() dto: CreateOrderBodyDto,
  ): Promise<CreateCheckoutSessionSuccessDto> {
    return this.ordersService.createCheckoutSession(user, dto);
  }

  @Public()
  @Post('webhooks/dexpay')
  @ApiOperation({ summary: 'Webhook DEXPAY de confirmation de paiement' })
  async dexpayWebhook(@Body() payload: Record<string, unknown>) {
    return this.ordersService.confirmDexpayWebhook(payload);
  }

  @Public()
  @Get('payments/providers')
  @ApiOperation({
    summary: 'Moyens de paiement DEXPAY (Wave, OM, MTN, carte, …)',
    description:
      'Proxy vers GET /payment-providers DEXPAY — à afficher pour que le client choisisse `operator` (provider_short_name) puis appelle POST …/transaction-attempt. Nécessite DEXPAY_API_KEY et DEXPAY_API_SECRET.',
  })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'country', required: false, example: 'SN' })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive'] })
  @ApiQuery({ name: 'type', required: false, enum: ['mobile_money', 'card'] })
  @ApiOkResponse({ type: PaymentProvidersSuccessDto })
  async listPaymentProviders(
    @Query() query: PaymentProvidersQueryDto,
  ): Promise<PaymentProvidersSuccessDto> {
    return this.ordersService.listDexpayPaymentProviders(query);
  }

  @Post('payments/checkout-sessions/:reference/transaction-attempt')
  @ApiOperation({
    summary: 'Lancer une tentative de paiement (mobile money ou carte)',
    description:
      'Proxy vers POST /checkout-sessions/{reference}/transaction-attempt — `reference` = valeur retournée par POST /orders/checkout-session. Réponse typique : cashout_url (Wave), status, expires_at.',
  })
  @ApiParam({ name: 'reference', example: 'PAY_1710000000000_abc123' })
  @ApiBody({ type: CreatePaymentAttemptBodyDto })
  @ApiOkResponse({ type: CreatePaymentAttemptSuccessDto })
  async createPaymentAttempt(
    @CurrentUser() user: User,
    @Param('reference') reference: string,
    @Body() dto: CreatePaymentAttemptBodyDto,
  ): Promise<CreatePaymentAttemptSuccessDto> {
    return this.ordersService.createDexpayPaymentAttempt(user, reference, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lister les commandes du client connecté',
  })
  async list(@CurrentUser() user: User) {
    return this.ordersService.listOrders(user);
  }

  @Get('me/notifications')
  @ApiOkResponse({ type: ClientNotificationsResponseDto })
  async notifications(
    @CurrentUser() user: User,
  ): Promise<ClientNotificationsResponseDto> {
    return this.ordersService.listClientNotifications(user);
  }

  @Get(':orderId/tracking')
  @ApiParam({ name: 'orderId', example: 'cmd_x8a91k2p' })
  @ApiOkResponse({ type: OrderTrackingResponseDto })
  async tracking(
    @CurrentUser() user: User,
    @Param('orderId') orderId: string,
  ): Promise<OrderTrackingResponseDto> {
    return this.ordersService.trackOrder(user, orderId);
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
