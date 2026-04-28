import { Module } from '@nestjs/common';
import { ArtisanCustomersController } from './artisan-customers.controller';
import { ArtisanDashboardController } from './artisan-dashboard.controller';
import { ArtisanProductsController } from './artisan-products.controller';
import { ArtisanProfileController } from './artisan-profile.controller';
import { ArtisanCustomersService } from './artisan-customers.service';
import { ArtisanDashboardService } from './artisan-dashboard.service';
import { ArtisanProductsService } from './artisan-products.service';
import { ArtisanProfileService } from './artisan-profile.service';

@Module({
  controllers: [
    ArtisanProfileController,
    ArtisanProductsController,
    ArtisanCustomersController,
    ArtisanDashboardController,
  ],
  providers: [
    ArtisanProfileService,
    ArtisanProductsService,
    ArtisanCustomersService,
    ArtisanDashboardService,
  ],
})
export class ArtisanSpaceModule {}
