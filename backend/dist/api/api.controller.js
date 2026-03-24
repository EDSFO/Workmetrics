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
exports.ApiController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const api_auth_guard_1 = require("./api-auth.guard");
const api_auth_guard_2 = require("./api-auth.guard");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
let ApiController = class ApiController {
    constructor(apiKeyService) {
        this.apiKeyService = apiKeyService;
    }
    async getMe(req) {
        return {
            teamId: req.apiKey.teamId,
            permissions: req.apiKey.permissions,
        };
    }
    async listTimeEntries(req, startDate, endDate, userId, projectId) {
        const where = { teamId: req.apiKey.teamId };
        if (startDate)
            where.startTime = { gte: new Date(startDate) };
        if (endDate)
            where.endTime = { lte: new Date(endDate) };
        if (userId)
            where.userId = userId;
        if (projectId)
            where.projectId = projectId;
        const entries = await prisma.timeEntry.findMany({
            where,
            include: {
                project: true,
                task: true,
                user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { startTime: 'desc' },
            take: 1000,
        });
        return { entries };
    }
    async createTimeEntry(req, body) {
        const user = await prisma.user.findFirst({
            where: { id: body.userId, teamId: req.apiKey.teamId },
        });
        if (!user) {
            return { error: 'User not found in team' };
        }
        const entry = await prisma.timeEntry.create({
            data: {
                userId: body.userId,
                projectId: body.projectId || null,
                taskId: body.taskId || null,
                startTime: new Date(body.startTime),
                endTime: body.endTime ? new Date(body.endTime) : null,
                duration: body.duration || null,
                description: body.description || null,
                billable: body.billable ?? true,
                type: 'TIME',
                status: 'APPROVED',
            },
            include: {
                project: true,
                task: true,
            },
        });
        return { entry };
    }
    async updateTimeEntry(id, req, updates) {
        const existing = await prisma.timeEntry.findFirst({
            where: { id, user: { teamId: req.apiKey.teamId } },
        });
        if (!existing) {
            return { error: 'Time entry not found' };
        }
        const entry = await prisma.timeEntry.update({
            where: { id },
            data: {
                projectId: updates.projectId,
                taskId: updates.taskId,
                startTime: updates.startTime ? new Date(updates.startTime) : undefined,
                endTime: updates.endTime ? new Date(updates.endTime) : undefined,
                duration: updates.duration,
                description: updates.description,
                billable: updates.billable,
            },
            include: {
                project: true,
                task: true,
            },
        });
        return { entry };
    }
    async listProjects(req) {
        const projects = await prisma.project.findMany({
            where: { teamId: req.apiKey.teamId, archived: false },
            include: {
                tasks: true,
                _count: { select: { timeEntries: true } },
            },
        });
        return { projects };
    }
    async createProject(req, body) {
        const project = await prisma.project.create({
            data: {
                name: body.name,
                description: body.description,
                teamId: req.apiKey.teamId,
                budgetHours: body.budgetHours,
            },
        });
        return { project };
    }
    async listTasks(req, projectId) {
        const where = { project: { teamId: req.apiKey.teamId } };
        if (projectId)
            where.projectId = projectId;
        const tasks = await prisma.task.findMany({
            where,
            include: { project: true },
        });
        return { tasks };
    }
    async createTask(req, body) {
        const project = await prisma.project.findFirst({
            where: { id: body.projectId, teamId: req.apiKey.teamId },
        });
        if (!project) {
            return { error: 'Project not found in team' };
        }
        const task = await prisma.task.create({
            data: {
                projectId: body.projectId,
                name: body.name,
                estimatedHours: body.estimatedHours,
            },
        });
        return { task };
    }
    async listUsers(req) {
        const users = await prisma.user.findMany({
            where: { teamId: req.apiKey.teamId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                hourlyRate: true,
                createdAt: true,
            },
        });
        return { users };
    }
    async getReport(req, startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        const entries = await prisma.timeEntry.findMany({
            where: {
                user: { teamId: req.apiKey.teamId },
                startTime: { gte: start },
                endTime: { lte: end },
                endTime: { not: null },
            },
            include: {
                project: true,
                user: { select: { id: true, name: true } },
            },
        });
        const byProject = {};
        for (const entry of entries) {
            const pid = entry.projectId || 'no-project';
            if (!byProject[pid]) {
                byProject[pid] = {
                    projectName: entry.project?.name || 'No Project',
                    totalSeconds: 0,
                    entryCount: 0,
                };
            }
            byProject[pid].totalSeconds += entry.duration || 0;
            byProject[pid].entryCount++;
        }
        const totalSeconds = entries.reduce((sum, e) => sum + (e.duration || 0), 0);
        return {
            startDate,
            endDate,
            totalSeconds,
            totalHours: (totalSeconds / 3600).toFixed(2),
            byProject: Object.values(byProject),
            entryCount: entries.length,
        };
    }
};
exports.ApiController = ApiController;
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current API key info' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ApiController.prototype, "getMe", null);
__decorate([
    (0, common_1.Get)('time-entries'),
    (0, swagger_1.ApiOperation)({ summary: 'List time entries' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __param(3, (0, common_1.Query)('userId')),
    __param(4, (0, common_1.Query)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ApiController.prototype, "listTimeEntries", null);
__decorate([
    (0, common_1.Post)('time-entries'),
    (0, swagger_1.ApiOperation)({ summary: 'Create time entry' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ApiController.prototype, "createTimeEntry", null);
__decorate([
    (0, common_1.Put)('time-entries/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update time entry' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ApiController.prototype, "updateTimeEntry", null);
__decorate([
    (0, common_1.Get)('projects'),
    (0, swagger_1.ApiOperation)({ summary: 'List projects' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ApiController.prototype, "listProjects", null);
__decorate([
    (0, common_1.Post)('projects'),
    (0, swagger_1.ApiOperation)({ summary: 'Create project' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ApiController.prototype, "createProject", null);
__decorate([
    (0, common_1.Get)('tasks'),
    (0, swagger_1.ApiOperation)({ summary: 'List tasks' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ApiController.prototype, "listTasks", null);
__decorate([
    (0, common_1.Post)('tasks'),
    (0, swagger_1.ApiOperation)({ summary: 'Create task' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ApiController.prototype, "createTask", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, swagger_1.ApiOperation)({ summary: 'List team users' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ApiController.prototype, "listUsers", null);
__decorate([
    (0, common_1.Get)('reports/summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Get time summary report' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ApiController.prototype, "getReport", null);
exports.ApiController = ApiController = __decorate([
    (0, swagger_1.ApiTags)('API'),
    (0, swagger_1.ApiSecurity)('ApiKeyAuth'),
    (0, common_1.Controller)('api/v1'),
    (0, common_1.UseGuards)(api_auth_guard_1.ApiKeyGuard),
    __metadata("design:paramtypes", [api_auth_guard_2.ApiKeyService])
], ApiController);
//# sourceMappingURL=api.controller.js.map