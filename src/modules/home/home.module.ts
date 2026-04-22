import { Module } from '@nestjs/common';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { HOME_REPOSITORY } from './repositories/home.repository.interface';
import { HomePrismaRepository } from './repositories/home.prisma.repository';

@Module({
  controllers: [HomeController],
  providers: [
    HomeService,
    {
      provide: HOME_REPOSITORY,
      useClass: HomePrismaRepository,
    },
  ],
})
export class HomeModule {}
