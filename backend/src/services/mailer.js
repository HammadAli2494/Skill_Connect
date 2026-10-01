import { Resend } from 'resend';
import { env, isProd } from '../config/env.js';

function client() {
  if (!env.resendApiKey) return null;
  return new Resend(env.resendApiKey);
}

export async function sendEmail({ to, subject, html }) {
  const resend = client();
  if (!resend) {
    if (isProd) {
      console.error('Email is not configured. Set RESEND_API_KEY to send mail.');
      return { delivered: false, notice: 'Email is not configured on this server, so no message was sent.' };
    }
    console.info(`[email:dev] to=${to} subject="${subject}"`);
    console.info(html.replace(/<[^>]+>/g, ' '));
    return {
      delivered: false,
      notice: 'Email is not configured. In development the link is printed in the API console.',
    };
  }

  await resend.emails.send({
    from: env.emailFrom,
    to,
    subject,
    html,
  });
  return { delivered: true, notice: '' };
}

export function verificationEmail(name, link) {
  return {
    subject: 'Verify your SkillConnect email',
    html: `<p>Hello ${escapeHtml(name)},</p><p>Confirm your email to finish setting up SkillConnect.</p><p><a href="${link}">Verify email</a></p><p>This link expires in 24 hours.</p>`,
  };
}

export function resetEmail(name, link) {
  return {
    subject: 'Reset your SkillConnect password',
    html: `<p>Hello ${escapeHtml(name)},</p><p>We received a request to reset your password.</p><p><a href="${link}">Choose a new password</a></p><p>This link expires in 1 hour. If you did not ask for this, you can ignore the email.</p>`,
  };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
