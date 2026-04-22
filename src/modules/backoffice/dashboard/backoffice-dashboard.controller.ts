import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import {
  CategorySegmentsResponseDto,
  DashboardKpisDto,
  DashboardOverviewDto,
  RevenueTrendQueryDto,
  RevenueTrendResponseDto,
} from './dto/backoffice-dashboard.dto';
import { BackofficeDashboardService } from './backoffice-dashboard.service';

@ApiTags('Backoffice Dashboard')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('backoffice/dashboard')
export class BackofficeDashboardController {
  constructor(
    private readonly backofficeDashboardService: BackofficeDashboardService,
  ) {}

  @Get('kpis')
  @ApiOperation({
    summary: 'KPIs du dashboard',
    description:
      'alimente les cartes principales (visiteurs, clients, utilisateurs, artisans, commandes, revenus)',
  })
  @ApiOkResponse({ type: DashboardKpisDto })
  async kpis(): Promise<DashboardKpisDto> {
    return this.backofficeDashboardService.getKpis();
  }

  @Get('revenue-trend')
  @ApiOperation({
    summary: 'Tendance des revenus',
    description:
      'fournit les points mensuels pour tracer la courbe de croissance',
  })
  @ApiQuery({ name: 'period', required: false, example: '9m' })
  @ApiOkResponse({ type: RevenueTrendResponseDto })
  revenueTrend(
    @Query() query: RevenueTrendQueryDto,
  ): RevenueTrendResponseDto {
    return this.backofficeDashboardService.getRevenueTrend(query.period);
  }

  @Get('category-segments')
  @ApiOperation({
    summary: 'Repartition par categories',
    description:
      'fournit la distribution en pourcentage pour les categories d activite',
  })
  @ApiOkResponse({ type: CategorySegmentsResponseDto })
  categorySegments(): CategorySegmentsResponseDto {
    return this.backofficeDashboardService.getCategorySegments();
  }

  @Get('overview')
  @ApiOperation({
    summary: 'Infos d accueil du dashboard',
    description:
      'texte d intro du backoffice et modules disponibles (contenu pilote admin)',
  })
  @ApiOkResponse({ type: DashboardOverviewDto })
  overview(): DashboardOverviewDto {
    return this.backofficeDashboardService.getOverview();
  }
}
