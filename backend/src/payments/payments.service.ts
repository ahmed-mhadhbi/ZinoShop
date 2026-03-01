import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { OrdersService } from '../orders/orders.service';
import { PaymentStatus } from '../orders/entities/order.entity';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(private ordersService: OrdersService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2023-10-16',
    });
  }

  async createPaymentIntent(orderId: string, userId: string, role?: string) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe is not configured');
    }

    const order = await this.ordersService.findOne(
      orderId,
      role === 'admin' ? undefined : userId,
    );

    const amount = Number(order.total);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Invalid order total for payment');
    }

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: { orderId },
    });

    // Update order with payment intent ID
    await this.ordersService.update(orderId, {
      paymentIntentId: paymentIntent.id,
    } as any);

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }

  async confirmPayment(paymentIntentId: string) {
    const paymentIntent = await this.stripe.paymentIntents.retrieve(
      paymentIntentId,
    );

    if (paymentIntent.status === 'succeeded') {
      // Find order by payment intent ID and update status
      // This would require a query in orders service
      return { success: true, status: 'paid' };
    }

    return { success: false, status: paymentIntent.status };
  }

  async handleWebhook(payload: any, signature: string) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe is not configured');
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
    } catch (err) {
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        // Update order payment status
        break;
      case 'payment_intent.payment_failed':
        // Handle failed payment
        break;
    }

    return { received: true };
  }
}

