import { Module } from '@nestjs/common';
import { BackofficeCategoriesController } from './backoffice-categories.controller';
import { BackofficeCategoriesService } from './backoffice-categories.service';

@Module({
  controllers: [BackofficeCategoriesController],
  providers: [BackofficeCategoriesService],
})
export class BackofficeCategoriesModule {}

