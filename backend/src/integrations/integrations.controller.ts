import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { Role } from '../auth/roles/role.enum';
import { IntegrationsService, INTEGRATION_TYPES } from './integrations.service';

@ApiTags('integrations')
@Controller('integrations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  // ============================================
  // SLACK
  // ============================================

  /**
   * AIDEV-NOTE: Connect Slack workspace
   */
  @Post('slack/connect')
  @Roles(Role.ADMIN, Role.OWNER)
  @ApiOperation({ summary: 'Connect Slack workspace' })
  async connectSlack(
    @Request() req: any,
    @Body() body: { accessToken: string },
  ) {
    if (!req.user.teamId) {
      return { success: false, error: 'User is not part of a team' };
    }

    return this.integrationsService.connectSlack(req.user.teamId, body.accessToken);
  }

  /**
   * AIDEV-NOTE: Test Slack notification
   */
  @Post('slack/test')
  @Roles(Role.ADMIN, Role.OWNER)
  @ApiOperation({ summary: 'Send test Slack notification' })
  async testSlack(
    @Request() req: any,
    @Body() body: { channel: string; message: string },
  ) {
    if (!req.user.teamId) {
      return { success: false };
    }

    const sent = await this.integrationsService.sendSlackNotification(
      req.user.teamId,
      body.channel,
      { text: body.message },
    );

    return { success: sent };
  }

  // ============================================
  // JIRA
  // ============================================

  /**
   * AIDEV-NOTE: Connect Jira workspace
   */
  @Post('jira/connect')
  @Roles(Role.ADMIN, Role.OWNER)
  @ApiOperation({ summary: 'Connect Jira workspace' })
  async connectJira(
    @Request() req: any,
    @Body() body: { domain: string; email: string; apiToken: string },
  ) {
    if (!req.user.teamId) {
      return { success: false, error: 'User is not part of a team' };
    }

    return this.integrationsService.connectJira(
      req.user.teamId,
      body.domain,
      body.email,
      body.apiToken,
    );
  }

  /**
   * AIDEV-NOTE: Link time entry to Jira issue
   */
  @Post('jira/link')
  @Roles(Role.ADMIN, Role.MANAGER, Role.MEMBER)
  @ApiOperation({ summary: 'Link time entry to Jira issue' })
  async linkToJira(
    @Request() req: any,
    @Body() body: { issueKey: string; timeEntryId: string; seconds: number; description: string },
  ) {
    if (!req.user.teamId) {
      return { success: false };
    }

    const linked = await this.integrationsService.linkTimeEntryToJiraIssue(
      req.user.teamId,
      body.issueKey,
      body.timeEntryId,
      body.seconds,
      body.description,
    );

    return { success: linked };
  }

  // ============================================
  // LINEAR
  // ============================================

  /**
   * AIDEV-NOTE: Connect Linear workspace
   */
  @Post('linear/connect')
  @Roles(Role.ADMIN, Role.OWNER)
  @ApiOperation({ summary: 'Connect Linear workspace' })
  async connectLinear(
    @Request() req: any,
    @Body() body: { apiKey: string },
  ) {
    if (!req.user.teamId) {
      return { success: false, error: 'User is not part of a team' };
    }

    return this.integrationsService.connectLinear(req.user.teamId, body.apiKey);
  }

  /**
   * AIDEV-NOTE: Link time entry to Linear issue
   */
  @Post('linear/link')
  @Roles(Role.ADMIN, Role.MANAGER, Role.MEMBER)
  @ApiOperation({ summary: 'Link time entry to Linear issue' })
  async linkToLinear(
    @Request() req: any,
    @Body() body: { issueId: string; timeEntryId: string; seconds: number; description: string },
  ) {
    if (!req.user.teamId) {
      return { success: false };
    }

    const linked = await this.integrationsService.linkTimeEntryToLinearIssue(
      req.user.teamId,
      body.issueId,
      body.timeEntryId,
      body.seconds,
      body.description,
    );

    return { success: linked };
  }

  // ============================================
  // COMMON
  // ============================================

  /**
   * AIDEV-NOTE: List all integrations
   */
  @Get()
  @Roles(Role.ADMIN, Role.OWNER)
  @ApiOperation({ summary: 'List all integrations' })
  async list(@Request() req: any) {
    if (!req.user.teamId) {
      return { integrations: [] };
    }

    const integrations = await this.integrationsService.listIntegrations(req.user.teamId);
    return { integrations };
  }

  /**
   * AIDEV-NOTE: Disconnect an integration
   */
  @Delete(':id')
  @Roles(Role.ADMIN, Role.OWNER)
  @ApiOperation({ summary: 'Disconnect an integration' })
  async disconnect(@Param('id') id: string, @Request() req: any) {
    if (!req.user.teamId) {
      return { success: false };
    }

    const success = await this.integrationsService.disconnect(req.user.teamId, id);
    return { success };
  }
}
