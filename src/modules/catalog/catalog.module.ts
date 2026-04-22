import { Module } from '@nestjs/common';
import { CatalogArtisansController } from './catalog-artisans.controller';
import { CatalogBrowseController } from './catalog-browse.controller';
import { CatalogProductsController } from './catalog-products.controller';
import { CatalogService } from './catalog.service';

@Module({
  controllers: [
    CatalogArtisansController,
    CatalogProductsController,
    CatalogBrowseController,
  ],
  providers: [CatalogService],
})
export class CatalogModule {}
