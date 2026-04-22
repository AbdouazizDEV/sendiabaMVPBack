export interface OrderMonthStats {
  orderCount: number;
  revenue: number;
}

export interface IBackofficeDashboardRepository {
  countUsers(): Promise<number>;
  countCustomers(): Promise<number>;
  countArtisans(): Promise<number>;
  getCurrentMonthOrderStats(): Promise<OrderMonthStats>;
}

export const BACKOFFICE_DASHBOARD_REPOSITORY = Symbol(
  'IBackofficeDashboardRepository',
);
