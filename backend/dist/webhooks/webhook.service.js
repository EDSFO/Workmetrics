"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookService = exports.WEBHOOK_EVENTS = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const crypto = require("crypto");
const axios_1 = require("axios");
const prisma = new client_1.PrismaClient();
exports.WEBHOOK_EVENTS = {
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
};
let WebhookService = class WebhookService {
    constructor() {
        this.MAX_RETRIES = 3;
        this.RETRY_DELAYS = [1000, 5000, 30000];
    }
    async createWebhook(teamId, url, events) {
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
    async listWebhooks(teamId) {
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
    async deleteWebhook(webhookId, teamId) {
        const webhook = await prisma.webhook.findFirst({
            where: { id: webhookId, teamId },
        });
        if (!webhook)
            return false;
        await prisma.webhook.update({
            where: { id: webhookId },
            data: { active: false },
        });
        return true;
    }
    async triggerEvent(teamId, event, payload) {
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
    async queueDelivery(webhookId, event, payload) {
        await prisma.webhookDelivery.create({
            data: {
                webhookId,
                event,
                payload: JSON.stringify(payload),
                status: 'PENDING',
                attempts: 0,
            },
        });
        this.processDeliveryQueue();
    }
    async processDeliveryQueue() {
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
    async deliverWebhook(delivery) {
        const webhook = delivery.webhook;
        const signature = this.generateSignature(delivery.payload, webhook.secret);
        try {
            const response = await axios_1.default.post(webhook.url, JSON.parse(delivery.payload), {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Signature': signature,
                    'X-Webhook-Event': delivery.event,
                    'X-Webhook-Delivery-Id': delivery.id,
                },
                timeout: 10000,
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
            await prisma.webhook.update({
                where: { id: webhook.id },
                data: { lastUsedAt: new Date() },
            });
        }
        catch (error) {
            const newAttempts = delivery.attempts + 1;
            if (newAttempts >= this.MAX_RETRIES) {
                await prisma.webhookDelivery.update({
                    where: { id: delivery.id },
                    data: {
                        status: 'FAILED',
                        attempts: newAttempts,
                        response: error.message,
                    },
                });
            }
            else {
                await prisma.webhookDelivery.update({
                    where: { id: delivery.id },
                    data: {
                        attempts: newAttempts,
                        status: 'PENDING',
                    },
                });
            }
        }
    }
    generateSignature(payload, secret) {
        return crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');
    }
    verifySignature(payload, secret, signature) {
        const expected = this.generateSignature(payload, secret);
        return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    }
    async getDeliveryHistory(webhookId, limit = 50) {
        return prisma.webhookDelivery.findMany({
            where: { webhookId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
};
exports.WebhookService = WebhookService;
exports.WebhookService = WebhookService = __decorate([
    (0, common_1.Injectable)()
], WebhookService);
//# sourceMappingURL=webhook.service.js.map