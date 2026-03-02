import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';

@Injectable()
export class ContactService {
  constructor(private readonly emailService: EmailService) {}

  async submitMessage(createContactMessageDto: CreateContactMessageDto) {
    const name = createContactMessageDto.name.trim();
    const email = createContactMessageDto.email.trim().toLowerCase();
    const subject = createContactMessageDto.subject.trim();
    const message = createContactMessageDto.message.trim();

    const targetEmail =
      process.env.CONTACT_EMAIL ||
      process.env.SMTP_USER ||
      'zino.shop.contact@gmail.com';

    const escapedName = this.escapeHtml(name);
    const escapedEmail = this.escapeHtml(email);
    const escapedSubject = this.escapeHtml(subject);
    const escapedMessage = this.escapeHtml(message).replace(/\n/g, '<br/>');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, sans-serif; color: #111827; line-height: 1.6; }
            .container { max-width: 700px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: #ffffff; padding: 16px 20px; border-radius: 8px 8px 0 0; }
            .content { border: 1px solid #e5e7eb; border-top: 0; padding: 20px; border-radius: 0 0 8px 8px; }
            .label { font-weight: 700; color: #374151; }
            .box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-top: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">Nouveau message - Formulaire Contact</h2>
            </div>
            <div class="content">
              <p><span class="label">Nom:</span> ${escapedName}</p>
              <p><span class="label">Email:</span> ${escapedEmail}</p>
              <p><span class="label">Sujet:</span> ${escapedSubject}</p>
              <p class="label">Message:</p>
              <div class="box">${escapedMessage}</div>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = [
      'Nouveau message - Formulaire Contact',
      `Nom: ${name}`,
      `Email: ${email}`,
      `Sujet: ${subject}`,
      '',
      'Message:',
      message,
    ].join('\n');

    const sendResult = await this.emailService.sendEmail(
      targetEmail,
      `Contact - ${subject}`,
      html,
      text,
    );

    if (!sendResult?.success) {
      throw new ServiceUnavailableException(
        'Le service email est indisponible. Verifiez SMTP_USER/SMTP_PASS.',
      );
    }

    return {
      success: true,
      message: 'Message envoye avec succes',
    };
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

