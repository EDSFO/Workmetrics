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
exports.TimeOffController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/roles/roles.decorator");
const role_enum_1 = require("../auth/roles/role.enum");
const time_off_service_1 = require("./time-off.service");
let TimeOffController = class TimeOffController {
    constructor(timeOffService) {
        this.timeOffService = timeOffService;
    }
    async request(req, dto) {
        return this.timeOffService.requestTimeOff(req.user.id, dto);
    }
    async getMyRequests(req) {
        return this.timeOffService.getMyTimeOff(req.user.id);
    }
    async getMyBalances(req) {
        return this.timeOffService.getBalances(req.user.id);
    }
    async cancel(id, req) {
        return this.timeOffService.cancelRequest(req.user.id, id);
    }
    async getPending(req) {
        return this.timeOffService.getPendingRequests(req.user.id, req.user.role, req.user.teamId);
    }
    async approve(id, req) {
        return this.timeOffService.approveRequest(req.user.id, id);
    }
    async reject(id, body, req) {
        return this.timeOffService.rejectRequest(req.user.id, id, body.reason);
    }
    async getPolicies(req) {
        if (!req.user.teamId) {
            return [];
        }
        return this.timeOffService.getTeamPolicies(req.user.teamId);
    }
    async createPolicy(dto, req) {
        if (!req.user.teamId) {
            return { success: false, message: 'User is not part of a team' };
        }
        return this.timeOffService.createPolicy(req.user.teamId, dto);
    }
};
exports.TimeOffController = TimeOffController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.MEMBER),
    (0, swagger_1.ApiOperation)({ summary: 'Request time off' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TimeOffController.prototype, "request", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.MEMBER),
    (0, swagger_1.ApiOperation)({ summary: 'Get my time off requests' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TimeOffController.prototype, "getMyRequests", null);
__decorate([
    (0, common_1.Get)('balances'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.MEMBER),
    (0, swagger_1.ApiOperation)({ summary: 'Get my time off balances' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TimeOffController.prototype, "getMyBalances", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.MEMBER),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel time off request' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TimeOffController.prototype, "cancel", null);
__decorate([
    (0, common_1.Get)('pending'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Get pending time off requests for team' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TimeOffController.prototype, "getPending", null);
__decorate([
    (0, common_1.Put)(':id/approve'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Approve time off request' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TimeOffController.prototype, "approve", null);
__decorate([
    (0, common_1.Put)(':id/reject'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Reject time off request' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], TimeOffController.prototype, "reject", null);
__decorate([
    (0, common_1.Get)('policies'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.MEMBER),
    (0, swagger_1.ApiOperation)({ summary: 'Get team time off policies' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TimeOffController.prototype, "getPolicies", null);
__decorate([
    (0, common_1.Post)('policies'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create time off policy' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TimeOffController.prototype, "createPolicy", null);
exports.TimeOffController = TimeOffController = __decorate([
    (0, swagger_1.ApiTags)('time-off'),
    (0, common_1.Controller)('time-off'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [time_off_service_1.TimeOffService])
], TimeOffController);
//# sourceMappingURL=time-off.controller.js.map