import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import SMTPTransport = require('nodemailer/lib/smtp-transport');

type EmailSendResult = {
  success: boolean;
  provider: 'smtp' | 'resend';
  messageId?: string;
  message?: string;
  error?: unknown;
};

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private fallbackTransporter: nodemailer.Transporter | null = null;
  private smtpUser = '';
  private smtpFrom = '';
  private primaryTransportConfig: SMTPTransport.Options | null = null;
  private fallbackTransportConfig: SMTPTransport.Options | null = null;
  private resendApiKey = '';
  private resendFrom = '';
  private resendEnabled = false;

  constructor() {
    this.smtpUser = this.unwrapQuotedValue(process.env.SMTP_USER || '');
    const smtpPassRaw = this.unwrapQuotedValue(process.env.SMTP_PASS || '');
    const smtpPass = smtpPassRaw.replace(/\s+/g, '');
    this.smtpFrom = this.unwrapQuotedValue(
      process.env.SMTP_FROM || this.smtpUser || 'zino.shop.contact@gmail.com',
    );
    const smtpHost = this.unwrapQuotedValue(process.env.SMTP_HOST || 'smtp.gmail.com');
    const smtpPort = Number(this.unwrapQuotedValue(process.env.SMTP_PORT || '465'));
    const smtpSecure =
      this.unwrapQuotedValue(process.env.SMTP_SECURE || 'true').toLowerCase() !== 'false';
    this.resendApiKey = this.unwrapQuotedValue(process.env.RESEND_API_KEY || '');
    this.resendFrom = this.unwrapQuotedValue(process.env.RESEND_FROM || '');
    this.resendEnabled = Boolean(this.resendApiKey && this.resendFrom);

    if (smtpHost.toLowerCase().includes('gmail.com') && smtpPass.length !== 16) {
      console.warn(
        `SMTP_PASS length after normalization is ${smtpPass.length}. Gmail app passwords must be 16 characters.`,
      );
    }

    if (this.resendEnabled) {
      console.log('Resend fallback email provider is enabled');
    } else if (this.resendApiKey || this.resendFrom) {
      console.warn(
        'Resend is partially configured. Set both RESEND_API_KEY and RESEND_FROM for HTTP fallback.',
      );
    }

    if (this.smtpUser && smtpPass) {
      try {
        this.primaryTransportConfig = {
          host: smtpHost,
          port: Number.isFinite(smtpPort) ? smtpPort : 465,
          secure: smtpSecure,
          connectionTimeout: 20000,
          greetingTimeout: 20000,
          socketTimeout: 20000,
          auth: {
            user: this.smtpUser,
            pass: smtpPass,
          },
        };
        this.transporter = this.createTransporter(this.primaryTransportConfig);

        this.fallbackTransportConfig = this.buildFallbackTransportConfig(
          this.primaryTransportConfig,
        );
        if (this.fallbackTransportConfig) {
          this.fallbackTransporter = this.createTransporter(this.fallbackTransportConfig);
        }

        console.log(`Email service initialized with SMTP (${smtpHost}:${Number.isFinite(smtpPort) ? smtpPort : 465})`);

        // Validate auth/configuration without blocking app startup.
        void this.verifyConnection().then((result) => {
          if (result.success) {
            console.log('SMTP connection verified successfully');
          } else {
            console.error(`SMTP verification failed: ${result.message}`);
          }
        });
      } catch (error) {
        console.error('Failed to initialize email transporter:', error);
        this.transporter = null;
      }
    } else if (!this.resendEnabled) {
      console.warn('Email service not configured: SMTP_USER or SMTP_PASS missing');
    } else {
      console.warn('SMTP not configured. Using Resend fallback only.');
    }
  }

  async verifyConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.transporter) {
      if (this.resendEnabled) {
        return {
          success: true,
          message: 'SMTP not configured; Resend fallback is enabled',
        };
      }

      return {
        success: false,
        message: 'SMTP transporter is not configured',
      };
    }

    try {
      await this.transporter.verify();
      return {
        success: true,
        message: 'SMTP connection verified (primary transport)',
      };
    } catch (error) {
      if (this.shouldRetryWithFallback(error) && this.fallbackTransporter) {
        try {
          await this.fallbackTransporter.verify();
          this.promoteFallbackTransporter();
          return {
            success: true,
            message: 'SMTP connection verified (fallback transport)',
          };
        } catch (fallbackError) {
          return {
            success: false,
            message: this.stringifyError(fallbackError),
          };
        }
      }

      if (this.resendEnabled) {
        return {
          success: true,
          message: `SMTP unavailable (${this.stringifyError(error)}), Resend fallback is enabled`,
        };
      }

      return {
        success: false,
        message: this.stringifyError(error),
      };
    }
  }

  async sendEmail(to: string, subject: string, html: string, text?: string): Promise<EmailSendResult> {
    const plainText = text || this.stripHtml(html);
    const smtpResult = await this.sendViaSmtp(to, subject, html, plainText);
    if (smtpResult.success) {
      return smtpResult;
    }

    if (this.resendEnabled) {
      const resendResult = await this.sendViaResend(to, subject, html, plainText);
      if (resendResult.success) {
        console.log(`Email sent successfully to ${to} via Resend fallback`);
      }
      return resendResult;
    }

    if (!this.transporter) {
      console.warn('Email transporter not configured. Skipping email send.');
      return {
        success: false,
        provider: 'smtp',
        message: 'SMTP transporter not configured and Resend fallback is disabled',
      };
    }

    console.error(`Email sending error: ${smtpResult.message || 'Unknown SMTP error'}`);
    return smtpResult;
  }

  private async sendViaSmtp(
    to: string,
    subject: string,
    html: string,
    plainText: string,
  ): Promise<EmailSendResult> {
    if (!this.transporter) {
      return {
        success: false,
        provider: 'smtp',
        message: 'SMTP transporter not configured',
      };
    }

    const mailOptions = {
      from: this.smtpFrom,
      to,
      subject,
      text: plainText,
      html,
    };

    try {
      let result = await this.transporter.sendMail(mailOptions);

      if (!result && this.fallbackTransporter) {
        result = await this.fallbackTransporter.sendMail(mailOptions);
      }

      console.log(`Email sent successfully to ${to} via SMTP`);
      return {
        success: true,
        provider: 'smtp',
        messageId: result.messageId,
      };
    } catch (error) {
      if (this.shouldRetryWithFallback(error) && this.fallbackTransporter) {
        try {
          const fallbackResult = await this.fallbackTransporter.sendMail(mailOptions);
          this.promoteFallbackTransporter();
          console.log(`Email sent successfully to ${to} via SMTP fallback`);
          return {
            success: true,
            provider: 'smtp',
            messageId: fallbackResult.messageId,
          };
        } catch (fallbackError) {
          console.error('SMTP fallback sending error:', fallbackError);
          return {
            success: false,
            provider: 'smtp',
            message: this.stringifyError(fallbackError),
            error: fallbackError,
          };
        }
      }

      return {
        success: false,
        provider: 'smtp',
        message: this.stringifyError(error),
        error,
      };
    }
  }

  private async sendViaResend(
    to: string,
    subject: string,
    html: string,
    plainText: string,
  ): Promise<EmailSendResult> {
    if (!this.resendEnabled) {
      return {
        success: false,
        provider: 'resend',
        message: 'Resend fallback is not configured',
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.resendFrom,
          to: [to],
          subject,
          html,
          text: plainText,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const payload = await response.text();
        return {
          success: false,
          provider: 'resend',
          message: `Resend API error (${response.status}): ${payload}`,
        };
      }

      const payload = (await response.json()) as { id?: string };
      return {
        success: true,
        provider: 'resend',
        messageId: payload?.id,
      };
    } catch (error) {
      return {
        success: false,
        provider: 'resend',
        message: this.stringifyError(error),
        error,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async sendOrderConfirmation(order: any, customerEmail: string, customerName: string) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .order-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>ZinoShop</h1>
            </div>
            <div class="content">
              <h2>Order Confirmation</h2>
              <p>Dear ${customerName},</p>
              <p>Thank you for your order! We've received your order #${order.orderNumber} and will process it shortly.</p>
              <div class="order-details">
                <h3>Order Details</h3>
                <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                <p><strong>Total:</strong> $${order.total.toLocaleString()}</p>
                <p><strong>Status:</strong> ${order.status}</p>
              </div>
              <p>You will receive another email when your order ships.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ZinoShop. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(
      customerEmail,
      `Order Confirmation - ${order.orderNumber}`,
      html,
    );
  }

  async sendOrderNotificationToAdmin(
    order: any,
    customerEmail: string,
    customerName: string,
    customerCount?: number,
  ) {
    const paymentMethodLabel = this.formatPaymentMethodLabel(order?.paymentMethod);
    const isPayOnDelivery = String(order?.paymentMethod || '') === 'pay_on_delivery';
    const safeItems = Array.isArray(order.items) ? order.items : [];
    const totalProductsCount = safeItems.reduce(
      (sum: number, item: any) => sum + (Number(item.quantity) || 0),
      0,
    );
    const totalProductsAmount = safeItems.reduce(
      (sum: number, item: any) =>
        sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
      0,
    );
    const orderDate = (() => {
      const date = order?.createdAt ? new Date(order.createdAt) : new Date();
      return isNaN(date.getTime()) ? new Date().toLocaleString() : date.toLocaleString();
    })();

    const itemsHtml = safeItems.map((item: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          ${item.productName || 'N/A'}
          ${item.variant ? `<div style="font-size: 12px; color: #666;">Variante: ${item.variant}</div>` : ''}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.productSku || 'N/A'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${(Number(item.price) || 0).toLocaleString()} tnd</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${((Number(item.price) || 0) * (Number(item.quantity) || 0)).toLocaleString()} tnd</td>
      </tr>
    `).join('') || '';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .order-details { background: white; padding: 20px; margin: 15px 0; border-radius: 5px; }
            .info-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th { background: #f3f4f6; padding: 10px; text-align: left; font-weight: bold; border-bottom: 2px solid #ddd; }
            td { padding: 10px; border-bottom: 1px solid #eee; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .highlight { background: #dc2626; color: white; padding: 3px 8px; border-radius: 3px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Order - ZinoShop</h1>
            </div>
            <div class="content">
              <div class="info-box">
                <strong>NOUVELLE COMMANDE</strong><br>
                ${isPayOnDelivery ? 'Paiement a la livraison.' : 'Commande recue via la boutique en ligne.'}
              </div>

              <div class="order-details">
                <h2>Order Information</h2>
                <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                <p><strong>Order Date:</strong> ${orderDate}</p>
                <p><strong>Payment Method:</strong> <span class="highlight">${paymentMethodLabel}</span></p>
                <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
                <p><strong>Order Status:</strong> ${order.status}</p>
              </div>

              <div class="order-details">
                <h2>Customer Information</h2>
                <p><strong>Name:</strong> ${customerName}</p>
                <p><strong>Email:</strong> ${customerEmail}</p>
                <p><strong>Phone:</strong> ${order.shippingPhone}</p>
                <p><strong>Client ID:</strong> ${order.userId || 'N/A'}</p>
                <p><strong>Nombre total de clients:</strong> ${typeof customerCount === 'number' ? customerCount : 'N/A'}</p>
              </div>

              <div class="order-details">
                <h2>Shipping Address</h2>
                <p>
                  ${[order.shippingAddress, order.shippingCity, order.shippingState, order.shippingZipCode, order.shippingCountry].filter(Boolean).join(', ')}
                </p>
              </div>

              <div class="order-details">
                <h2>Order Items</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>SKU</th>
                      <th style="text-align: center;">Quantity</th>
                      <th style="text-align: right;">Unit Price</th>
                      <th style="text-align: right;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="4" style="text-align: right; font-weight: bold; padding-top: 10px;">Subtotal:</td>
                      <td style="text-align: right; font-weight: bold; padding-top: 10px;">${(Number(order.subtotal) || 0).toLocaleString()} tnd</td>
                    </tr>
                    <tr>
                      <td colspan="4" style="text-align: right; font-weight: bold;">Livraison:</td>
                      <td style="text-align: right; font-weight: bold;">${(Number(order.shipping) || 0).toLocaleString()} tnd</td>
                    </tr>
                    <tr>
                      <td colspan="4" style="text-align: right; font-weight: bold; font-size: 1.2em; padding-top: 10px; border-top: 2px solid #ddd;">Total:</td>
                      <td style="text-align: right; font-weight: bold; font-size: 1.2em; padding-top: 10px; border-top: 2px solid #ddd;">${(Number(order.total) || 0).toLocaleString()} tnd</td>
                    </tr>
                    <tr>
                      <td colspan="4" style="text-align: right; font-weight: bold;">Total produits (quantite):</td>
                      <td style="text-align: right; font-weight: bold;">${totalProductsCount}</td>
                    </tr>
                    <tr>
                      <td colspan="4" style="text-align: right; font-weight: bold;">Total de tous les produits:</td>
                      <td style="text-align: right; font-weight: bold;">${totalProductsAmount.toLocaleString()} tnd</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              ${order.notes ? `
              <div class="order-details">
                <h2>Notes</h2>
                <p>${order.notes}</p>
              </div>
              ` : ''}
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ZinoShop. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail(
      process.env.CONTACT_EMAIL || 'zino.shop.contact@gmail.com',
      `New Order - ${order.orderNumber}`,
      html,
    );
  }

  private formatPaymentMethodLabel(paymentMethod: unknown): string {
    const value = String(paymentMethod || '').toLowerCase();
    const labels: Record<string, string> = {
      card: 'Card',
      paypal: 'PayPal',
      edinar: 'E-Dinar',
      bank: 'Bank Transfer',
      pay_on_delivery: 'Pay on Delivery',
    };
    return labels[value] || (value ? value.replace(/_/g, ' ') : 'Unknown');
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  private stringifyError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return 'Unknown error';
    }
  }

  private unwrapQuotedValue(value: string): string {
    const trimmed = String(value || '').trim();
    if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
      return trimmed.slice(1, -1).trim();
    }
    return trimmed;
  }

  private createTransporter(config: SMTPTransport.Options): nodemailer.Transporter {
    return nodemailer.createTransport({
      ...config,
      tls: {
        servername: String(config.host || 'smtp.gmail.com'),
        rejectUnauthorized: true,
      },
    });
  }

  private buildFallbackTransportConfig(
    primary: SMTPTransport.Options,
  ): SMTPTransport.Options | null {
    const host = String(primary.host || '').toLowerCase();
    const port = Number(primary.port || 0);
    const secure = Boolean(primary.secure);

    if (!host.includes('gmail.com')) {
      return null;
    }

    if (port === 465 && secure) {
      return {
        ...primary,
        port: 587,
        secure: false,
        requireTLS: true,
      };
    }

    if (port === 587 && !secure) {
      return {
        ...primary,
        port: 465,
        secure: true,
        requireTLS: false,
      };
    }

    return null;
  }

  private shouldRetryWithFallback(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const code = String((error as any).code || '').toUpperCase();
    return ['ETIMEDOUT', 'ESOCKET', 'ECONNECTION', 'EHOSTUNREACH', 'ENETUNREACH'].includes(code);
  }

  private promoteFallbackTransporter(): void {
    if (!this.fallbackTransporter || !this.fallbackTransportConfig) {
      return;
    }

    this.transporter = this.fallbackTransporter;
    this.primaryTransportConfig = this.fallbackTransportConfig;
    this.fallbackTransportConfig = this.buildFallbackTransportConfig(
      this.primaryTransportConfig,
    );
    this.fallbackTransporter = this.fallbackTransportConfig
      ? this.createTransporter(this.fallbackTransportConfig)
      : null;
  }
}

