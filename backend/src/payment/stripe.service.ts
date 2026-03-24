import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class StripeService implements OnModuleInit, OnModuleDestroy {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-01-27.acacia' as any,
    });
  }

  async onModuleInit() {
    await prisma.$connect();
  }

  async onModuleDestroy() {
    await prisma.$disconnect();
  }

  async createCheckoutSession(tenantId: string, planId: string, successUrl: string, cancelUrl: string) {
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      throw new Error('Plan not found');
    }

    // Map plan to Stripe price (you'll need to create these in Stripe dashboard)
    const priceMap: Record<string, string> = {
      'plan-starter': process.env.STRIPE_PRICE_STARTER || 'price_starter',
      'plan-pro': process.env.STRIPE_PRICE_PRO || 'price_pro',
      'plan-enterprise': process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise',
    };

    const priceId = priceMap[planId];
    if (!priceId) {
      throw new Error('Stripe price not configured for this plan');
    }

    // Get or create Stripe customer
    let tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    let customerId = tenant?.stripeCustomerId;

    if (!customerId) {
      // Create new customer
      const customer = await this.stripe.customers.create({
        metadata: { tenantId },
      });
      customerId = customer.id;

      // Update tenant with customer ID
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        tenantId,
        planId,
      },
    });

    return session;
  }

  async createPortalSession(tenantId: string, returnUrl: string) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

    if (!tenant?.stripeCustomerId) {
      throw new Error('No Stripe customer found');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: tenant.stripeCustomerId,
      return_url: returnUrl,
    });

    return session;
  }

  async handleWebhook(payload: Buffer, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('Stripe webhook secret not configured');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );
    } catch (err: any) {
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
    }

    return { received: true };
  }

  private async handleCheckoutComplete(session: Stripe.Checkout.Session) {
    const tenantId = session.metadata?.tenantId;
    const planId = session.metadata?.planId;

    if (!tenantId || !planId) return;

    const subscriptionId = session.subscription as string;

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        stripeSubscriptionId: subscriptionId,
        planId,
        status: 'ACTIVE',
      },
    });
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription) {
    const tenant = await prisma.tenant.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!tenant) return;

    const status = subscription.status === 'active' ? 'ACTIVE' : 'SUSPENDED';

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { status },
    });
  }

  private async handleSubscriptionCanceled(subscription: Stripe.Subscription) {
    const tenant = await prisma.tenant.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!tenant) return;

    // Downgrade to Free plan
    const freePlan = await prisma.plan.findFirst({ where: { name: 'Free' } });

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        planId: freePlan?.id,
        stripeSubscriptionId: null,
        status: 'CANCELED',
      },
    });
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;

    const tenant = await prisma.tenant.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!tenant) return;

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { status: 'SUSPENDED' },
    });
  }

  async cancelSubscription(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

    if (!tenant?.stripeSubscriptionId) {
      throw new Error('No active subscription found');
    }

    await this.stripe.subscriptions.cancel(tenant.stripeSubscriptionId);
  }
}