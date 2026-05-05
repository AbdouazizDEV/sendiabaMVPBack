import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

function isGmailSmtpHost(host: string): boolean {
  return /gmail\.com|googlemail\.com/i.test(host);
}

/**
 * Mot de passe d'application Google : 16 caractères sans espaces.
 * Google les affiche groupés ; beaucoup les collent avec des espaces → EAUTH en prod.
 */
function normalizeSmtpPassword(host: string | undefined, pass: string): string {
  if (!host || !isGmailSmtpHost(host)) {
    return pass;
  }
  return pass.replace(/\s/g, '');
}

export function parseMailFromHeader(from: string): {
  displayName?: string;
  address: string;
} {
  const s = from.trim();
  const lt = s.lastIndexOf('<');
  const gt = s.lastIndexOf('>');
  if (lt !== -1 && gt > lt) {
    const address = s.slice(lt + 1, gt).trim();
    const rawName = s.slice(0, lt).trim().replace(/^["']|["']$/g, '');
    const displayName = rawName.length > 0 ? rawName : undefined;
    return { displayName, address };
  }
  return { address: s };
}

/**
 * Avec Gmail, l'adresse d'expéditeur doit correspondre au compte authentifié
 * (ou un alias « Envoyer en tant que »). Sinon Gmail renvoie souvent une erreur
 * alors que ça « marche » en local si MAIL_FROM n'est pas défini pareil.
 */
function trimMailEnv(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const t = value.trim().replace(/^\ufeff/, '');
  return t.length > 0 ? t : undefined;
}

export function resolveSmtpMailFrom(config: ConfigService): string {
  const host = config.get<string>('SMTP_HOST')?.trim() ?? '';
  const smtpUser = config.get<string>('SMTP_USER')?.trim() ?? '';
  const raw =
    trimMailEnv(config.get<string>('MAIL_FROM')) ??
    trimMailEnv(config.get<string>('SMTP_FROM')) ??
    'no-reply@sendiaba.com';

  if (!smtpUser || !isGmailSmtpHost(host)) {
    return raw;
  }

  const { displayName, address } = parseMailFromHeader(raw);
  if (address.toLowerCase() === smtpUser.toLowerCase()) {
    return raw;
  }

  const name = displayName ?? 'Sendiaba';
  return `"${name}" <${smtpUser}>`;
}

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
  const passRaw = config.get<string>('SMTP_PASS')?.trim() ?? '';
  const pass = normalizeSmtpPassword(host, passRaw);
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
