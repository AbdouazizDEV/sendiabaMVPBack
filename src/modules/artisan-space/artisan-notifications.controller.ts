import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import type { User } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ArtisanNotificationQueryDto } from './dto/artisan-space.dto';
import { ArtisanNotificationsService } from './artisan-notifications.service';

@ApiTags('Artisan Space')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.ARTISAN)
@Controller('artisan/notifications')
export class ArtisanNotificationsController {
  constructor(private readonly service: ArtisanNotificationsService) {}

  @Get()
  @ApiOperation({ summary: "Lister les notifications de commandes de l'artisan" })
  @ApiQuery({ name: 'unreadOnly', required: false })
  async list(@CurrentUser() user: User, @Query() query: ArtisanNotificationQueryDto) {
    return this.service.list(user, query);
  }

  @Patch(':id/read')
  @ApiParam({ name: 'id', example: 'cma123...' })
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  async markAsRead(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.markAsRead(user, id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Marquer toutes les notifications comme lues' })
  async markAllAsRead(@CurrentUser() user: User) {
    return this.service.markAllAsRead(user);
  }
}
