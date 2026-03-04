import * as dotenv from 'dotenv';
import * as path from 'path';
import { EmailService } from '../src/email/email.service';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const recipient = (process.env.RESEND_TEST_TO || process.env.CONTACT_EMAIL || '').trim();

async function main() {
  if (!recipient) {
    throw new Error(
      'Missing recipient. Set RESEND_TEST_TO or CONTACT_EMAIL in backend/.env',
    );
  }

  const emailService = new EmailService();
  const verification = await emailService.verifyConnection();

  if (!verification.success) {
    throw new Error(`Email provider verification failed: ${verification.message}`);
  }

  const subject = `ZinoShop Resend Test - ${new Date().toISOString()}`;
  const html = `
    <h2>ZinoShop Resend test</h2>
    <p>This is a direct Resend validation email from backend/scripts/test-resend.ts.</p>
  `;
  const text = 'ZinoShop Resend test - backend/scripts/test-resend.ts';

  const sendResult = await emailService.sendEmail(recipient, subject, html, text);
  if (!sendResult.success) {
    throw new Error(`Resend send failed: ${sendResult.message || 'Unknown error'}`);
  }

  console.log(
    `Email test sent successfully to ${recipient}. provider=${sendResult.provider} messageId=${sendResult.messageId || 'n/a'}`,
  );
}

main().catch((error) => {
  console.error('Resend test script failed:', error);
  process.exitCode = 1;
});
