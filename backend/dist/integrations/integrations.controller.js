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
exports.IntegrationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/roles/roles.decorator");
const role_enum_1 = require("../auth/roles/role.enum");
const integrations_service_1 = require("./integrations.service");
let IntegrationsController = class IntegrationsController {
    constructor(integrationsService) {
        this.integrationsService = integrationsService;
    }
    async connectSlack(req, body) {
        if (!req.user.teamId) {
            return { success: false, error: 'User is not part of a team' };
        }
        return this.integrationsService.connectSlack(req.user.teamId, body.accessToken);
    }
    async testSlack(req, body) {
        if (!req.user.teamId) {
            return { success: false };
        }
        const sent = await this.integrationsService.sendSlackNotification(req.user.teamId, body.channel, { text: body.message });
        return { success: sent };
    }
    async connectJira(req, body) {
        if (!req.user.teamId) {
            return { success: false, error: 'User is not part of a team' };
        }
        return this.integrationsService.connectJira(req.user.teamId, body.domain, body.email, body.apiToken);
    }
    async linkToJira(req, body) {
        if (!req.user.teamId) {
            return { success: false };
        }
        const linked = await this.integrationsService.linkTimeEntryToJiraIssue(req.user.teamId, body.issueKey, body.timeEntryId, body.seconds, body.description);
        return { success: linked };
    }
    async connectLinear(req, body) {
        if (!req.user.teamId) {
            return { success: false, error: 'User is not part of a team' };
        }
        return this.integrationsService.connectLinear(req.user.teamId, body.apiKey);
    }
    async linkToLinear(req, body) {
        if (!req.user.teamId) {
            return { success: false };
        }
        const linked = await this.integrationsService.linkTimeEntryToLinearIssue(req.user.teamId, body.issueId, body.timeEntryId, body.seconds, body.description);
        return { success: linked };
    }
    async list(req) {
        if (!req.user.teamId) {
            return { integrations: [] };
        }
        const integrations = await this.integrationsService.listIntegrations(req.user.teamId);
        return { integrations };
    }
    async disconnect(id, req) {
        if (!req.user.teamId) {
            return { success: false };
        }
        const success = await this.integrationsService.disconnect(req.user.teamId, id);
        return { success };
    }
};
exports.IntegrationsController = IntegrationsController;
__decorate([
    (0, common_1.Post)('slack/connect'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.OWNER),
    (0, swagger_1.ApiOperation)({ summary: 'Connect Slack workspace' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "connectSlack", null);
__decorate([
    (0, common_1.Post)('slack/test'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.OWNER),
    (0, swagger_1.ApiOperation)({ summary: 'Send test Slack notification' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "testSlack", null);
__decorate([
    (0, common_1.Post)('jira/connect'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.OWNER),
    (0, swagger_1.ApiOperation)({ summary: 'Connect Jira workspace' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "connectJira", null);
__decorate([
    (0, common_1.Post)('jira/link'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.MEMBER),
    (0, swagger_1.ApiOperation)({ summary: 'Link time entry to Jira issue' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "linkToJira", null);
__decorate([
    (0, common_1.Post)('linear/connect'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.OWNER),
    (0, swagger_1.ApiOperation)({ summary: 'Connect Linear workspace' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "connectLinear", null);
__decorate([
    (0, common_1.Post)('linear/link'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.MEMBER),
    (0, swagger_1.ApiOperation)({ summary: 'Link time entry to Linear issue' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "linkToLinear", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.OWNER),
    (0, swagger_1.ApiOperation)({ summary: 'List all integrations' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "list", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.OWNER),
    (0, swagger_1.ApiOperation)({ summary: 'Disconnect an integration' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], IntegrationsController.prototype, "disconnect", null);
exports.IntegrationsController = IntegrationsController = __decorate([
    (0, swagger_1.ApiTags)('integrations'),
    (0, common_1.Controller)('integrations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [integrations_service_1.IntegrationsService])
], IntegrationsController);
//# sourceMappingURL=integrations.controller.js.map