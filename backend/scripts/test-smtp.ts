import * as dotenv from 'dotenv';
import * as path from 'path';
import { EmailService } from '../src/email/email.service';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const unwrapQuotedValue = (value: string): string => {
  const trimmed = String(value || '').trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
};

const recipient = (process.env.SMTP_TEST_TO || process.env.CONTACT_EMAIL || '').trim();
const smtpHost = unwrapQuotedValue(process.env.SMTP_HOST || 'smtp.gmail.com').toLowerCase();
const smtpPassClean = unwrapQuotedValue(process.env.SMTP_PASS || '').replace(/\s+/g, '');

async function main() {
  if (!recipient) {
    console.error('Missing recipient. Set SMTP_TEST_TO or CONTACT_EMAIL in backend/.env');
    process.exit(1);
  }

  if (smtpHost.includes('gmail.com') && smtpPassClean.length !== 16) {
    console.error(
      `SMTP_PASS looks invalid for Gmail app passwords. Expected 16 chars after removing spaces, got ${smtpPassClean.length}.`,
    );
    process.exit(1);
  }

  const emailService = new EmailService();
  const verification = await emailService.verifyConnection();

  if (!verification.success) {
    console.error(`SMTP verification failed: ${verification.message}`);
    process.exit(1);
  }

  const subject = `ZinoShop SMTP Test - ${new Date().toISOString()}`;
  const html = `
    <h2>ZinoShop SMTP test</h2>
    <p>This is a direct SMTP validation email from backend/scripts/test-smtp.ts.</p>
  `;
  const text = 'ZinoShop SMTP test - backend/scripts/test-smtp.ts';

  const sendResult = await emailService.sendEmail(recipient, subject, html, text);
  if (!sendResult.success) {
    console.error(`SMTP send failed: ${sendResult.message || 'Unknown error'}`);
    process.exit(1);
  }

  console.log(`SMTP test email sent successfully to ${recipient}. messageId=${sendResult.messageId || 'n/a'}`);
}

main().catch((error) => {
  console.error('SMTP test script failed:', error);
  process.exit(1);
});
