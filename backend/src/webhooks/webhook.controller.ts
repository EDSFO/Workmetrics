import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { Role } from '../auth/roles/role.enum';
import { WebhookService, WEBHOOK_EVENTS } from './webhook.service';

@ApiTags('webhooks')
@Controller('webhooks')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  /**
   * AIDEV-NOTE: Create a new webhook
   */
  @Post()
  @Roles(Role.ADMIN, Role.OWNER)
  @ApiOperation({ summary: 'Create a new webhook' })
  async create(
    @Request() req: any,
    @Body() body: { url: string; events: string[] },
  ) {
    if (!req.user.teamId) {
      return { error: 'User is not part of a team' };
    }

    // Validate events
    const validEvents = Object.values(WEBHOOK_EVENTS);
    const invalidEvents = body.events.filter(e => !validEvents.includes(e as any));
    if (invalidEvents.length > 0) {
      return { error: `Invalid events: ${invalidEvents.join(', ')}` };
    }

    const result = await this.webhookService.createWebhook(
      req.user.teamId,
      body.url,
      body.events,
    );

    return {
      webhook: result.webhook,
      secret: result.secret,
      message: 'Store the secret securely - it will not be shown again',
    };
  }

  /**
   * AIDEV-NOTE: List webhooks
   */
  @Get()
  @Roles(Role.ADMIN, Role.OWNER)
  @ApiOperation({ summary: 'List webhooks' })
  async list(@Request() req: any) {
    if (!req.user.teamId) {
      return { webhooks: [] };
    }

    const webhooks = await this.webhookService.listWebhooks(req.user.teamId);
    return { webhooks };
  }

  /**
   * AIDEV-NOTE: Delete a webhook
   */
  @Delete(':id')
  @Roles(Role.ADMIN, Role.OWNER)
  @ApiOperation({ summary: 'Delete a webhook' })
  async delete(@Param('id') id: string, @Request() req: any) {
    if (!req.user.teamId) {
      return { error: 'User is not part of a team' };
    }

    const success = await this.webhookService.deleteWebhook(id, req.user.teamId);
    return success
      ? { message: 'Webhook deleted' }
      : { error: 'Webhook not found' };
  }

  /**
   * AIDEV-NOTE: Get webhook delivery history
   */
  @Get(':id/deliveries')
  @Roles(Role.ADMIN, Role.OWNER)
  @ApiOperation({ summary: 'Get webhook delivery history' })
  async deliveries(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    if (!req.user.teamId) {
      return { deliveries: [] };
    }

    // Verify ownership
    const webhook = await this.webhookService.listWebhooks(req.user.teamId);
    if (!webhook.find(w => w.id === id)) {
      return { error: 'Webhook not found' };
    }

    const deliveries = await this.webhookService.getDeliveryHistory(id);
    return { deliveries };
  }

  /**
   * AIDEV-NOTE: Get available webhook events
   */
  @Get('events')
  @Roles(Role.ADMIN, Role.OWNER)
  @ApiOperation({ summary: 'Get available webhook events' })
  async events() {
    return {
      events: Object.entries(WEBHOOK_EVENTS).map(([key, value]) => ({
        name: key,
        event: value,
        description: this.getEventDescription(value),
      })),
    };
  }

  private getEventDescription(event: string): string {
    const descriptions: Record<string, string> = {
      'time_entry.created': 'Fired when a new time entry is created',
      'time_entry.updated': 'Fired when a time entry is updated',
      'time_entry.deleted': 'Fired when a time entry is deleted',
      'project.created': 'Fired when a new project is created',
      'project.updated': 'Fired when a project is updated',
      'project.deleted': 'Fired when a project is deleted',
      'task.created': 'Fired when a new task is created',
      'task.updated': 'Fired when a task is updated',
      'task.deleted': 'Fired when a task is deleted',
      'user.invited': 'Fired when a user is invited to a team',
      'user.joined': 'Fired when a user joins a team',
      'time_off.requested': 'Fired when a time off request is submitted',
      'time_off.approved': 'Fired when a time off request is approved',
      'time_off.rejected': 'Fired when a time off request is rejected',
    };
    return descriptions[event] || 'No description available';
  }
}
