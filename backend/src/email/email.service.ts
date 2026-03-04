import { Injectable } from '@nestjs/common';

type EmailSendResult = {
  success: boolean;
  provider: 'sendgrid';
  messageId?: string;
  message?: string;
  error?: unknown;
};

@Injectable()
export class EmailService {
  private readonly sendGridApiKey: string;
  private readonly sendGridFromEmail: string;
  private readonly isConfigured: boolean;

  constructor() {
    this.sendGridApiKey = this.unwrapQuotedValue(process.env.SENDGRID_API_KEY || '');
    this.sendGridFromEmail = this.unwrapQuotedValue(
      process.env.SENDGRID_FROM_EMAIL ||
        process.env.CONTACT_EMAIL ||
        'zino.shop.contact@gmail.com',
    );
    this.isConfigured = Boolean(this.sendGridApiKey && this.sendGridFromEmail);

    if (!this.isConfigured) {
      console.warn(
        'Email service not configured: set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL.',
      );
    }

    if (this.sendGridApiKey && !this.sendGridApiKey.startsWith('SG.')) {
      console.warn(
        'SENDGRID_API_KEY does not start with "SG.". Verify that you are using a valid SendGrid API key.',
      );
    }
  }

  async verifyConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured) {
      return {
        success: false,
        message:
          'SendGrid is not configured (missing SENDGRID_API_KEY or SENDGRID_FROM_EMAIL).',
      };
    }

    return {
      success: true,
      message: 'SendGrid is configured.',
    };
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<EmailSendResult> {
    if (!this.isConfigured) {
      return {
        success: false,
        provider: 'sendgrid',
        message:
          'SendGrid is not configured (missing SENDGRID_API_KEY or SENDGRID_FROM_EMAIL).',
      };
    }

    const recipient = this.unwrapQuotedValue(String(to || '').trim());
    if (!recipient) {
      return {
        success: false,
        provider: 'sendgrid',
        message: 'Recipient email is required.',
      };
    }

    const cleanSubject = String(subject || '').trim() || 'ZinoShop Notification';
    const plainText = text || this.stripHtml(html);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.sendGridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: recipient }],
              subject: cleanSubject,
            },
          ],
          from: { email: this.sendGridFromEmail },
          reply_to: { email: this.sendGridFromEmail },
          content: [
            { type: 'text/plain', value: plainText },
            { type: 'text/html', value: html },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const payload = await response.text();
        return {
          success: false,
          provider: 'sendgrid',
          message: `SendGrid API error (${response.status}): ${payload || response.statusText}`,
        };
      }

      const messageId = response.headers.get('x-message-id') || undefined;
      console.log(`Email sent successfully to ${recipient} via SendGrid`);

      return {
        success: true,
        provider: 'sendgrid',
        messageId,
      };
    } catch (error) {
      return {
        success: false,
        provider: 'sendgrid',
        message: this.stringifyError(error),
        error,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async sendOrderConfirmation(order: any, customerEmail: string, customerName: string) {
    const safeItems = Array.isArray(order?.items) ? order.items : [];
    const paymentMethodLabel = this.formatPaymentMethodLabel(order?.paymentMethod);
    const orderDate = this.formatDate(order?.createdAt);
    const escapedCustomerName = this.escapeHtml(customerName || 'Client');
    const escapedOrderNumber = this.escapeHtml(String(order?.orderNumber || 'N/A'));
    const escapedCustomerEmail = this.escapeHtml(customerEmail || 'N/A');
    const shippingAddress = this.escapeHtml(this.formatShippingAddress(order));
    const escapedPhone = this.escapeHtml(String(order?.shippingPhone || 'N/A'));
    const escapedPaymentStatus = this.escapeHtml(String(order?.paymentStatus || 'pending'));
    const escapedOrderStatus = this.escapeHtml(String(order?.status || 'pending'));

    const itemsHtml =
      safeItems
        .map((item: any) => {
          const name = this.escapeHtml(String(item?.productName || 'N/A'));
          const sku = this.escapeHtml(String(item?.productSku || 'N/A'));
          const variant = item?.variant
            ? `<div style="font-size: 12px; color: #6b7280;">Variant: ${this.escapeHtml(String(item.variant))}</div>`
            : '';
          const quantity = Number(item?.quantity) || 0;
          const price = Number(item?.price) || 0;
          return `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
                ${name}
                ${variant}
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${sku}</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${quantity}</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">${this.formatMoney(price)}</td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">${this.formatMoney(price * quantity)}</td>
            </tr>
          `;
        })
        .join('') ||
      `
        <tr>
          <td colspan="5" style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #6b7280;">
            No order items found.
          </td>
        </tr>
      `;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #111827; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: #ffffff; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { border: 1px solid #e5e7eb; border-top: 0; padding: 20px; border-radius: 0 0 8px 8px; background: #ffffff; }
            .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-top: 16px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th { background: #f3f4f6; text-align: left; padding: 10px; border-bottom: 2px solid #d1d5db; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">ZinoShop</h1>
              <p style="margin: 8px 0 0;">Order Confirmation</p>
            </div>
            <div class="content">
              <p>Dear ${escapedCustomerName},</p>
              <p>Thank you for your order. Here are the full details of your purchase.</p>

              <div class="card">
                <h2 style="margin-top: 0;">Order Information</h2>
                <p><strong>Order Number:</strong> ${escapedOrderNumber}</p>
                <p><strong>Order Date:</strong> ${this.escapeHtml(orderDate)}</p>
                <p><strong>Payment Method:</strong> ${this.escapeHtml(paymentMethodLabel)}</p>
                <p><strong>Payment Status:</strong> ${escapedPaymentStatus}</p>
                <p><strong>Order Status:</strong> ${escapedOrderStatus}</p>
              </div>

              <div class="card">
                <h2 style="margin-top: 0;">Customer & Shipping</h2>
                <p><strong>Name:</strong> ${escapedCustomerName}</p>
                <p><strong>Email:</strong> ${escapedCustomerEmail}</p>
                <p><strong>Phone:</strong> ${escapedPhone}</p>
                <p><strong>Shipping Address:</strong> ${shippingAddress}</p>
              </div>

              <div class="card">
                <h2 style="margin-top: 0;">Order Items</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th style="text-align: center;">Qty</th>
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
                      <td style="text-align: right; font-weight: bold; padding-top: 10px;">${this.formatMoney(order?.subtotal)}</td>
                    </tr>
                    <tr>
                      <td colspan="4" style="text-align: right; font-weight: bold;">Shipping:</td>
                      <td style="text-align: right; font-weight: bold;">${this.formatMoney(order?.shipping)}</td>
                    </tr>
                    <tr>
                      <td colspan="4" style="text-align: right; font-weight: bold; font-size: 1.1em; padding-top: 10px; border-top: 2px solid #d1d5db;">Total:</td>
                      <td style="text-align: right; font-weight: bold; font-size: 1.1em; padding-top: 10px; border-top: 2px solid #d1d5db;">${this.formatMoney(order?.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              ${order?.notes ? `
                <div class="card">
                  <h2 style="margin-top: 0;">Notes</h2>
                  <p>${this.escapeHtml(String(order.notes)).replace(/\n/g, '<br/>')}</p>
                </div>
              ` : ''}

              <p style="margin-top: 18px;">We will notify you when your order is shipped.</p>
            </div>
            <p class="footer">&copy; ${new Date().getFullYear()} ZinoShop. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    const text = [
      `Order Confirmation - ${String(order?.orderNumber || 'N/A')}`,
      '',
      `Customer: ${customerName || 'Client'}`,
      `Email: ${customerEmail || 'N/A'}`,
      `Phone: ${String(order?.shippingPhone || 'N/A')}`,
      '',
      `Order Date: ${orderDate}`,
      `Payment Method: ${paymentMethodLabel}`,
      `Payment Status: ${String(order?.paymentStatus || 'pending')}`,
      `Order Status: ${String(order?.status || 'pending')}`,
      '',
      `Shipping Address: ${this.formatShippingAddress(order)}`,
      '',
      'Items:',
      this.formatItemsText(safeItems),
      '',
      `Subtotal: ${this.formatMoney(order?.subtotal)}`,
      `Shipping: ${this.formatMoney(order?.shipping)}`,
      `Total: ${this.formatMoney(order?.total)}`,
      ...(order?.notes ? ['', 'Notes:', String(order.notes)] : []),
    ].join('\n');

    return this.sendEmail(
      customerEmail,
      `Order Confirmation - ${String(order?.orderNumber || 'N/A')}`,
      html,
      text,
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
    const safeItems = Array.isArray(order?.items) ? order.items : [];
    const totalProductsCount = safeItems.reduce(
      (sum: number, item: any) => sum + (Number(item?.quantity) || 0),
      0,
    );
    const totalProductsAmount = safeItems.reduce(
      (sum: number, item: any) =>
        sum + (Number(item?.price) || 0) * (Number(item?.quantity) || 0),
      0,
    );
    const orderDate = this.formatDate(order?.createdAt);

    const escapedCustomerName = this.escapeHtml(customerName || 'Client');
    const escapedCustomerEmail = this.escapeHtml(customerEmail || 'N/A');
    const escapedOrderNumber = this.escapeHtml(String(order?.orderNumber || 'N/A'));
    const escapedPhone = this.escapeHtml(String(order?.shippingPhone || 'N/A'));
    const escapedUserId = this.escapeHtml(String(order?.userId || 'N/A'));
    const escapedShippingAddress = this.escapeHtml(this.formatShippingAddress(order));

    const itemsHtml =
      safeItems
        .map((item: any) => {
          const name = this.escapeHtml(String(item?.productName || 'N/A'));
          const sku = this.escapeHtml(String(item?.productSku || 'N/A'));
          const variant = item?.variant
            ? `<div style="font-size: 12px; color: #666;">Variant: ${this.escapeHtml(String(item.variant))}</div>`
            : '';
          const quantity = Number(item?.quantity) || 0;
          const price = Number(item?.price) || 0;

          return `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">
                ${name}
                ${variant}
              </td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${sku}</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${quantity}</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${this.formatMoney(price)}</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${this.formatMoney(price * quantity)}</td>
            </tr>
          `;
        })
        .join('') ||
      `
        <tr>
          <td colspan="5" style="padding: 10px; border-bottom: 1px solid #eee; text-align: center; color: #666;">
            No order items found.
          </td>
        </tr>
      `;

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
                <strong>NEW ORDER</strong><br>
                ${isPayOnDelivery ? 'Payment on delivery selected.' : 'Order submitted from online store.'}
              </div>

              <div class="order-details">
                <h2>Order Information</h2>
                <p><strong>Order Number:</strong> ${escapedOrderNumber}</p>
                <p><strong>Order Date:</strong> ${this.escapeHtml(orderDate)}</p>
                <p><strong>Payment Method:</strong> <span class="highlight">${this.escapeHtml(paymentMethodLabel)}</span></p>
                <p><strong>Payment Status:</strong> ${this.escapeHtml(String(order?.paymentStatus || 'pending'))}</p>
                <p><strong>Order Status:</strong> ${this.escapeHtml(String(order?.status || 'pending'))}</p>
              </div>

              <div class="order-details">
                <h2>Customer Information</h2>
                <p><strong>Name:</strong> ${escapedCustomerName}</p>
                <p><strong>Email:</strong> ${escapedCustomerEmail}</p>
                <p><strong>Phone:</strong> ${escapedPhone}</p>
                <p><strong>Client ID:</strong> ${escapedUserId}</p>
                <p><strong>Total Clients:</strong> ${typeof customerCount === 'number' ? customerCount : 'N/A'}</p>
              </div>

              <div class="order-details">
                <h2>Shipping Address</h2>
                <p>${escapedShippingAddress}</p>
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
                      <td style="text-align: right; font-weight: bold; padding-top: 10px;">${this.formatMoney(order?.subtotal)}</td>
                    </tr>
                    <tr>
                      <td colspan="4" style="text-align: right; font-weight: bold;">Shipping:</td>
                      <td style="text-align: right; font-weight: bold;">${this.formatMoney(order?.shipping)}</td>
                    </tr>
                    <tr>
                      <td colspan="4" style="text-align: right; font-weight: bold; font-size: 1.2em; padding-top: 10px; border-top: 2px solid #ddd;">Total:</td>
                      <td style="text-align: right; font-weight: bold; font-size: 1.2em; padding-top: 10px; border-top: 2px solid #ddd;">${this.formatMoney(order?.total)}</td>
                    </tr>
                    <tr>
                      <td colspan="4" style="text-align: right; font-weight: bold;">Total products (quantity):</td>
                      <td style="text-align: right; font-weight: bold;">${totalProductsCount}</td>
                    </tr>
                    <tr>
                      <td colspan="4" style="text-align: right; font-weight: bold;">All products amount:</td>
                      <td style="text-align: right; font-weight: bold;">${this.formatMoney(totalProductsAmount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              ${order?.notes ? `
                <div class="order-details">
                  <h2>Notes</h2>
                  <p>${this.escapeHtml(String(order.notes)).replace(/\n/g, '<br/>')}</p>
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

    const text = [
      `New Order - ${String(order?.orderNumber || 'N/A')}`,
      '',
      `Order Date: ${orderDate}`,
      `Payment Method: ${paymentMethodLabel}`,
      `Payment Status: ${String(order?.paymentStatus || 'pending')}`,
      `Order Status: ${String(order?.status || 'pending')}`,
      '',
      `Customer Name: ${customerName || 'Client'}`,
      `Customer Email: ${customerEmail || 'N/A'}`,
      `Customer Phone: ${String(order?.shippingPhone || 'N/A')}`,
      `Client ID: ${String(order?.userId || 'N/A')}`,
      `Total Clients: ${typeof customerCount === 'number' ? customerCount : 'N/A'}`,
      '',
      `Shipping Address: ${this.formatShippingAddress(order)}`,
      '',
      'Items:',
      this.formatItemsText(safeItems),
      '',
      `Subtotal: ${this.formatMoney(order?.subtotal)}`,
      `Shipping: ${this.formatMoney(order?.shipping)}`,
      `Total: ${this.formatMoney(order?.total)}`,
      `Total products (quantity): ${totalProductsCount}`,
      `All products amount: ${this.formatMoney(totalProductsAmount)}`,
      ...(order?.notes ? ['', 'Notes:', String(order.notes)] : []),
    ].join('\n');

    return this.sendEmail(
      process.env.CONTACT_EMAIL ||
        process.env.SENDGRID_FROM_EMAIL ||
        'zino.shop.contact@gmail.com',
      `New Order - ${String(order?.orderNumber || 'N/A')}`,
      html,
      text,
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

  private formatShippingAddress(order: any): string {
    return [
      order?.shippingAddress,
      order?.shippingCity,
      order?.shippingState,
      order?.shippingZipCode,
      order?.shippingCountry,
    ]
      .filter((part) => Boolean(part && String(part).trim()))
      .map((part) => String(part).trim())
      .join(', ') || 'N/A';
  }

  private formatDate(value: unknown): string {
    const date = value ? new Date(value as any) : new Date();
    if (isNaN(date.getTime())) {
      return new Date().toLocaleString();
    }
    return date.toLocaleString();
  }

  private formatMoney(value: unknown): string {
    return `${(Number(value) || 0).toLocaleString()} tnd`;
  }

  private formatItemsText(items: any[]): string {
    if (!Array.isArray(items) || items.length === 0) {
      return '- No order items found.';
    }

    return items
      .map((item) => {
        const name = String(item?.productName || 'N/A');
        const sku = String(item?.productSku || 'N/A');
        const variant = item?.variant ? ` (${String(item.variant)})` : '';
        const quantity = Number(item?.quantity) || 0;
        const price = Number(item?.price) || 0;
        const total = price * quantity;
        return `- ${name}${variant} | SKU: ${sku} | Qty: ${quantity} | Unit: ${this.formatMoney(price)} | Total: ${this.formatMoney(total)}`;
      })
      .join('\n');
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
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

  private escapeHtml(value: string): string {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
