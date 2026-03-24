"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/roles/roles.decorator");
const role_enum_1 = require("../auth/roles/role.enum");
const webhook_service_1 = require("./webhook.service");
let WebhookController = class WebhookController {
    constructor(webhookService) {
        this.webhookService = webhookService;
    }
    async create(req, body) {
        if (!req.user.teamId) {
            return { error: 'User is not part of a team' };
        }
        const validEvents = Object.values(webhook_service_1.WEBHOOK_EVENTS);
        const invalidEvents = body.events.filter(e => !validEvents.includes(e));
        if (invalidEvents.length > 0) {
            return { error: `Invalid events: ${invalidEvents.join(', ')}` };
        }
        const result = await this.webhookService.createWebhook(req.user.teamId, body.url, body.events);
        return {
            webhook: result.webhook,
            secret: result.secret,
            message: 'Store the secret securely - it will not be shown again',
        };
    }
    async list(req) {
        if (!req.user.teamId) {
            return { webhooks: [] };
        }
        const webhooks = await this.webhookService.listWebhooks(req.user.teamId);
        return { webhooks };
    }
    async delete(id, req) {
        if (!req.user.teamId) {
            return { error: 'User is not part of a team' };
        }
        const success = await this.webhookService.deleteWebhook(id, req.user.teamId);
        return success
            ? { message: 'Webhook deleted' }
            : { error: 'Webhook not found' };
    }
    async deliveries(id, req) {
        if (!req.user.teamId) {
            return { deliveries: [] };
        }
        const webhook = await this.webhookService.listWebhooks(req.user.teamId);
        if (!webhook.find(w => w.id === id)) {
            return { error: 'Webhook not found' };
        }
        const deliveries = await this.webhookService.getDeliveryHistory(id);
        return { deliveries };
    }
    async events() {
        return {
            events: Object.entries(webhook_service_1.WEBHOOK_EVENTS).map(([key, value]) => ({
                name: key,
                event: value,
                description: this.getEventDescription(value),
            })),
        };
    }
    getEventDescription(event) {
        const descriptions = {
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
};
exports.WebhookController = WebhookController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.OWNER),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new webhook' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.OWNER),
    (0, swagger_1.ApiOperation)({ summary: 'List webhooks' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "list", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.OWNER),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a webhook' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "delete", null);
__decorate([
    (0, common_1.Get)(':id/deliveries'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.OWNER),
    (0, swagger_1.ApiOperation)({ summary: 'Get webhook delivery history' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "deliveries", null);
__decorate([
    (0, common_1.Get)('events'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.OWNER),
    (0, swagger_1.ApiOperation)({ summary: 'Get available webhook events' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "events", null);
exports.WebhookController = WebhookController = __decorate([
    (0, swagger_1.ApiTags)('webhooks'),
    (0, common_1.Controller)('webhooks'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [webhook_service_1.WebhookService])
], WebhookController);
//# sourceMappingURL=webhook.controller.js.map