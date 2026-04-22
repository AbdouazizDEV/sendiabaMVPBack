import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class RevenueTrendQueryDto {
  @ApiProperty({ example: '9m', description: 'Periode (3m, 6m, 9m, 12m)' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === undefined || value === '' ? '9m' : String(value),
  )
  @IsString()
  @IsIn(['3m', '6m', '9m', '12m'])
  period!: string;
}

export class DashboardKpisDto {
  @ApiProperty({ example: 12480 }) totalVisitors!: number;
  @ApiProperty({ example: 3290 }) totalClients!: number;
  @ApiProperty({ example: 4125 }) totalUsers!: number;
  @ApiProperty({ example: 186 }) totalArtisans!: number;
  @ApiProperty({ example: 748 }) ordersThisMonth!: number;
  @ApiProperty({ example: 92450 }) monthlyRevenue!: number;
  @ApiProperty({ example: 'EUR' }) currency!: string;
}

export class RevenueTrendPointDto {
  @ApiProperty({ example: 'Jan' }) month!: string;
  @ApiProperty({ example: 42000 }) value!: number;
}

export class RevenueTrendResponseDto {
  @ApiProperty({ example: '9m' }) period!: string;
  @ApiProperty({ example: 22.4 }) growthVsPreviousPeriod!: number;
  @ApiProperty({ type: [RevenueTrendPointDto] }) points!: RevenueTrendPointDto[];
}

export class CategorySegmentDto {
  @ApiProperty({ example: 'Mode' }) label!: string;
  @ApiProperty({ example: 38 }) value!: number;
  @ApiProperty({ example: '#C56E47' }) color!: string;
}

export class CategorySegmentsResponseDto {
  @ApiProperty({ example: 100 }) totalPercent!: number;
  @ApiProperty({ type: [CategorySegmentDto] }) segments!: CategorySegmentDto[];
}

export class DashboardModuleItemDto {
  @ApiProperty({ example: 'dashboard' }) key!: string;
  @ApiProperty({ example: 'Dashboard' }) label!: string;
  @ApiProperty({ example: '/backoffice' }) href!: string;
}

export class DashboardOverviewDto {
  @ApiProperty({ example: 'Tableau de bord administrateur' }) title!: string;
  @ApiProperty({
    example: 'Suivez les performances globales de la plateforme.',
  })
  subtitle!: string;
  @ApiProperty({ type: [DashboardModuleItemDto] }) modules!: DashboardModuleItemDto[];
}
