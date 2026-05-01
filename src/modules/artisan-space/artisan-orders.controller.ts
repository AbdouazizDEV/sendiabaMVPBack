import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import type { User } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  ArtisanOrderProgressMailDto,
  ArtisanOrderQueryDto,
  ArtisanOrderStatusUpdateDto,
} from './dto/artisan-space.dto';
import { ArtisanOrdersService } from './artisan-orders.service';

@ApiTags('Artisan Space')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.ARTISAN)
@Controller('artisan/orders')
export class ArtisanOrdersController {
  constructor(private readonly service: ArtisanOrdersService) {}

  @Get()
  @ApiOperation({ summary: "Lister les commandes de l'artisan connecté" })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiOkResponse({ description: 'Liste paginée des commandes artisan.' })
  async list(@CurrentUser() user: User, @Query() query: ArtisanOrderQueryDto) {
    return this.service.list(user, query);
  }

  @Patch(':orderId/status')
  @ApiParam({ name: 'orderId', example: 'cmd_x8a91k2p' })
  @ApiOperation({ summary: 'Valider ou rejeter une commande' })
  @ApiBody({ type: ArtisanOrderStatusUpdateDto })
  async updateStatus(
    @CurrentUser() user: User,
    @Param('orderId') orderId: string,
    @Body() dto: ArtisanOrderStatusUpdateDto,
  ) {
    return this.service.updateStatus(user, orderId, dto);
  }

  @Post(':orderId/progress-mail')
  @ApiParam({ name: 'orderId', example: 'cmd_x8a91k2p' })
  @ApiOperation({ summary: "Envoyer un email d'avancement au client" })
  @ApiBody({ type: ArtisanOrderProgressMailDto })
  async sendProgressMail(
    @CurrentUser() user: User,
    @Param('orderId') orderId: string,
    @Body() dto: ArtisanOrderProgressMailDto,
  ) {
    return this.service.sendProgressMail(user, orderId, dto);
  }

  @Get(':orderId/tracking')
  @ApiParam({ name: 'orderId', example: 'cmd_x8a91k2p' })
  @ApiOperation({ summary: 'Suivre une commande (timeline)' })
  async track(@CurrentUser() user: User, @Param('orderId') orderId: string) {
    return this.service.track(user, orderId);
  }
}
