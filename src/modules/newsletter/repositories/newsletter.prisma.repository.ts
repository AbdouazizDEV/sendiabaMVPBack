import { Injectable } from '@nestjs/common';
import { NewsletterSubscription } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreateNewsletterSubscriptionData,
  INewsletterRepository,
} from './newsletter.repository.interface';

@Injectable()
export class NewsletterPrismaRepository implements INewsletterRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createSubscription(
    data: CreateNewsletterSubscriptionData,
  ): Promise<NewsletterSubscription> {
    return this.prisma.newsletterSubscription.create({
      data,
    });
  }
}
