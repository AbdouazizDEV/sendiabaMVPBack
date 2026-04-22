import { Module } from '@nestjs/common';
import { BackofficeDashboardController } from './backoffice-dashboard.controller';
import { BackofficeDashboardService } from './backoffice-dashboard.service';
import { BACKOFFICE_DASHBOARD_REPOSITORY } from './repositories/backoffice-dashboard.repository.interface';
import { BackofficeDashboardPrismaRepository } from './repositories/backoffice-dashboard.prisma.repository';

@Module({
  controllers: [BackofficeDashboardController],
  providers: [
    BackofficeDashboardService,
    {
      provide: BACKOFFICE_DASHBOARD_REPOSITORY,
      useClass: BackofficeDashboardPrismaRepository,
    },
  ],
})
export class BackofficeDashboardModule {}
