import { Module } from '@nestjs/common';
import { BackofficeHomepageFeaturedArtisansController } from './backoffice-homepage-featured-artisans.controller';
import { BackofficeHomepageFeaturedArtisansService } from './backoffice-homepage-featured-artisans.service';

@Module({
  controllers: [BackofficeHomepageFeaturedArtisansController],
  providers: [BackofficeHomepageFeaturedArtisansService],
})
export class BackofficeHomepageFeaturedArtisansModule {}
