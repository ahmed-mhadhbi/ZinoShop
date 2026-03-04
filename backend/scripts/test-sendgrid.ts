import * as dotenv from 'dotenv';
import * as path from 'path';
import { EmailService } from '../src/email/email.service';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const recipient = (process.env.SENDGRID_TEST_TO || process.env.CONTACT_EMAIL || '').trim();

async function main() {
  if (!recipient) {
    throw new Error(
      'Missing recipient. Set SENDGRID_TEST_TO or CONTACT_EMAIL in backend/.env',
    );
  }

  const emailService = new EmailService();
  const verification = await emailService.verifyConnection();

  if (!verification.success) {
    throw new Error(`Email provider verification failed: ${verification.message}`);
  }

  const subject = `ZinoShop SendGrid Test - ${new Date().toISOString()}`;
  const html = `
    <h2>ZinoShop SendGrid test</h2>
    <p>This is a direct SendGrid validation email from backend/scripts/test-sendgrid.ts.</p>
  `;
  const text = 'ZinoShop SendGrid test - backend/scripts/test-sendgrid.ts';

  const sendResult = await emailService.sendEmail(recipient, subject, html, text);
  if (!sendResult.success) {
    throw new Error(`SendGrid send failed: ${sendResult.message || 'Unknown error'}`);
  }

  console.log(
    `Email test sent successfully to ${recipient}. provider=${sendResult.provider} messageId=${sendResult.messageId || 'n/a'}`,
  );
}

main().catch((error) => {
  console.error('SendGrid test script failed:', error);
  process.exitCode = 1;
});
