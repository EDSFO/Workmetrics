import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// AIDEV-NOTE: Integration types
export const INTEGRATION_TYPES = {
  SLACK: 'slack',
  JIRA: 'jira',
  LINEAR: 'linear',
} as const;

export type IntegrationType = typeof INTEGRATION_TYPES[keyof typeof INTEGRATION_TYPES];

@Injectable()
export class IntegrationsService {
  // ============================================
  // SLACK INTEGRATION
  // ============================================

  /**
   * AIDEV-NOTE: Connect Slack workspace
   */
  async connectSlack(teamId: string, accessToken: string): Promise<any> {
    try {
      // Verify token by fetching workspace info
      const response = await axios.get('https://slack.com/api/team.info', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.data.ok) {
        return { success: false, error: 'Invalid Slack token' };
      }

      const workspace = response.data.team;

      // Store integration (simplified - in production store encrypted tokens)
      const integration = await prisma.integration.create({
        data: {
          teamId,
          type: INTEGRATION_TYPES.SLACK,
          config: {
            accessToken,
            workspaceId: workspace.id,
            workspaceName: workspace.name,
          },
          active: true,
        },
      });

      return {
        success: true,
        integration,
        workspaceName: workspace.name,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * AIDEV-NOTE: Send Slack notification
   */
  async sendSlackNotification(
    teamId: string,
    channel: string,
    message: {
      text?: string;
      blocks?: any[];
      attachments?: any[];
    },
  ): Promise<boolean> {
    try {
      const integration = await prisma.integration.findFirst({
        where: { teamId, type: INTEGRATION_TYPES.SLACK, active: true },
      });

      if (!integration) return false;

      const accessToken = integration.config.accessToken;

      await axios.post(
        'https://slack.com/api/chat.postMessage',
        {
          channel,
          ...message,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      return true;
    } catch {
      return false;
    }
  }

  /**
   * AIDEV-NOTE: Notify on time entry created
   */
  async notifySlackTimeEntry(
    teamId: string,
    userName: string,
    projectName: string,
    hours: number,
    description: string,
  ): Promise<boolean> {
    const integration = await prisma.integration.findFirst({
      where: { teamId, type: INTEGRATION_TYPES.SLACK, active: true },
    });

    if (!integration?.config.defaultChannel) return false;

    return this.sendSlackNotification(teamId, integration.config.defaultChannel, {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `⏱️ *Time Entry Logged*\n*${userName}* logged *${hours.toFixed(1)}h* on *${projectName}*`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: description || '_No description_',
          },
        },
      ],
    });
  }

  // ============================================
  // JIRA INTEGRATION
  // ============================================

  /**
   * AIDEV-NOTE: Connect Jira workspace
   */
  async connectJira(
    teamId: string,
    domain: string,
    email: string,
    apiToken: string,
  ): Promise<any> {
    try {
      // Verify credentials by fetching projects
      const response = await axios.get(`https://${domain}/rest/api/3/project`, {
        headers: {
          Authorization: `Basic ${Buffer.from(`${email}:${apiToken}`).toString('base64')}`,
          Accept: 'application/json',
        },
      });

      if (response.status !== 200) {
        return { success: false, error: 'Invalid Jira credentials' };
      }

      const projects = response.data.map((p: any) => ({
        id: p.id,
        key: p.key,
        name: p.name,
      }));

      const integration = await prisma.integration.create({
        data: {
          teamId,
          type: INTEGRATION_TYPES.JIRA,
          config: { domain, email, projects },
          active: true,
        },
      });

      return { success: true, integration, projects };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * AIDEV-NOTE: Link time entry to Jira issue
   */
  async linkTimeEntryToJiraIssue(
    teamId: string,
    issueKey: string,
    timeEntryId: string,
    seconds: number,
    description: string,
  ): Promise<boolean> {
    try {
      const integration = await prisma.integration.findFirst({
        where: { teamId, type: INTEGRATION_TYPES.JIRA, active: true },
      });

      if (!integration) return false;

      const { domain, email } = integration.config;
      const apiToken = integration.config.apiToken; // Would need to store securely

      // Add worklog to Jira issue
      await axios.post(
        `https://${domain}/rest/api/3/issue/${issueKey}/worklog`,
        {
          timeSpentSeconds: seconds,
          comment: description,
        },
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${email}:${apiToken}`).toString('base64')}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
      );

      // Store link in database
      await prisma.integrationLink.create({
        data: {
          integrationId: integration.id,
          externalId: issueKey,
          timeEntryId,
        },
      });

      return true;
    } catch {
      return false;
    }
  }

  // ============================================
  // LINEAR INTEGRATION
  // ============================================

  /**
   * AIDEV-NOTE: Connect Linear workspace
   */
  async connectLinear(teamId: string, apiKey: string): Promise<any> {
    try {
      // Verify key by fetching workspaces
      const response = await axios.post(
        'https://api.linear.app/graphql',
        {
          query: `{ viewer { id name email } teams { nodes { id name key } } }`,
        },
        {
          headers: {
            Authorization: `${apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data.errors) {
        return { success: false, error: 'Invalid Linear API key' };
      }

      const { viewer, teams } = response.data.data;

      const integration = await prisma.integration.create({
        data: {
          teamId,
          type: INTEGRATION_TYPES.LINEAR,
          config: {
            apiKey,
            userId: viewer.id,
            userName: viewer.name,
            teams: teams.nodes,
          },
          active: true,
        },
      });

      return { success: true, integration, teams: teams.nodes };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * AIDEV-NOTE: Link time entry to Linear issue
   */
  async linkTimeEntryToLinearIssue(
    teamId: string,
    issueId: string,
    timeEntryId: string,
    seconds: number,
    description: string,
  ): Promise<boolean> {
    try {
      const integration = await prisma.integration.findFirst({
        where: { teamId, type: INTEGRATION_TYPES.LINEAR, active: true },
      });

      if (!integration) return false;

      // Add time to Linear issue via GraphQL
      await axios.post(
        'https://api.linear.app/graphql',
        {
          query: `
            mutation LogTime($issueId: UUID!, $seconds: Int!, $description: String) {
              workLog(
                issueId: $issueId
                seconds: $seconds
                description: $description
              ) {
                success
              }
            }
          `,
          variables: {
            issueId,
            seconds,
            description,
          },
        },
        {
          headers: {
            Authorization: integration.config.apiKey,
            'Content-Type': 'application/json',
          },
        },
      );

      // Store link
      await prisma.integrationLink.create({
        data: {
          integrationId: integration.id,
          externalId: issueId,
          timeEntryId,
        },
      });

      return true;
    } catch {
      return false;
    }
  }

  // ============================================
  // COMMON
  // ============================================

  /**
   * AIDEV-NOTE: List integrations for team
   */
  async listIntegrations(teamId: string): Promise<any[]> {
    return prisma.integration.findMany({
      where: { teamId, active: true },
      select: {
        id: true,
        type: true,
        config: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });
  }

  /**
   * AIDEV-NOTE: Disconnect integration
   */
  async disconnect(teamId: string, integrationId: string): Promise<boolean> {
    try {
      await prisma.integration.update({
        where: { id: integrationId, teamId },
        data: { active: false },
      });
      return true;
    } catch {
      return false;
    }
  }
}
