import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Transporter } from 'nodemailer';
import {
  formatResendError,
  sendEmailViaResend,
} from '../../common/mail/resend-mail.util';
import {
  createConfiguredSmtpTransport,
  formatSmtpSendError,
  resolveSmtpMailFrom,
} from '../../common/mail/smtp-transport.util';

@Injectable()
export class ArtisanMailService {
  private readonly logger = new Logger(ArtisanMailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {}

  async sendOrderProgressMail(payload: {
    to: string;
    customerName: string;
    orderPublicId: string;
    status: string;
    message?: string;
  }): Promise<void> {
    const from = resolveSmtpMailFrom(this.configService);
    const html = this.buildTemplate(payload);
    const subject = `Mise à jour de votre commande ${payload.orderPublicId}`;

    if (this.configService.get<string>('RESEND_API_KEY')?.trim()) {
      try {
        await sendEmailViaResend(this.configService, {
          to: payload.to,
          subject,
          html,
          fallbackSmtpFrom: from,
        });
        return;
      } catch (error) {
        this.logger.error(
          `Failed to send artisan order progress email (Resend): ${formatResendError(error)}`,
        );
        throw new InternalServerErrorException({
          code: 'EMAIL_SEND_FAILED',
          message: "Impossible d'envoyer l'email de suivi de commande.",
        });
      }
    }

    const transporter = this.getTransporter();
    try {
      await transporter.sendMail({
        from,
        to: payload.to,
        subject,
        html,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send artisan order progress email: ${formatSmtpSendError(error)}`,
      );
      throw new InternalServerErrorException({
        code: 'EMAIL_SEND_FAILED',
        message: "Impossible d'envoyer l'email de suivi de commande.",
      });
    }
  }

  private getTransporter(): Transporter {
    if (this.transporter) return this.transporter;
    try {
      this.transporter = createConfiguredSmtpTransport(this.configService);
    } catch {
      throw new InternalServerErrorException({
        code: 'EMAIL_CONFIG_MISSING',
        message:
          'Configuration SMTP manquante. Définissez SMTP_HOST, SMTP_PORT, SMTP_USER et SMTP_PASS.',
      });
    }
    return this.transporter;
  }

  private buildTemplate(payload: {
    customerName: string;
    orderPublicId: string;
    status: string;
    message?: string;
  }) {
    return `<!doctype html><html lang="fr"><body style="font-family:Arial,sans-serif">
<h2>Bonjour ${payload.customerName},</h2>
<p>Votre commande <strong>${payload.orderPublicId}</strong> est maintenant à l'état <strong>${payload.status}</strong>.</p>
${payload.message ? `<p>${payload.message}</p>` : ''}
<p>Merci de votre confiance.</p>
</body></html>`;
  }
}
