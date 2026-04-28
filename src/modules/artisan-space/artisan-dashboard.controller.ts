import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import type { User } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ArtisanDashboardKpisResponseDto } from './dto/artisan-space.dto';
import { ArtisanDashboardService } from './artisan-dashboard.service';

@ApiTags('Artisan Space')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.ARTISAN)
@Controller('artisan/dashboard')
export class ArtisanDashboardController {
  constructor(private readonly service: ArtisanDashboardService) {}

  @Get('kpis')
  @ApiOperation({ summary: "KPIs dashboard de l'artisan connecté" })
  @ApiOkResponse({ type: ArtisanDashboardKpisResponseDto })
  async kpis(@CurrentUser() user: User) {
    return this.service.kpis(user);
  }
}
