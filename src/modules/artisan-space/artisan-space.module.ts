import { Module } from '@nestjs/common';
import { ArtisanCustomersController } from './artisan-customers.controller';
import { ArtisanDashboardController } from './artisan-dashboard.controller';
import { ArtisanNotificationsController } from './artisan-notifications.controller';
import { ArtisanOrdersController } from './artisan-orders.controller';
import { ArtisanProductsController } from './artisan-products.controller';
import { ArtisanProfileController } from './artisan-profile.controller';
import { ArtisanMailService } from './artisan-mail.service';
import { ArtisanCustomersService } from './artisan-customers.service';
import { ArtisanDashboardService } from './artisan-dashboard.service';
import { ArtisanNotificationsService } from './artisan-notifications.service';
import { ArtisanOrdersService } from './artisan-orders.service';
import { ArtisanProductsService } from './artisan-products.service';
import { ArtisanProfileService } from './artisan-profile.service';

@Module({
  controllers: [
    ArtisanProfileController,
    ArtisanProductsController,
    ArtisanCustomersController,
    ArtisanDashboardController,
    ArtisanOrdersController,
    ArtisanNotificationsController,
  ],
  providers: [
    ArtisanProfileService,
    ArtisanProductsService,
    ArtisanCustomersService,
    ArtisanDashboardService,
    ArtisanOrdersService,
    ArtisanNotificationsService,
    ArtisanMailService,
  ],
})
export class ArtisanSpaceModule {}
