import { ConfigService } from '@nestjs/config';

/**
 * Envoi via API Resend (https://resend.com) — contourne les blocages Gmail SMTP
 * depuis les IP des hébergeurs (Render, etc.).
 *
 * Sur Render : définir RESEND_API_KEY + RESEND_FROM (domaine vérifié chez Resend).
 */
export async function sendEmailViaResend(
  config: ConfigService,
  params: {
    to: string;
    subject: string;
    html: string;
    /** Utilisé si RESEND_FROM est vide (ex. expéditeur déjà aligné SMTP). */
    fallbackSmtpFrom: string;
  },
): Promise<void> {
  const apiKey = config.get<string>('RESEND_API_KEY')?.trim();
  if (!apiKey) {
    throw new Error('RESEND_API_KEY manquant');
  }

  const from =
    config.get<string>('RESEND_FROM')?.trim() || params.fallbackSmtpFrom;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
    }),
  });

  const raw = (await response.json()) as {
    message?: string;
    name?: string;
    statusCode?: number;
  };

  if (!response.ok) {
    const detail =
      typeof raw.message === 'string'
        ? raw.message
        : JSON.stringify(raw).slice(0, 400);
    throw new Error(`Resend HTTP ${response.status}: ${detail}`);
  }
}

export function formatResendError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
