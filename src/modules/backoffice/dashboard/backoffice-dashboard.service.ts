import { Inject, Injectable } from '@nestjs/common';
import {
  BACKOFFICE_DASHBOARD_REPOSITORY,
  type IBackofficeDashboardRepository,
} from './repositories/backoffice-dashboard.repository.interface';
import {
  CategorySegmentsResponseDto,
  DashboardKpisDto,
  DashboardOverviewDto,
  RevenueTrendResponseDto,
} from './dto/backoffice-dashboard.dto';

@Injectable()
export class BackofficeDashboardService {
  constructor(
    @Inject(BACKOFFICE_DASHBOARD_REPOSITORY)
    private readonly dashboardRepository: IBackofficeDashboardRepository,
  ) {}

  async getKpis(): Promise<DashboardKpisDto> {
    const [totalUsers, totalClients, totalArtisans, monthStats] =
      await Promise.all([
        this.dashboardRepository.countUsers(),
        this.dashboardRepository.countCustomers(),
        this.dashboardRepository.countArtisans(),
        this.dashboardRepository.getCurrentMonthOrderStats(),
      ]);

    const totalVisitors = Math.max(
      12480,
      Math.floor(totalUsers * 3 + totalArtisans * 20),
    );

    return {
      totalVisitors,
      totalClients,
      totalUsers,
      totalArtisans,
      ordersThisMonth: monthStats.orderCount,
      monthlyRevenue: Math.round(monthStats.revenue),
      currency: 'EUR',
    };
  }

  getRevenueTrend(period: string): RevenueTrendResponseDto {
    const months = this.parsePeriodMonths(period);
    const fullSeries: RevenueTrendResponseDto['points'] = [
      { month: 'Jan', value: 42000 },
      { month: 'Fev', value: 51000 },
      { month: 'Mar', value: 49000 },
      { month: 'Avr', value: 57000 },
      { month: 'Mai', value: 63000 },
      { month: 'Juin', value: 70400 },
      { month: 'Juil', value: 76500 },
      { month: 'Aou', value: 82100 },
      { month: 'Sep', value: 92450 },
    ];
    const points =
      months >= fullSeries.length
        ? fullSeries
        : fullSeries.slice(fullSeries.length - months);

    return {
      period,
      growthVsPreviousPeriod: 22.4,
      points,
    };
  }

  getCategorySegments(): CategorySegmentsResponseDto {
    return {
      totalPercent: 100,
      segments: [
        { label: 'Mode', value: 38, color: '#C56E47' },
        { label: 'Maison', value: 26, color: '#8A7C6A' },
        { label: 'Art', value: 19, color: '#4B6A57' },
        { label: 'Accessoires', value: 17, color: '#2A2A2A' },
      ],
    };
  }

  getOverview(): DashboardOverviewDto {
    return {
      title: 'Tableau de bord administrateur',
      subtitle: 'Suivez les performances globales de la plateforme.',
      modules: [
        { key: 'dashboard', label: 'Dashboard', href: '/backoffice' },
        {
          key: 'users',
          label: 'Utilisateurs',
          href: '/backoffice/utilisateurs',
        },
        { key: 'artisans', label: 'Artisans', href: '/backoffice/artisans' },
        { key: 'content', label: 'Contenu', href: '/backoffice/contenu' },
      ],
    };
  }

  private parsePeriodMonths(period: string): number {
    const match = /^(\d+)m$/.exec(period.trim());
    if (!match) {
      return 9;
    }
    return Math.min(12, Math.max(1, Number(match[1])));
  }
}
