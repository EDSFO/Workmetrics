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
exports.CalendarController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/roles/roles.decorator");
const role_enum_1 = require("../auth/roles/role.enum");
const calendar_service_1 = require("./calendar.service");
let CalendarController = class CalendarController {
    constructor(calendarService) {
        this.calendarService = calendarService;
    }
    async getMonthView(year, month, req) {
        return this.calendarService.getMonthEntries(req.user.id, req.user.role, req.user.teamId, parseInt(year, 10), parseInt(month, 10));
    }
    async getWeekView(startDate, req) {
        const date = startDate ? new Date(startDate) : new Date();
        return this.calendarService.getWeekEntries(req.user.id, req.user.role, req.user.teamId, date);
    }
    async getDayView(date, req) {
        return this.calendarService.getDayEntries(req.user.id, req.user.role, req.user.teamId, new Date(date));
    }
    async getRangeView(startDate, endDate, view = 'week', req) {
        return this.calendarService.getEntriesForDateRange(req.user.id, req.user.role, req.user.teamId, new Date(startDate), new Date(endDate), view);
    }
    async updateEntry(id, updateDto, req) {
        const updates = {};
        if (updateDto.startTime)
            updates.startTime = new Date(updateDto.startTime);
        if (updateDto.endTime)
            updates.endTime = new Date(updateDto.endTime);
        if (updateDto.projectId !== undefined)
            updates.projectId = updateDto.projectId;
        if (updateDto.taskId !== undefined)
            updates.taskId = updateDto.taskId;
        if (updateDto.description !== undefined)
            updates.description = updateDto.description;
        if (updateDto.billable !== undefined)
            updates.billable = updateDto.billable;
        return this.calendarService.updateEntry(id, req.user.id, req.user.role, req.user.teamId, updates);
    }
};
exports.CalendarController = CalendarController;
__decorate([
    (0, common_1.Get)('month'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Get calendar view for a specific month' }),
    (0, swagger_1.ApiQuery)({ name: 'year', required: true, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'month', required: true, type: Number }),
    __param(0, (0, common_1.Query)('year')),
    __param(1, (0, common_1.Query)('month')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "getMonthView", null);
__decorate([
    (0, common_1.Get)('week'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Get calendar view for a specific week' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, type: String, description: 'Start date of the week (defaults to current week)' }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "getWeekView", null);
__decorate([
    (0, common_1.Get)('day'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Get calendar view for a specific day' }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: true, type: String, description: 'Date in YYYY-MM-DD format' }),
    __param(0, (0, common_1.Query)('date')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "getDayView", null);
__decorate([
    (0, common_1.Get)('range'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Get calendar view for a custom date range' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: true, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: true, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'view', required: false, enum: ['day', 'week', 'month'] }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('view')),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "getRangeView", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Update a time entry (e.g., for drag-and-drop editing)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "updateEntry", null);
exports.CalendarController = CalendarController = __decorate([
    (0, swagger_1.ApiTags)('calendar'),
    (0, common_1.Controller)('calendar'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [calendar_service_1.CalendarService])
], CalendarController);
//# sourceMappingURL=calendar.controller.js.map