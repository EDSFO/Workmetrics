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
exports.AuditController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/roles/roles.decorator");
const role_enum_1 = require("../auth/roles/role.enum");
const audit_service_1 = require("./audit.service");
let AuditController = class AuditController {
    constructor(auditService) {
        this.auditService = auditService;
    }
    async getAuditLogs(req, action, resource, startDate, endDate, limit, offset) {
        if (!req.user.teamId) {
            return { logs: [], total: 0, error: 'User is not part of a team' };
        }
        return this.auditService.getAuditLogs({
            teamId: req.user.teamId,
            action,
            resource,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            limit: limit ? parseInt(limit, 10) : 100,
            offset: offset ? parseInt(offset, 10) : 0,
        });
    }
    async getAuditStats(req, days) {
        if (!req.user.teamId) {
            return { error: 'User is not part of a team' };
        }
        return this.auditService.getAuditStats(req.user.teamId, days ? parseInt(days, 10) : 30);
    }
    async getSecurityEvents(req, limit) {
        if (!req.user.teamId) {
            return { events: [], error: 'User is not part of a team' };
        }
        return this.auditService.getSecurityEvents(req.user.teamId, limit ? parseInt(limit, 10) : 100);
    }
    async getResourceAuditHistory(resource, resourceId, limit) {
        return this.auditService.getResourceAuditHistory(resource, resourceId, limit ? parseInt(limit, 10) : 50);
    }
    async getUserActivity(userId, limit) {
        return this.auditService.getUserActivity(userId, limit ? parseInt(limit, 10) : 50);
    }
};
exports.AuditController = AuditController;
__decorate([
    (0, common_1.Get)('logs'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.OWNER),
    (0, swagger_1.ApiOperation)({ summary: 'Get audit logs with filters' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('action')),
    __param(2, (0, common_1.Query)('resource')),
    __param(3, (0, common_1.Query)('startDate')),
    __param(4, (0, common_1.Query)('endDate')),
    __param(5, (0, common_1.Query)('limit')),
    __param(6, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "getAuditLogs", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.OWNER),
    (0, swagger_1.ApiOperation)({ summary: 'Get audit statistics' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "getAuditStats", null);
__decorate([
    (0, common_1.Get)('security'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.OWNER),
    (0, swagger_1.ApiOperation)({ summary: 'Get security events' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "getSecurityEvents", null);
__decorate([
    (0, common_1.Get)('resource/:resource/:resourceId'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.OWNER, role_enum_1.Role.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Get audit history for a specific resource' }),
    __param(0, (0, common_1.Param)('resource')),
    __param(1, (0, common_1.Param)('resourceId')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "getResourceAuditHistory", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.OWNER),
    (0, swagger_1.ApiOperation)({ summary: 'Get activity log for a specific user' }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "getUserActivity", null);
exports.AuditController = AuditController = __decorate([
    (0, swagger_1.ApiTags)('audit'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('audit'),
    __metadata("design:paramtypes", [audit_service_1.AuditService])
], AuditController);
//# sourceMappingURL=audit.controller.js.map