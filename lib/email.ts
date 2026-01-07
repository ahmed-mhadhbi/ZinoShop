// Email service using SendGrid
// This would be called from the backend

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

// This function should be called from the backend API
// Frontend should call the backend endpoint which handles email sending
export const sendEmail = async (options: EmailOptions) => {
  const response = await fetch('/api/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  })

  if (!response.ok) {
    throw new Error('Failed to send email')
  }

  return response.json()
}

// Email templates
export const emailTemplates = {
  orderConfirmation: (orderNumber: string, customerName: string) => ({
    subject: `Order Confirmation - ${orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
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
              <p>Thank you for your order! We've received your order #${orderNumber} and will process it shortly.</p>
              <p>You will receive another email when your order ships.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ZinoShop. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
}

