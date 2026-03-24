import { Controller, Post, Get, Body, UseGuards, Request, Query, Headers, RawBodyRequest, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StripeService } from './stripe.service';
import { TenantService } from '../tenant/tenant.service';

@ApiTags('billing')
@Controller('billing')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly tenantService: TenantService,
  ) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe checkout session for plan upgrade' })
  async createCheckout(
    @Request() req: any,
    @Body() body: { planId: string },
  ) {
    const tenant = await this.tenantService.getTenantByUserId(req.user.userId);
    if (!tenant) {
      return { error: 'Organization not found' };
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const successUrl = `${frontendUrl}/settings/billing?success=true`;
    const cancelUrl = `${frontendUrl}/settings/billing?canceled=true`;

    try {
      const session = await this.stripeService.createCheckoutSession(
        tenant.id,
        body.planId,
        successUrl,
        cancelUrl
      );

      return { checkoutUrl: session.url };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  @Get('portal')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe customer portal session' })
  async createPortal(@Request() req: any) {
    const tenant = await this.tenantService.getTenantByUserId(req.user.userId);
    if (!tenant) {
      return { error: 'Organization not found' };
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const returnUrl = `${frontendUrl}/settings/billing`;

    try {
      const session = await this.stripeService.createPortalSession(tenant.id, returnUrl);
      return { portalUrl: session.url };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook handler' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody) {
      return { error: 'Missing raw body' };
    }

    try {
      return await this.stripeService.handleWebhook(req.rawBody, signature);
    } catch (error: any) {
      return { error: error.message };
    }
  }

  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel subscription and downgrade to Free plan' })
  async cancelSubscription(@Request() req: any) {
    const tenant = await this.tenantService.getTenantByUserId(req.user.userId);
    if (!tenant) {
      return { error: 'Organization not found' };
    }

    try {
      await this.stripeService.cancelSubscription(tenant.id);
      return { message: 'Subscription cancelled successfully' };
    } catch (error: any) {
      return { error: error.message };
    }
  }
}