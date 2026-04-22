import { Module } from '@nestjs/common';
import { BackofficeArtisansController } from './backoffice-artisans.controller';
import { BackofficeArtisansService } from './backoffice-artisans.service';
import {
  BACKOFFICE_ARTISANS_REPOSITORY,
} from './repositories/backoffice-artisans.repository.interface';
import { BackofficeArtisansPrismaRepository } from './repositories/backoffice-artisans.prisma.repository';

@Module({
  controllers: [BackofficeArtisansController],
  providers: [
    BackofficeArtisansService,
    {
      provide: BACKOFFICE_ARTISANS_REPOSITORY,
      useClass: BackofficeArtisansPrismaRepository,
    },
  ],
})
export class BackofficeArtisansModule {}
