import nodemailer from 'nodemailer';

import { env } from '../config/env';
import { logger } from './logger';

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

let smtpTransporter: nodemailer.Transporter | null = null;

function getSmtpTransporter() {
  if (!env.SMTP_HOST) return null;

  if (!smtpTransporter) {
    smtpTransporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER && env.SMTP_PASS
        ? {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          }
        : undefined,
      tls: {
        rejectUnauthorized: env.SMTP_TLS_REJECT_UNAUTHORIZED,
      },
    });
  }

  return smtpTransporter;
}

async function sendWithResend(input: SendEmailInput) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Resend email failed with status ${response.status}: ${message}`);
  }
}

async function sendWithSmtp(input: SendEmailInput) {
  const transporter = getSmtpTransporter();
  if (!transporter) {
    throw new Error('SMTP transporter is not configured');
  }

  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
}

export async function sendEmail(input: SendEmailInput) {
  if (env.RESEND_API_KEY) {
    await sendWithResend(input);
    return true;
  }

  if (env.SMTP_HOST) {
    await sendWithSmtp(input);
    return true;
  }

  logger.warn('Email notification skipped because RESEND_API_KEY or SMTP_HOST is not configured', {
    to: input.to,
    subject: input.subject,
  });
  return false;
}
