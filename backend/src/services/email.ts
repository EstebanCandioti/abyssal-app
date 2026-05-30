import { Resend } from 'resend';
import type { Reminder } from '../types.js';
import { getThematicContent } from './content.js';
import { logger } from '../logger.js';

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getCategoryLabel(category: string) {
  if (category === 'detective') {
    return 'Archivo detective';
  }

  if (category === 'mystic') {
    return 'Oraculo de marea';
  }

  return 'Bitacora abisal';
}

function buildReminderHtml(reminder: Reminder, quoteText: string, quoteCategory: string) {
  const description = reminder.description
    ? `<p style="margin: 12px 0 0; color: #c8e0f8; font-size: 16px; line-height: 1.5;">${escapeHtml(reminder.description)}</p>`
    : '';
  const categoryLabel = getCategoryLabel(quoteCategory);

  return `
    <div style="margin: 0; padding: 0; background: #06101f; font-family: Arial, sans-serif; color: #c8e0f8;">
      <div style="max-width: 640px; margin: 0 auto; background: #0a1628;">
        <div style="padding: 26px 24px; background: #0a1628; border-bottom: 1px solid #1e3a5f;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td style="font-size: 24px; font-weight: 700; color: #c8e0f8; letter-spacing: 0;">Abyssal</td>
              <td align="right" style="color: #6a9fd0; font-size: 18px;">&#9675; &#8728; &#8728;</td>
            </tr>
          </table>
          <div style="margin-top: 10px; color: #6a9fd0; font-size: 13px;">Recordatorio detectado bajo la superficie</div>
        </div>
        <div style="padding: 30px 24px; background: #0d2a4a;">
          <div style="display: inline-block; padding: 6px 10px; margin-bottom: 14px; border: 1px solid #1e3a5f; color: #a8c8f0; font-size: 13px;">&#128269; ${escapeHtml(reminder.time)}</div>
          <h1 style="margin: 0; color: #c8e0f8; font-size: 30px; line-height: 1.2;">${escapeHtml(reminder.title)}</h1>
          ${description}
          <div style="margin: 26px 0 0; height: 1px; background: #1e3a5f;"></div>
          <div style="margin-top: 24px; padding: 20px; border: 1px solid #1e3a5f; background: #0a1628;">
            <p style="margin: 0 0 10px; color: #6a9fd0; font-size: 13px;">${categoryLabel}</p>
            <p style="margin: 0; color: #a8c8f0; font-family: Georgia, serif; font-size: 19px; line-height: 1.55;">${escapeHtml(quoteText)}</p>
            <p style="margin: 14px 0 0; color: #6a9fd0; font-size: 16px;">&#8728; &#8728; &#9675;</p>
          </div>
        </div>
        <div style="padding: 18px 24px; background: #0a1628; color: #6a9fd0; font-size: 13px; border-top: 1px solid #1e3a5f;">
          Abyssal mantiene este mensaje en la superficie.
        </div>
      </div>
    </div>
  `;
}

export async function sendReminderEmail(reminder: Reminder, to: string) {
  if (!process.env.RESEND_API_KEY || !to || !process.env.RESEND_FROM) {
    throw new Error('Faltan variables de entorno para enviar email con Resend.');
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const quote = await getThematicContent();
  logger.info('Solicitando envio a Resend.', {
    reminderId: reminder.id,
    from: process.env.RESEND_FROM,
    toConfigured: Boolean(to)
  });

  const result = await resend.emails.send({
    from: process.env.RESEND_FROM,
    to,
    subject: `\u{1F50D} ${reminder.title} - ${reminder.time}`,
    html: buildReminderHtml(reminder, quote.text, quote.category)
  });

  if (result.error) {
    logger.warn('Resend rechazo el envio.', {
      reminderId: reminder.id,
      message: result.error.message
    });
    throw new Error(result.error.message);
  }

  return result.data;
}
