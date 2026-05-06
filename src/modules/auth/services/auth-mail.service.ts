import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Transporter } from 'nodemailer';
import {
  formatResendError,
  sendEmailViaResend,
} from '../../../common/mail/resend-mail.util';
import {
  createConfiguredSmtpTransport,
  formatSmtpSendError,
  resolveSmtpMailFrom,
} from '../../../common/mail/smtp-transport.util';

@Injectable()
export class AuthMailService {
  private readonly logger = new Logger(AuthMailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {}

  async sendWelcomeValidationMail(payload: {
    to: string;
    displayName: string;
    verificationLink: string;
  }): Promise<void> {
    const from = resolveSmtpMailFrom(this.configService);
    const html = this.buildTemplate(
      payload.displayName,
      payload.verificationLink,
    );
    const subject = 'Bienvenue chez Sendiaba — Validez votre inscription';

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
          `Failed to send welcome validation email (Resend): ${formatResendError(error)}`,
        );
        throw new InternalServerErrorException({
          code: 'EMAIL_SEND_FAILED',
          message: "Impossible d'envoyer l'email de validation.",
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
        `Failed to send welcome validation email: ${formatSmtpSendError(error)}`,
      );
      throw new InternalServerErrorException({
        code: 'EMAIL_SEND_FAILED',
        message: "Impossible d'envoyer l'email de validation.",
      });
    }
  }

  private getTransporter(): Transporter {
    if (this.transporter) {
      return this.transporter;
    }

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

  private buildTemplate(displayName: string, verificationLink: string): string {
    return `<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:0;background:#fff;font-family:Arial,Helvetica,sans-serif;color:#1c1c1c;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fff;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="width:640px;max-width:96%;border:1px solid #f0e2dc;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="background:#b56145;padding:26px 30px;text-align:center;">
                <img src="https://res.cloudinary.com/dhivn2ahm/image/upload/v1776912527/logoBanc_x3ozae.png" alt="Sendiaba" style="height:52px;max-width:100%;display:block;margin:0 auto 14px auto;" />
                <p style="margin:0;color:#fff;font-size:14px;letter-spacing:.5px;text-transform:uppercase;">Bienvenue chez Sendiaba</p>
              </td>
            </tr>
            <tr>
              <td style="padding:34px 30px;">
                <h1 style="margin:0 0 14px 0;color:#b56145;font-size:28px;line-height:1.2;">Bonjour ${displayName},</h1>
                <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;">
                  Merci pour votre inscription. Nous sommes ravis de vous accueillir dans l'univers Sendiaba.
                </p>
                <p style="margin:0 0 26px 0;font-size:16px;line-height:1.6;">
                  Cliquez sur le bouton ci-dessous pour valider votre adresse email et finaliser votre accès.
                </p>
                <p style="margin:0 0 28px 0;text-align:center;">
                  <a href="${verificationLink}" style="display:inline-block;background:#b56145;color:#fff;text-decoration:none;font-weight:bold;font-size:16px;padding:14px 24px;border-radius:10px;">
                    Valider mon inscription
                  </a>
                </p>
                <p style="margin:0;font-size:13px;color:#6b6b6b;line-height:1.6;">
                  Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :
                  <br />
                  <a href="${verificationLink}" style="color:#b56145;word-break:break-all;">${verificationLink}</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  }
}
