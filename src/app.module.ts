import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { CloudinaryModule } from './common/cloudinary/cloudinary.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { BackofficeContentModule } from './modules/backoffice/content/backoffice-content.module';
import { BackofficeDashboardModule } from './modules/backoffice/dashboard/backoffice-dashboard.module';
import { BackofficeArtisansModule } from './modules/backoffice/artisans/backoffice-artisans.module';
import { BackofficeUsersModule } from './modules/backoffice/users/backoffice-users.module';
import { CartModule } from './modules/cart/cart.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { ProfileModule } from './modules/profile/profile.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PublicContentModule } from './modules/public-content/public-content.module';
import { HomeModule } from './modules/home/home.module';
import { NewsletterModule } from './modules/newsletter/newsletter.module';
import { HealthController } from './health.controller';
import { ArtisanSpaceModule } from './modules/artisan-space/artisan-space.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CloudinaryModule,
    PrismaModule,
    AuthModule,
    HomeModule,
    NewsletterModule,
    ArtisanSpaceModule,
    ProfileModule,
    CartModule,
    CatalogModule,
    CollectionsModule,
    OrdersModule,
    PublicContentModule,
    BackofficeArtisansModule,
    BackofficeDashboardModule,
    BackofficeContentModule,
    BackofficeUsersModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
