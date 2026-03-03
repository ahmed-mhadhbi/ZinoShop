import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

type EmailSendResult = {
  success: boolean;
  provider: 'smtp';
  messageId?: string;
  message?: string;
  error?: unknown;
};

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private smtpUser = '';
  private smtpFrom = '';

  constructor() {
    this.smtpUser = (process.env.SMTP_USER || '').trim();
    const smtpPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
    this.smtpFrom = (process.env.SMTP_FROM || this.smtpUser || 'zino.shop.contact@gmail.com').trim();
    const smtpHost = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
    const smtpPort = Number(process.env.SMTP_PORT || 465);
    const smtpSecure = (process.env.SMTP_SECURE || 'true').toLowerCase() !== 'false';

    if (this.smtpUser && smtpPass) {
      try {
        this.transporter = nodemailer.createTransport({
          host: smtpHost,
          port: Number.isFinite(smtpPort) ? smtpPort : 465,
          secure: smtpSecure,
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 10000,
          auth: {
            user: this.smtpUser,
            pass: smtpPass,
          },
        });
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
    } else {
      console.warn('Email service not configured: SMTP_USER or SMTP_PASS missing');
    }
  }

  async verifyConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.transporter) {
      return {
        success: false,
        message: 'SMTP transporter is not configured',
      };
    }

    try {
      await this.transporter.verify();
      return {
        success: true,
        message: 'SMTP connection verified',
      };
    } catch (error) {
      return {
        success: false,
        message: this.stringifyError(error),
      };
    }
  }

  async sendEmail(to: string, subject: string, html: string, text?: string): Promise<EmailSendResult> {
    if (!this.transporter) {
      console.warn('Email transporter not configured. Skipping email send.');
      return {
        success: false,
        provider: 'smtp',
        message: 'SMTP transporter not configured',
      };
    }

    const plainText = text || this.stripHtml(html);
    const mailOptions = {
      from: this.smtpFrom,
      to,
      subject,
      text: plainText,
      html,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${to} via SMTP`);
      return {
        success: true,
        provider: 'smtp',
        messageId: result.messageId,
      };
    } catch (error) {
      console.error('Email sending error:', error);
      // Don't throw error, just log it so order creation doesn't fail
      return {
        success: false,
        provider: 'smtp',
        message: this.stringifyError(error),
        error,
      };
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
}

