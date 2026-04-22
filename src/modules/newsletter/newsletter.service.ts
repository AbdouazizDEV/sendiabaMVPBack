import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateNewsletterSubscriptionDto, CreateNewsletterSubscriptionResponseDto } from './dto/newsletter.dto';
import {
  NEWSLETTER_REPOSITORY,
  type INewsletterRepository,
} from './repositories/newsletter.repository.interface';

@Injectable()
export class NewsletterService {
  constructor(
    @Inject(NEWSLETTER_REPOSITORY)
    private readonly newsletterRepository: INewsletterRepository,
  ) {}

  async createSubscription(
    dto: CreateNewsletterSubscriptionDto,
  ): Promise<CreateNewsletterSubscriptionResponseDto> {
    try {
      const subscription = await this.newsletterRepository.createSubscription({
        email: dto.email,
        source: dto.source ?? 'home_newsletter',
      });

      return {
        success: true,
        message: 'Inscription enregistree avec succes.',
        data: {
          subscriptionId: `nl_${subscription.id.slice(0, 6).toUpperCase()}`,
          status: subscription.status,
          createdAt: subscription.createdAt.toISOString(),
        },
      };
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException({
          code: 'EMAIL_ALREADY_SUBSCRIBED',
          message: 'Cet email est deja inscrit a la newsletter.',
        });
      }
      throw error;
    }
  }
}
