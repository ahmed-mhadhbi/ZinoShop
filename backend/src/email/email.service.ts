import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    // Create Gmail SMTP transporter only if credentials are provided
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    
    if (smtpUser && smtpPass) {
      try {
        this.transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true, // true for 465, false for other ports
          auth: {
            user: smtpUser,
            pass: smtpPass, // Gmail App Password
          },
        });
        console.log('Email service initialized with Gmail SMTP');
      } catch (error) {
        console.error('Failed to initialize email transporter:', error);
        this.transporter = null;
      }
    } else {
      console.warn('Email service not configured: SMTP_USER or SMTP_PASS not set');
    }
  }

  async sendEmail(to: string, subject: string, html: string, text?: string) {
    if (!this.transporter) {
      console.warn('Email transporter not configured. Skipping email send.');
      return { success: false, message: 'Email service not configured' };
    }

    const mailOptions = {
      from: process.env.SMTP_USER || 'noreply@zinoshop.com',
      to,
      subject,
      text: text || this.stripHtml(html),
      html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${to}`);
      return { success: true };
    } catch (error) {
      console.error('Email sending error:', error);
      // Don't throw error, just log it so order creation doesn't fail
      return { success: false, error };
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

  async sendOrderNotificationToAdmin(order: any, customerEmail: string, customerName: string) {
    const itemsHtml = order.items?.map((item: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.productName || 'N/A'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.productSku || 'N/A'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${parseFloat(item.price).toLocaleString()}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${parseFloat(item.total).toLocaleString()}</td>
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
                <strong>⚠️ PAY ON DELIVERY ORDER</strong><br>
                Payment will be collected upon delivery.
              </div>
              
              <div class="order-details">
                <h2>Order Information</h2>
                <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
                <p><strong>Payment Method:</strong> <span class="highlight">Pay on Delivery</span></p>
                <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
                <p><strong>Order Status:</strong> ${order.status}</p>
              </div>

              <div class="order-details">
                <h2>Customer Information</h2>
                <p><strong>Name:</strong> ${customerName}</p>
                <p><strong>Email:</strong> ${customerEmail}</p>
                <p><strong>Phone:</strong> ${order.shippingPhone}</p>
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
                      <td style="text-align: right; font-weight: bold; padding-top: 10px;">${parseFloat(order.subtotal).toLocaleString()} tnd</td>
                    </tr>
                    <tr>
                      <td colspan="4" style="text-align: right; font-weight: bold;">Shipping:</td>
                      <td style="text-align: right; font-weight: bold;">${parseFloat(order.shipping).toLocaleString() === '0' ? 'Free' : `${parseFloat(order.shipping).toLocaleString()} tnd`}</td>
                    </tr>
                    <tr>
                      <td colspan="4" style="text-align: right; font-weight: bold; font-size: 1.2em; padding-top: 10px; border-top: 2px solid #ddd;">Total:</td>
                      <td style="text-align: right; font-weight: bold; font-size: 1.2em; padding-top: 10px; border-top: 2px solid #ddd;">${parseFloat(order.total).toLocaleString()} tnd</td>
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
      'ahmedmha.fd@gmail.com',
      `New Pay on Delivery Order - ${order.orderNumber}`,
      html,
    );
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}

