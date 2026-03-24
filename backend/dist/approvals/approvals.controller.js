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
exports.ApprovalsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/roles/roles.decorator");
const role_enum_1 = require("../auth/roles/role.enum");
const approvals_service_1 = require("./approvals.service");
let ApprovalsController = class ApprovalsController {
    constructor(approvalsService) {
        this.approvalsService = approvalsService;
    }
    async submitTimesheet(req, body) {
        return this.approvalsService.submitTimesheet(req.user.id, new Date(body.periodStart), new Date(body.periodEnd));
    }
    async getPendingApprovals(req) {
        return this.approvalsService.getPendingApprovals(req.user.id, req.user.role, req.user.teamId);
    }
    async approveEntries(req, body) {
        return this.approvalsService.approveEntries(req.user.id, body.userId, body.entryIds, body.comments);
    }
    async rejectEntries(req, body) {
        return this.approvalsService.rejectEntries(req.user.id, body.userId, body.entryIds, body.reason);
    }
    async getHistory(req, limit) {
        return this.approvalsService.getApprovalHistory(req.user.id, limit ? parseInt(limit, 10) : 50);
    }
    async getPendingCount(req) {
        const count = await this.approvalsService.getPendingCount(req.user.id);
        return { count };
    }
};
exports.ApprovalsController = ApprovalsController;
__decorate([
    (0, common_1.Post)('submit'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.MEMBER),
    (0, swagger_1.ApiOperation)({ summary: 'Submit timesheet for approval' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ApprovalsController.prototype, "submitTimesheet", null);
__decorate([
    (0, common_1.Get)('pending'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Get pending approvals for team' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ApprovalsController.prototype, "getPendingApprovals", null);
__decorate([
    (0, common_1.Post)('approve'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Approve time entries' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ApprovalsController.prototype, "approveEntries", null);
__decorate([
    (0, common_1.Post)('reject'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Reject time entries' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ApprovalsController.prototype, "rejectEntries", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.MEMBER),
    (0, swagger_1.ApiOperation)({ summary: 'Get approval history for current user' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ApprovalsController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Get)('pending/count'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.MEMBER),
    (0, swagger_1.ApiOperation)({ summary: 'Get pending entries count for current user' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ApprovalsController.prototype, "getPendingCount", null);
exports.ApprovalsController = ApprovalsController = __decorate([
    (0, swagger_1.ApiTags)('approvals'),
    (0, common_1.Controller)('approvals'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [approvals_service_1.ApprovalsService])
], ApprovalsController);
//# sourceMappingURL=approvals.controller.js.map