import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { PaymentProvidersQueryDto } from './dto/dexpay.dto';

/**
 * Client HTTP DEXPAY — voir https://docs.dexpay.africa/api-reference/introduction
 * Checkout session : x-api-key uniquement.
 * Payment providers & transaction-attempt : x-api-key + x-api-secret.
 */
@Injectable()
export class DexpayService {
  constructor(private readonly config: ConfigService) {}

  private baseUrl(): string {
    return this.config.get<string>('DEXPAY_API_URL', 'https://api.dexpay.africa/api/v1');
  }

  private requirePublicKey(): string {
    const apiKey = this.config.get<string>('DEXPAY_API_KEY');
    if (!apiKey?.trim()) {
      throw new InternalServerErrorException({
        code: 'DEXPAY_CONFIG_MISSING',
        message:
          'Configuration DEXPAY manquante : définissez DEXPAY_API_KEY (clé publique pk_test_ ou pk_live_).',
      });
    }
    return apiKey.trim();
  }

  private requireKeyPair(): { apiKey: string; apiSecret: string } {
    const apiKey = this.requirePublicKey();
    const apiSecret = this.config.get<string>('DEXPAY_API_SECRET')?.trim();
    if (!apiSecret) {
      throw new InternalServerErrorException({
        code: 'DEXPAY_SECRET_MISSING',
        message:
          'Configuration DEXPAY incomplète : définissez DEXPAY_API_SECRET (clé secrète sk_test_ ou sk_live_) pour les providers et les tentatives de paiement.',
      });
    }
    return { apiKey, apiSecret };
  }

  async createCheckoutSession(payload: {
    reference: string;
    itemName: string;
    amount: number;
    webhookUrl: string;
    successUrl: string;
    failureUrl: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ paymentUrl: string; raw: unknown }> {
    const baseUrl = this.baseUrl();
    const apiKey = this.requirePublicKey();

    const amountXof = Math.max(0, Math.round(Number(payload.amount)));

    const response = await fetch(`${baseUrl}/checkout-sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        reference: payload.reference,
        item_name: payload.itemName,
        amount: amountXof,
        currency: 'XOF',
        countryISO: 'SN',
        webhook_url: payload.webhookUrl,
        success_url: payload.successUrl,
        failure_url: payload.failureUrl,
        metadata: payload.metadata ?? {},
      }),
    });

    const raw = (await response.json()) as Record<string, unknown>;
    const rawData =
      raw.data && typeof raw.data === 'object'
        ? (raw.data as Record<string, unknown>)
        : {};
    const paymentUrl = (raw.payment_url ?? rawData.payment_url ?? rawData.url) as
      | string
      | undefined;
    if (!response.ok || !paymentUrl) {
      const detail =
        typeof raw.message === 'string'
          ? raw.message
          : [raw.error, raw.code, JSON.stringify(raw).slice(0, 500)]
              .filter(Boolean)
              .join(' — ') || 'réponse DEXPAY invalide';
      throw new InternalServerErrorException({
        code: 'DEXPAY_CREATE_SESSION_FAILED',
        message: `DEXPAY checkout-sessions: ${detail}`,
      });
    }
    return { paymentUrl, raw };
  }

  /**
   * Liste les opérateurs (Wave, Orange Money, carte, …) pour affichage côté client.
   * @see https://docs.dexpay.africa/api-reference/providers/payment-providers
   */
  async listPaymentProviders(query: PaymentProvidersQueryDto): Promise<unknown> {
    const { apiKey, apiSecret } = this.requireKeyPair();
    const baseUrl = this.baseUrl();
    const params = new URLSearchParams();
    if (query.page !== undefined) params.set('page', String(query.page));
    if (query.limit !== undefined) params.set('limit', String(query.limit));
    if (query.country?.trim()) {
      params.set('filters[provider_country]', query.country.trim());
    }
    if (query.status) {
      params.set('filters[provider_status]', query.status);
    }
    if (query.type) {
      params.set('filters[provider_type]', query.type);
    }
    const qs = params.toString();
    const url = `${baseUrl}/payment-providers${qs ? `?${qs}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'x-api-secret': apiSecret,
      },
    });

    const raw = (await response.json()) as Record<string, unknown>;
    if (!response.ok) {
      throw new InternalServerErrorException({
        code: 'DEXPAY_PAYMENT_PROVIDERS_FAILED',
        message: 'Impossible de récupérer les moyens de paiement DEXPAY.',
      });
    }
    return raw;
  }

  /**
   * Initie une tentative de paiement sur une checkout session existante.
   * @see https://docs.dexpay.africa/api-reference/checkout/create-payment-attempt
   */
  async createTransactionAttempt(
    sessionReference: string,
    body: {
      payment_method: 'mobile_money' | 'card';
      operator: string;
      customer: { name: string; phone: string; email: string };
      countryISO: string;
    },
  ): Promise<unknown> {
    const { apiKey, apiSecret } = this.requireKeyPair();
    const baseUrl = this.baseUrl();
    const encodedRef = encodeURIComponent(sessionReference);

    const response = await fetch(
      `${baseUrl}/checkout-sessions/${encodedRef}/transaction-attempt`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'x-api-secret': apiSecret,
        },
        body: JSON.stringify({
          payment_method: body.payment_method,
          operator: body.operator,
          customer: body.customer,
          countryISO: body.countryISO,
        }),
      },
    );

    const raw = (await response.json()) as Record<string, unknown>;
    if (!response.ok) {
      const msg =
        typeof raw.message === 'string'
          ? raw.message
          : 'Échec de la tentative de paiement DEXPAY.';
      if (response.status >= 400 && response.status < 500) {
        throw new BadRequestException({
          code: 'DEXPAY_PAYMENT_ATTEMPT_REJECTED',
          message: msg,
        });
      }
      throw new InternalServerErrorException({
        code: 'DEXPAY_PAYMENT_ATTEMPT_FAILED',
        message: msg,
      });
    }
    return raw;
  }
}
