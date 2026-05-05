import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

/**
 * Options SMTP alignées sur Gmail / hébergeurs cloud (TLS explicite, timeouts).
 * Les secrets sont trim() pour éviter échecs silencieux si Render ajoute un saut de ligne.
 */
export function buildSmtpTransportOptions(
  config: ConfigService,
): SMTPTransport.Options {
  const host = config.get<string>('SMTP_HOST')?.trim();
  const port = Number(config.get<string>('SMTP_PORT', '587'));
  const user = config.get<string>('SMTP_USER')?.trim();
  const pass = config.get<string>('SMTP_PASS')?.trim();
  const secureFlag = config.get<string>('SMTP_SECURE');
  const secure =
    secureFlag === 'true' ||
    secureFlag === '1' ||
    port === 465;

  if (!host || !user || !pass || Number.isNaN(port)) {
    throw new Error('SMTP_CONFIG_INCOMPLETE');
  }

  return {
    host,
    port,
    secure,
    auth: { user, pass },
    requireTLS: port === 587 && !secure,
    tls: {
      minVersion: 'TLSv1.2',
    },
    connectionTimeout: 20_000,
    greetingTimeout: 20_000,
    socketTimeout: 30_000,
  };
}

export function createConfiguredSmtpTransport(
  config: ConfigService,
): Transporter {
  return createTransport(buildSmtpTransportOptions(config));
}

/** Détails utiles pour les logs (sans exposer le mot de passe). */
export function formatSmtpSendError(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return String(error);
  }
  const e = error as {
    message?: string;
    code?: string;
    command?: string;
    response?: string;
    responseCode?: number;
  };
  const parts = [
    e.message,
    e.code && `code=${e.code}`,
    e.command && `command=${e.command}`,
    typeof e.responseCode === 'number' && `smtp=${e.responseCode}`,
    e.response && `resp=${String(e.response).slice(0, 200)}`,
  ].filter(Boolean);
  return parts.join(' | ');
}
