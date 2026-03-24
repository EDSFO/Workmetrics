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
exports.SchedulingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/roles/roles.decorator");
const role_enum_1 = require("../auth/roles/role.enum");
const scheduling_service_1 = require("./scheduling.service");
let SchedulingController = class SchedulingController {
    constructor(schedulingService) {
        this.schedulingService = schedulingService;
    }
    async create(req, dto) {
        return this.schedulingService.createScheduledEntry(req.user.id, dto);
    }
    async getAll(req) {
        return this.schedulingService.getScheduledEntries(req.user.id);
    }
    async getUpcoming(req, startDate, endDate) {
        const start = startDate ? new Date(startDate) : new Date();
        const end = endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        return this.schedulingService.getUpcomingEntries(req.user.id, start, end);
    }
    async update(id, req, dto) {
        return this.schedulingService.updateScheduledEntry(id, req.user.id, dto);
    }
    async delete(id, req) {
        const success = await this.schedulingService.deleteScheduledEntry(id, req.user.id);
        return { success };
    }
};
exports.SchedulingController = SchedulingController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.MEMBER),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new scheduled time entry' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SchedulingController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.MEMBER),
    (0, swagger_1.ApiOperation)({ summary: 'Get all scheduled entries' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SchedulingController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)('upcoming'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.MEMBER),
    (0, swagger_1.ApiOperation)({ summary: 'Get upcoming time entries from scheduled entries' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], SchedulingController.prototype, "getUpcoming", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.MEMBER),
    (0, swagger_1.ApiOperation)({ summary: 'Update a scheduled entry' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SchedulingController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.MEMBER),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a scheduled entry' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SchedulingController.prototype, "delete", null);
exports.SchedulingController = SchedulingController = __decorate([
    (0, swagger_1.ApiTags)('scheduling'),
    (0, common_1.Controller)('scheduling'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [scheduling_service_1.SchedulingService])
], SchedulingController);
//# sourceMappingURL=scheduling.controller.js.map