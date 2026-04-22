import { Module } from '@nestjs/common';
import { BackofficeContentController } from './backoffice-content.controller';
import { BackofficeContentService } from './backoffice-content.service';
import { BACKOFFICE_CONTENT_REPOSITORY } from './repositories/backoffice-content.repository.interface';
import { BackofficeContentPrismaRepository } from './repositories/backoffice-content.prisma.repository';

@Module({
  controllers: [BackofficeContentController],
  providers: [
    BackofficeContentService,
    {
      provide: BACKOFFICE_CONTENT_REPOSITORY,
      useClass: BackofficeContentPrismaRepository,
    },
  ],
})
export class BackofficeContentModule {}
