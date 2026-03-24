"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationsService = exports.INTEGRATION_TYPES = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const axios_1 = require("axios");
const prisma = new client_1.PrismaClient();
exports.INTEGRATION_TYPES = {
    SLACK: 'slack',
    JIRA: 'jira',
    LINEAR: 'linear',
};
let IntegrationsService = class IntegrationsService {
    async connectSlack(teamId, accessToken) {
        try {
            const response = await axios_1.default.get('https://slack.com/api/team.info', {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!response.data.ok) {
                return { success: false, error: 'Invalid Slack token' };
            }
            const workspace = response.data.team;
            const integration = await prisma.integration.create({
                data: {
                    teamId,
                    type: exports.INTEGRATION_TYPES.SLACK,
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
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async sendSlackNotification(teamId, channel, message) {
        try {
            const integration = await prisma.integration.findFirst({
                where: { teamId, type: exports.INTEGRATION_TYPES.SLACK, active: true },
            });
            if (!integration)
                return false;
            const accessToken = integration.config.accessToken;
            await axios_1.default.post('https://slack.com/api/chat.postMessage', {
                channel,
                ...message,
            }, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            return true;
        }
        catch {
            return false;
        }
    }
    async notifySlackTimeEntry(teamId, userName, projectName, hours, description) {
        const integration = await prisma.integration.findFirst({
            where: { teamId, type: exports.INTEGRATION_TYPES.SLACK, active: true },
        });
        if (!integration?.config.defaultChannel)
            return false;
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
    async connectJira(teamId, domain, email, apiToken) {
        try {
            const response = await axios_1.default.get(`https://${domain}/rest/api/3/project`, {
                headers: {
                    Authorization: `Basic ${Buffer.from(`${email}:${apiToken}`).toString('base64')}`,
                    Accept: 'application/json',
                },
            });
            if (response.status !== 200) {
                return { success: false, error: 'Invalid Jira credentials' };
            }
            const projects = response.data.map((p) => ({
                id: p.id,
                key: p.key,
                name: p.name,
            }));
            const integration = await prisma.integration.create({
                data: {
                    teamId,
                    type: exports.INTEGRATION_TYPES.JIRA,
                    config: { domain, email, projects },
                    active: true,
                },
            });
            return { success: true, integration, projects };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async linkTimeEntryToJiraIssue(teamId, issueKey, timeEntryId, seconds, description) {
        try {
            const integration = await prisma.integration.findFirst({
                where: { teamId, type: exports.INTEGRATION_TYPES.JIRA, active: true },
            });
            if (!integration)
                return false;
            const { domain, email } = integration.config;
            const apiToken = integration.config.apiToken;
            await axios_1.default.post(`https://${domain}/rest/api/3/issue/${issueKey}/worklog`, {
                timeSpentSeconds: seconds,
                comment: description,
            }, {
                headers: {
                    Authorization: `Basic ${Buffer.from(`${email}:${apiToken}`).toString('base64')}`,
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
            });
            await prisma.integrationLink.create({
                data: {
                    integrationId: integration.id,
                    externalId: issueKey,
                    timeEntryId,
                },
            });
            return true;
        }
        catch {
            return false;
        }
    }
    async connectLinear(teamId, apiKey) {
        try {
            const response = await axios_1.default.post('https://api.linear.app/graphql', {
                query: `{ viewer { id name email } teams { nodes { id name key } } }`,
            }, {
                headers: {
                    Authorization: `${apiKey}`,
                    'Content-Type': 'application/json',
                },
            });
            if (response.data.errors) {
                return { success: false, error: 'Invalid Linear API key' };
            }
            const { viewer, teams } = response.data.data;
            const integration = await prisma.integration.create({
                data: {
                    teamId,
                    type: exports.INTEGRATION_TYPES.LINEAR,
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
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async linkTimeEntryToLinearIssue(teamId, issueId, timeEntryId, seconds, description) {
        try {
            const integration = await prisma.integration.findFirst({
                where: { teamId, type: exports.INTEGRATION_TYPES.LINEAR, active: true },
            });
            if (!integration)
                return false;
            await axios_1.default.post('https://api.linear.app/graphql', {
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
            }, {
                headers: {
                    Authorization: integration.config.apiKey,
                    'Content-Type': 'application/json',
                },
            });
            await prisma.integrationLink.create({
                data: {
                    integrationId: integration.id,
                    externalId: issueId,
                    timeEntryId,
                },
            });
            return true;
        }
        catch {
            return false;
        }
    }
    async listIntegrations(teamId) {
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
    async disconnect(teamId, integrationId) {
        try {
            await prisma.integration.update({
                where: { id: integrationId, teamId },
                data: { active: false },
            });
            return true;
        }
        catch {
            return false;
        }
    }
};
exports.IntegrationsService = IntegrationsService;
exports.IntegrationsService = IntegrationsService = __decorate([
    (0, common_1.Injectable)()
], IntegrationsService);
//# sourceMappingURL=integrations.service.js.map