import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import axios from 'axios';

const prisma = new PrismaClient();

// AIDEV-NOTE: Event types for webhooks
export const WEBHOOK_EVENTS = {
  TIME_ENTRY_CREATED: 'time_entry.created',
  TIME_ENTRY_UPDATED: 'time_entry.updated',
  TIME_ENTRY_DELETED: 'time_entry.deleted',
  PROJECT_CREATED: 'project.created',
  PROJECT_UPDATED: 'project.updated',
  PROJECT_DELETED: 'project.deleted',
  TASK_CREATED: 'task.created',
  TASK_UPDATED: 'task.updated',
  TASK_DELETED: 'task.deleted',
  USER_INVITED: 'user.invited',
  USER_JOINED: 'user.joined',
  TIME_OFF_REQUESTED: 'time_off.requested',
  TIME_OFF_APPROVED: 'time_off.approved',
  TIME_OFF_REJECTED: 'time_off.rejected',
} as const;

export type WebhookEvent = typeof WEBHOOK_EVENTS[keyof typeof WEBHOOK_EVENTS];

@Injectable()
export class WebhookService {
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS = [1000, 5000, 30000]; // 1s, 5s, 30s

  /**
   * AIDEV-NOTE: Create a webhook for a team
   */
  async createWebhook(
    teamId: string,
    url: string,
    events: string[],
  ): Promise<{ webhook: any; secret: string }> {
    const secret = crypto.randomBytes(32).toString('hex');

    const webhook = await prisma.webhook.create({
      data: {
        teamId,
        url,
        events,
        secret,
        active: true,
      },
    });

    return { webhook, secret };
  }

  /**
   * AIDEV-NOTE: List webhooks for a team
   */
  async listWebhooks(teamId: string): Promise<any[]> {
    return prisma.webhook.findMany({
      where: { teamId, active: true },
      select: {
        id: true,
        url: true,
        events: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });
  }

  /**
   * AIDEV-NOTE: Delete a webhook
   */
  async deleteWebhook(webhookId: string, teamId: string): Promise<boolean> {
    const webhook = await prisma.webhook.findFirst({
      where: { id: webhookId, teamId },
    });

    if (!webhook) return false;

    await prisma.webhook.update({
      where: { id: webhookId },
      data: { active: false },
    });

    return true;
  }

  /**
   * AIDEV-NOTE: Trigger a webhook event
   */
  async triggerEvent(
    teamId: string,
    event: string,
    payload: any,
  ): Promise<void> {
    // Find all active webhooks for this team that subscribe to this event
    const webhooks = await prisma.webhook.findMany({
      where: {
        teamId,
        active: true,
        events: { has: event },
      },
    });

    for (const webhook of webhooks) {
      await this.queueDelivery(webhook.id, event, payload);
    }
  }

  /**
   * AIDEV-NOTE: Queue a webhook delivery
   */
  private async queueDelivery(
    webhookId: string,
    event: string,
    payload: any,
  ): Promise<void> {
    await prisma.webhookDelivery.create({
      data: {
        webhookId,
        event,
        payload: JSON.stringify(payload),
        status: 'PENDING',
        attempts: 0,
      },
    });

    // Process delivery in background (simplified - in production use a queue)
    this.processDeliveryQueue();
  }

  /**
   * AIDEV-NOTE: Process pending deliveries
   */
  private async processDeliveryQueue(): Promise<void> {
    const pending = await prisma.webhookDelivery.findMany({
      where: { status: 'PENDING' },
      take: 10,
      include: { webhook: true },
    });

    for (const delivery of pending) {
      if (!delivery.webhook.active) {
        await prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: { status: 'FAILED', response: 'Webhook disabled' },
        });
        continue;
      }

      await this.deliverWebhook(delivery);
    }
  }

  /**
   * AIDEV-NOTE: Deliver a webhook
   */
  private async deliverWebhook(delivery: any): Promise<void> {
    const webhook = delivery.webhook;

    // Generate signature
    const signature = this.generateSignature(
      delivery.payload,
      webhook.secret,
    );

    try {
      const response = await axios.post(webhook.url, JSON.parse(delivery.payload), {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': delivery.event,
          'X-Webhook-Delivery-Id': delivery.id,
        },
        timeout: 10000, // 10 second timeout
      });

      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'SENT',
          attempts: delivery.attempts + 1,
          response: JSON.stringify({ status: response.status }),
          deliveredAt: new Date(),
        },
      });

      // Update webhook last used
      await prisma.webhook.update({
        where: { id: webhook.id },
        data: { lastUsedAt: new Date() },
      });
    } catch (error: any) {
      const newAttempts = delivery.attempts + 1;

      if (newAttempts >= this.MAX_RETRIES) {
        // Mark as failed
        await prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status: 'FAILED',
            attempts: newAttempts,
            response: error.message,
          },
        });
      } else {
        // Schedule retry
        await prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            attempts: newAttempts,
            status: 'PENDING',
          },
        });

        // In production, schedule retry with delay
        // For now, just update status
      }
    }
  }

  /**
   * AIDEV-NOTE: Generate HMAC signature for webhook
   */
  private generateSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * AIDEV-NOTE: Verify webhook signature (for testing)
   */
  verifySignature(payload: string, secret: string, signature: string): boolean {
    const expected = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature),
    );
  }

  /**
   * AIDEV-NOTE: Get webhook delivery history
   */
  async getDeliveryHistory(
    webhookId: string,
    limit: number = 50,
  ): Promise<any[]> {
    return prisma.webhookDelivery.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
