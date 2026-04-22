import { Module } from '@nestjs/common';
import { NewsletterController } from './newsletter.controller';
import { NewsletterService } from './newsletter.service';
import { NewsletterPrismaRepository } from './repositories/newsletter.prisma.repository';
import { NEWSLETTER_REPOSITORY } from './repositories/newsletter.repository.interface';

@Module({
  controllers: [NewsletterController],
  providers: [
    NewsletterService,
    {
      provide: NEWSLETTER_REPOSITORY,
      useClass: NewsletterPrismaRepository,
    },
  ],
})
export class NewsletterModule {}
