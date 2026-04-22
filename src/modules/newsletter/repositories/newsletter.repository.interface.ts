import { NewsletterSubscription } from '@prisma/client';

export interface CreateNewsletterSubscriptionData {
  email: string;
  source: string;
}

export interface INewsletterRepository {
  createSubscription(
    data: CreateNewsletterSubscriptionData,
  ): Promise<NewsletterSubscription>;
}

export const NEWSLETTER_REPOSITORY = Symbol('INewsletterRepository');
