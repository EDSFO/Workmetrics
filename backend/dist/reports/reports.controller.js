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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/roles/roles.decorator");
const role_enum_1 = require("../auth/roles/role.enum");
const reports_service_1 = require("./reports.service");
const csv_export_service_1 = require("./export/csv-export.service");
const pdf_export_service_1 = require("./export/pdf-export.service");
let ReportsController = class ReportsController {
    constructor(reportsService, csvExportService, pdfExportService) {
        this.reportsService = reportsService;
        this.csvExportService = csvExportService;
        this.pdfExportService = pdfExportService;
    }
    async getDashboard(req) {
        return this.reportsService.getDashboard(req.user);
    }
    async getEntries(req, filters) {
        const reportFilters = {
            startDate: filters.startDate ? new Date(filters.startDate) : undefined,
            endDate: filters.endDate ? new Date(filters.endDate) : undefined,
            projectIds: filters.projectIds,
            taskIds: filters.taskIds,
            billable: filters.billable,
            status: filters.status,
            type: filters.type,
        };
        const entries = await this.reportsService.getTimeEntries(req.user, reportFilters);
        return {
            entries,
            totalDuration: entries.reduce((sum, e) => sum + (e.duration || 0), 0),
            billableDuration: entries.filter(e => e.billable).reduce((sum, e) => sum + (e.duration || 0), 0),
            count: entries.length,
        };
    }
    async getSummary(req, startDate, endDate) {
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        const filters = { startDate: start, endDate: end };
        const [byProject, byDay, byUser] = await Promise.all([
            this.reportsService.getSummaryByProject(req.user, filters),
            this.reportsService.getSummaryByDay(req.user, filters),
            this.reportsService.getSummaryByUser(req.user, filters),
        ]);
        const totalSeconds = byProject.reduce((sum, p) => sum + p.totalSeconds, 0);
        return {
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            totalSeconds,
            byProject,
            byDay,
            byUser,
        };
    }
    async getSummaryByProject(req, startDate, endDate) {
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return this.reportsService.getSummaryByProject(req.user, { startDate: start, endDate: end });
    }
    async getSummaryByDay(req, startDate, endDate) {
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return this.reportsService.getSummaryByDay(req.user, { startDate: start, endDate: end });
    }
    async getSummaryByUser(req, startDate, endDate) {
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return this.reportsService.getSummaryByUser(req.user, { startDate: start, endDate: end });
    }
    async getDetailed(req, startDate, endDate) {
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        const filters = { startDate: start, endDate: end };
        const entries = await this.reportsService.getTimeEntries(req.user, filters);
        const totalSeconds = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
        return {
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            totalSeconds,
            totalEntries: entries.length,
            entries,
        };
    }
    async exportCsv(req, startDate, endDate, res) {
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        const filters = { startDate: start, endDate: end };
        const entries = await this.reportsService.getTimeEntries(req.user, filters);
        const csvContent = this.csvExportService.generateCsv({
            entries,
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            includeUser: req.user.role !== 'USER',
        });
        const filename = this.csvExportService.generateFilename(start.toISOString(), end.toISOString());
        res?.setHeader('Content-Type', 'text/csv');
        res?.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res?.send(csvContent);
    }
    async exportPdf(req, startDate, endDate, res) {
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        const filters = { startDate: start, endDate: end };
        const entries = await this.reportsService.getTimeEntries(req.user, filters);
        const pdfBuffer = await this.pdfExportService.generatePdf({
            entries,
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            reportTitle: 'Time Tracking Report',
            includeUser: req.user.role !== 'USER',
        });
        const filename = this.pdfExportService.generateFilename(start.toISOString(), end.toISOString());
        res?.setHeader('Content-Type', 'application/pdf');
        res?.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res?.send(pdfBuffer);
    }
    async exportFilteredCsv(req, filters, res) {
        const reportFilters = {
            startDate: filters.startDate ? new Date(filters.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: filters.endDate ? new Date(filters.endDate) : new Date(),
            projectIds: filters.projectIds,
            taskIds: filters.taskIds,
            billable: filters.billable,
            status: filters.status,
            type: filters.type,
        };
        reportFilters.startDate?.setHours(0, 0, 0, 0);
        reportFilters.endDate?.setHours(23, 59, 59, 999);
        const entries = await this.reportsService.getTimeEntries(req.user, reportFilters);
        const csvContent = this.csvExportService.generateCsv({
            entries,
            startDate: reportFilters.startDate?.toISOString() || '',
            endDate: reportFilters.endDate?.toISOString() || '',
            includeUser: req.user.role !== 'USER',
        });
        const filename = this.csvExportService.generateFilename(reportFilters.startDate?.toISOString() || '', reportFilters.endDate?.toISOString() || '');
        res?.setHeader('Content-Type', 'text/csv');
        res?.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res?.send(csvContent);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Get dashboard summary with today hours, week total, active timer, and recent entries' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Post)('entries'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Get time entries with advanced filters' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getEntries", null);
__decorate([
    (0, common_1.Get)('summary'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Get summary report - total hours by project and by day' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, description: 'Start date (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, description: 'End date (ISO string)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('summary/by-project'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Get summary by project' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getSummaryByProject", null);
__decorate([
    (0, common_1.Get)('summary/by-day'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Get summary by day' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getSummaryByDay", null);
__decorate([
    (0, common_1.Get)('summary/by-user'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Get summary by user' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getSummaryByUser", null);
__decorate([
    (0, common_1.Get)('detailed'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Get detailed report - all time entries with details' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, description: 'Start date (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, description: 'End date (ISO string)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getDetailed", null);
__decorate([
    (0, common_1.Get)('export/csv'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Export report as CSV file' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, description: 'Start date (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, description: 'End date (ISO string)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "exportCsv", null);
__decorate([
    (0, common_1.Get)('export/pdf'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Export report as PDF file' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, description: 'Start date (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, description: 'End date (ISO string)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "exportPdf", null);
__decorate([
    (0, common_1.Post)('export/csv'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Export filtered report as CSV file' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "exportFilteredCsv", null);
exports.ReportsController = ReportsController = __decorate([
    (0, swagger_1.ApiTags)('reports'),
    (0, common_1.Controller)('reports'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [reports_service_1.ReportsService,
        csv_export_service_1.CsvExportService,
        pdf_export_service_1.PdfExportService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map