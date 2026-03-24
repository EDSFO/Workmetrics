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
exports.TimeEntriesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/roles/roles.decorator");
const role_enum_1 = require("../auth/roles/role.enum");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
let TimeEntriesController = class TimeEntriesController {
    async start(startDto, req) {
        const existingEntry = await prisma.timeEntry.findFirst({
            where: {
                userId: req.user.id,
                endTime: null,
            },
        });
        if (existingEntry) {
            const entry = await prisma.timeEntry.findUnique({
                where: { id: existingEntry.id },
                include: { project: true, task: true },
            });
            return {
                timeEntry: entry,
                expiresIn: null,
                message: 'Already have an active timer',
            };
        }
        const entry = await prisma.timeEntry.create({
            data: {
                userId: req.user.id,
                projectId: startDto.projectId || null,
                taskId: startDto.taskId || null,
                startTime: new Date(),
                endTime: null,
                duration: null,
                description: startDto.description || null,
                billable: true,
            },
            include: { project: true, task: true },
        });
        return { timeEntry: entry, expiresIn: null };
    }
    async stop(stopDto, req) {
        const existingEntry = await prisma.timeEntry.findUnique({
            where: { id: stopDto.id },
        });
        if (!existingEntry) {
            return { error: 'Time entry not found' };
        }
        if (existingEntry.userId !== req.user.id) {
            return { error: 'Not authorized to stop this time entry' };
        }
        const endTime = new Date();
        const startTime = new Date(existingEntry.startTime);
        const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
        const entry = await prisma.timeEntry.update({
            where: { id: stopDto.id },
            data: {
                endTime,
                duration,
            },
            include: { project: true, task: true },
        });
        return { timeEntry: entry };
    }
    async getActive(req) {
        const entry = await prisma.timeEntry.findFirst({
            where: {
                userId: req.user.id,
                endTime: null,
            },
            include: { project: true, task: true },
        });
        return { timeEntry: entry };
    }
    async findAll(req) {
        if (req.user.role === role_enum_1.Role.ADMIN) {
            const entries = await prisma.timeEntry.findMany({
                include: { user: { select: { id: true, name: true, email: true } }, project: true, task: true },
            });
            return { timeEntries: entries };
        }
        if (req.user.role === role_enum_1.Role.MANAGER && req.user.teamId) {
            const teamUserIds = await prisma.user.findMany({
                where: { teamId: req.user.teamId },
                select: { id: true },
            });
            const userIds = teamUserIds.map(u => u.id);
            const entries = await prisma.timeEntry.findMany({
                where: { userId: { in: userIds } },
                include: { user: { select: { id: true, name: true, email: true } }, project: true, task: true },
            });
            return { timeEntries: entries };
        }
        const entries = await prisma.timeEntry.findMany({
            where: { userId: req.user.id },
            include: { project: true, task: true },
        });
        return { timeEntries: entries };
    }
    async create(createDto, req) {
        if (!createDto.startTime || !createDto.endTime) {
            return { error: 'Both startTime and endTime are required for manual entry' };
        }
        const startTime = new Date(createDto.startTime);
        const endTime = new Date(createDto.endTime);
        if (endTime <= startTime) {
            return { error: 'endTime must be after startTime' };
        }
        const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
        const overlappingEntries = await prisma.timeEntry.findMany({
            where: {
                userId: req.user.id,
                OR: [
                    {
                        startTime: { lte: startTime },
                        endTime: { gte: startTime },
                    },
                    {
                        startTime: { lte: endTime },
                        endTime: { gte: endTime },
                    },
                    {
                        startTime: { gte: startTime },
                        endTime: { lte: endTime },
                    },
                ],
            },
        });
        if (overlappingEntries.length > 0) {
            return { error: 'Time entry overlaps with an existing entry' };
        }
        const entry = await prisma.timeEntry.create({
            data: {
                userId: req.user.id,
                projectId: createDto.projectId || null,
                taskId: createDto.taskId || null,
                startTime,
                endTime,
                duration,
                description: createDto.description || null,
                billable: createDto.billable !== false,
            },
            include: { project: true, task: true },
        });
        return { timeEntry: entry };
    }
    async clockIn(req) {
        const existingEntry = await prisma.timeEntry.findFirst({
            where: {
                userId: req.user.id,
                endTime: null,
            },
        });
        if (existingEntry) {
            return { error: 'Já existe um registro ativo. Faça clock-out primeiro.' };
        }
        const entry = await prisma.timeEntry.create({
            data: {
                userId: req.user.id,
                startTime: new Date(),
                endTime: null,
                duration: null,
                type: 'CLOCK_IN',
                description: 'Registro de entrada',
                billable: false,
            },
        });
        return { timeEntry: entry, message: 'Entrada registrada com sucesso!' };
    }
    async clockOut(req) {
        const existingEntry = await prisma.timeEntry.findFirst({
            where: {
                userId: req.user.id,
                endTime: null,
            },
        });
        if (!existingEntry) {
            return { error: 'Não há registro ativo. Faça clock-in primeiro.' };
        }
        const endTime = new Date();
        const startTime = new Date(existingEntry.startTime);
        const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
        const entry = await prisma.timeEntry.update({
            where: { id: existingEntry.id },
            data: {
                endTime,
                duration,
                type: 'CLOCK_OUT',
            },
        });
        return { timeEntry: entry, message: 'Saída registrada com sucesso!' };
    }
    async startPause(req) {
        const existingEntry = await prisma.timeEntry.findFirst({
            where: {
                userId: req.user.id,
                endTime: null,
                type: 'CLOCK_IN',
            },
        });
        if (!existingEntry) {
            return { error: 'Não há registro de entrada ativo.' };
        }
        const onPause = await prisma.timeEntry.findFirst({
            where: {
                userId: req.user.id,
                endTime: null,
                type: 'PAUSE',
            },
        });
        if (onPause) {
            return { error: 'Você já está em pausa.' };
        }
        const entry = await prisma.timeEntry.create({
            data: {
                userId: req.user.id,
                startTime: new Date(),
                endTime: null,
                duration: null,
                type: 'PAUSE',
                description: 'Início de pausa',
                billable: false,
            },
        });
        return { timeEntry: entry, message: 'Pausa iniciada!' };
    }
    async endPause(req) {
        const pauseEntry = await prisma.timeEntry.findFirst({
            where: {
                userId: req.user.id,
                endTime: null,
                type: 'PAUSE',
            },
        });
        if (!pauseEntry) {
            return { error: 'Você não está em pausa.' };
        }
        const endTime = new Date();
        const startTime = new Date(pauseEntry.startTime);
        const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
        await prisma.timeEntry.update({
            where: { id: pauseEntry.id },
            data: {
                endTime,
                duration,
                type: 'RESUME',
            },
        });
        return { message: 'Pausa finalizada. Bom trabalho!' };
    }
    async getTodayEntries(req) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const entries = await prisma.timeEntry.findMany({
            where: {
                userId: req.user.id,
                startTime: {
                    gte: today,
                    lt: tomorrow,
                },
                type: {
                    in: ['CLOCK_IN', 'CLOCK_OUT', 'PAUSE', 'RESUME'],
                },
            },
            orderBy: { startTime: 'asc' },
        });
        let totalWorkTime = 0;
        let isWorking = false;
        let currentEntry = null;
        for (const entry of entries) {
            if (entry.type === 'CLOCK_IN') {
                isWorking = true;
            }
            else if (entry.type === 'CLOCK_OUT') {
                isWorking = false;
                totalWorkTime += entry.duration || 0;
            }
            else if (entry.type === 'PAUSE') {
                isWorking = false;
            }
            else if (entry.type === 'RESUME' && entry.duration) {
                totalWorkTime -= entry.duration;
            }
            if (entry.endTime === null) {
                currentEntry = entry;
            }
        }
        return {
            entries,
            totalWorkTime,
            isWorking,
            currentEntry,
        };
    }
    async getKioskStatus(req) {
        const activeEntry = await prisma.timeEntry.findFirst({
            where: {
                userId: req.user.id,
                endTime: null,
            },
            orderBy: { startTime: 'desc' },
        });
        if (!activeEntry) {
            return { status: 'OFF', message: 'Fora do trabalho' };
        }
        if (activeEntry.type === 'PAUSE') {
            return { status: 'PAUSE', message: 'Em pausa', entry: activeEntry };
        }
        return { status: 'WORKING', message: 'Em trabalho', entry: activeEntry };
    }
    async startAutoTrack(startDto, req) {
        const existingEntry = await prisma.timeEntry.findFirst({
            where: {
                userId: req.user.id,
                endTime: null,
                type: 'AUTO',
            },
        });
        if (existingEntry) {
            const entry = await prisma.timeEntry.findUnique({
                where: { id: existingEntry.id },
                include: { project: true, task: true },
            });
            return { timeEntry: entry, message: 'Auto tracking já está ativo', isActive: true };
        }
        const entry = await prisma.timeEntry.create({
            data: {
                userId: req.user.id,
                projectId: startDto.projectId || null,
                taskId: startDto.taskId || null,
                startTime: new Date(),
                endTime: null,
                duration: null,
                type: 'AUTO',
                description: startDto.description || 'Auto tracking ativo',
                billable: true,
            },
            include: { project: true, task: true },
        });
        return { timeEntry: entry, message: 'Auto tracking iniciado!', isActive: true };
    }
    async stopAutoTrack(req) {
        const existingEntry = await prisma.timeEntry.findFirst({
            where: {
                userId: req.user.id,
                endTime: null,
                type: 'AUTO',
            },
        });
        if (!existingEntry) {
            return { error: 'Nenhum auto tracking ativo' };
        }
        const endTime = new Date();
        const startTime = new Date(existingEntry.startTime);
        const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
        const entry = await prisma.timeEntry.update({
            where: { id: existingEntry.id },
            data: {
                endTime,
                duration,
            },
            include: { project: true, task: true },
        });
        return { timeEntry: entry, message: 'Auto tracking parado!', isActive: false };
    }
    async heartbeat(heartbeatDto, req) {
        const existingEntry = await prisma.timeEntry.findFirst({
            where: {
                userId: req.user.id,
                endTime: null,
                type: 'AUTO',
            },
        });
        if (!existingEntry) {
            return { error: 'Nenhum auto tracking ativo', isActive: false };
        }
        const entry = await prisma.timeEntry.update({
            where: { id: existingEntry.id },
            data: {
                description: heartbeatDto.activity || 'Ativo',
            },
        });
        return {
            timeEntry: entry,
            message: 'Heartbeat recebido',
            isActive: true,
            lastActivity: heartbeatDto.activity
        };
    }
    async getAutoTrackStatus(req) {
        const activeEntry = await prisma.timeEntry.findFirst({
            where: {
                userId: req.user.id,
                endTime: null,
                type: 'AUTO',
            },
            include: { project: true, task: true },
        });
        if (!activeEntry) {
            return { isActive: false, message: 'Auto tracking inativo' };
        }
        const elapsed = Math.floor((new Date().getTime() - new Date(activeEntry.startTime).getTime()) / 1000);
        return {
            isActive: true,
            timeEntry: activeEntry,
            elapsedSeconds: elapsed,
            message: 'Auto tracking ativo'
        };
    }
    async getIdleTime(req) {
        return {
            isIdle: false,
            idleTimeSeconds: 0,
            message: 'Monitorando atividade'
        };
    }
    async getPendingApprovals(req) {
        let userIds;
        if (req.user.role === role_enum_1.Role.ADMIN) {
            const allUsers = await prisma.user.findMany({ select: { id: true } });
            userIds = allUsers.map(u => u.id);
        }
        else if (req.user.teamId) {
            const teamUsers = await prisma.user.findMany({
                where: { teamId: req.user.teamId },
                select: { id: true },
            });
            userIds = teamUsers.map(u => u.id);
        }
        else {
            return { entries: [], message: 'Você não pertence a uma equipe' };
        }
        const entries = await prisma.timeEntry.findMany({
            where: {
                userId: { in: userIds },
                status: 'PENDING',
                endTime: { not: null },
                type: { in: ['TIME', 'AUTO'] },
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
                project: true,
                task: true,
            },
            orderBy: { startTime: 'desc' },
        });
        return { entries, count: entries.length };
    }
    async approveEntry(req) {
        const entryId = req.params.id;
        const entry = await prisma.timeEntry.findUnique({
            where: { id: entryId },
            include: { user: true },
        });
        if (!entry) {
            return { error: 'Entry não encontrada' };
        }
        if (req.user.role === role_enum_1.Role.MANAGER && req.user.teamId) {
            if (entry.user.teamId !== req.user.teamId) {
                return { error: 'Você não pode aprovar entries de outros times' };
            }
        }
        const updated = await prisma.timeEntry.update({
            where: { id: entryId },
            data: { status: 'APPROVED' },
            include: {
                user: { select: { id: true, name: true, email: true } },
                project: true,
            },
        });
        return { timeEntry: updated, message: 'Entry aprovada com sucesso!' };
    }
    async rejectEntry(req) {
        const entryId = req.params.id;
        const { reason } = req.body || {};
        const entry = await prisma.timeEntry.findUnique({
            where: { id: entryId },
            include: { user: true },
        });
        if (!entry) {
            return { error: 'Entry não encontrada' };
        }
        if (req.user.role === role_enum_1.Role.MANAGER && req.user.teamId) {
            if (entry.user.teamId !== req.user.teamId) {
                return { error: 'Você não pode reprovar entries de outros times' };
            }
        }
        const updated = await prisma.timeEntry.update({
            where: { id: entryId },
            data: {
                status: 'REJECTED',
                description: entry.description ? `${entry.description}\n\nMotivo: ${reason || 'Não especificado'}` : `Motivo: ${reason || 'Não especificado'}`,
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
                project: true,
            },
        });
        return { timeEntry: updated, message: 'Entry reprovada' };
    }
    async getMyEntriesWithStatus(req) {
        const entries = await prisma.timeEntry.findMany({
            where: {
                userId: req.user.id,
                endTime: { not: null },
                type: { in: ['TIME', 'AUTO'] },
            },
            include: {
                project: true,
                task: true,
            },
            orderBy: { startTime: 'desc' },
        });
        const pending = entries.filter(e => e.status === 'PENDING');
        const approved = entries.filter(e => e.status === 'APPROVED');
        const rejected = entries.filter(e => e.status === 'REJECTED');
        return {
            entries,
            summary: {
                total: entries.length,
                pending: pending.length,
                approved: approved.length,
                rejected: rejected.length,
            },
        };
    }
    async delete(id, req) {
        const entry = await prisma.timeEntry.findUnique({
            where: { id },
        });
        if (!entry) {
            return { error: 'Time entry not found' };
        }
        if (entry.userId !== req.user.id && req.user.role !== role_enum_1.Role.ADMIN) {
            return { error: 'Not authorized to delete this entry' };
        }
        await prisma.timeEntry.delete({
            where: { id },
        });
        return { success: true, message: 'Time entry deleted' };
    }
    async getWeekEntries(startDate, req) {
        const weekStart = startDate ? new Date(startDate) : new Date();
        const day = weekStart.getDay();
        const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
        weekStart.setDate(diff);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        let userIds;
        if (req.user.role === role_enum_1.Role.ADMIN) {
            const allUsers = await prisma.user.findMany({ select: { id: true } });
            userIds = allUsers.map(u => u.id);
        }
        else if (req.user.role === role_enum_1.Role.MANAGER && req.user.teamId) {
            const teamUsers = await prisma.user.findMany({
                where: { teamId: req.user.teamId },
                select: { id: true },
            });
            userIds = teamUsers.map(u => u.id);
        }
        else {
            userIds = [req.user.id];
        }
        const entries = await prisma.timeEntry.findMany({
            where: {
                userId: { in: userIds },
                OR: [
                    {
                        startTime: {
                            gte: weekStart,
                            lte: weekEnd,
                        },
                    },
                    {
                        endTime: {
                            gte: weekStart,
                            lte: weekEnd,
                        },
                    },
                    {
                        startTime: { lte: weekStart },
                        endTime: { gte: weekEnd },
                    },
                    {
                        startTime: { lte: weekEnd },
                        endTime: null,
                    },
                ],
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
                project: true,
                task: true,
            },
            orderBy: { startTime: 'asc' },
        });
        const weekTotal = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
        return { entries, weekTotal, weekStart: weekStart.toISOString(), weekEnd: weekEnd.toISOString() };
    }
};
exports.TimeEntriesController = TimeEntriesController;
__decorate([
    (0, common_1.Post)('start'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Start a new time entry (timer start)' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TimeEntriesController.prototype, "start", null);
__decorate([
    (0, common_1.Post)('stop'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Stop an active time entry (timer stop)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TimeEntriesController.prototype, "stop", null);
__decorate([
    (0, common_1.Get)('active'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Get active time entry (running timer)' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TimeEntriesController.prototype, "getActive", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.USER),
    (0, swagger_1.ApiOperation)({ summary: 'List time entries (own entries for User, team entries for Manager, all for Admin)' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TimeEntriesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new time entry (manual entry)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TimeEntriesController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('kiosk/clock-in'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Kiosk: Registrar entrada (clock in)' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TimeEntriesController.prototype, "clockIn", null);
__decorate([
    (0, common_1.Post)('kiosk/clock-out'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Kiosk: Registrar saída (clock out)' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TimeEntriesController.prototype, "clockOut", null);
__decorate([
    (0, common_1.Post)('kiosk/pause'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Kiosk: Iniciar pausa (intervalo)' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TimeEntriesController.prototype, "startPause", null);
__decorate([
    (0, common_1.Post)('kiosk/resume'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Kiosk: Retomar trabalho (fim de pausa)' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TimeEntriesController.prototype, "endPause", null);
__decorate([
    (0, common_1.Get)('kiosk/today'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Kiosk: Listar registros de hoje' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TimeEntriesController.prototype, "getTodayEntries", null);
__decorate([
    (0, common_1.Get)('kiosk/status'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Kiosk: Verificar status atual' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TimeEntriesController.prototype, "getKioskStatus", null);
__decorate([
    (0, common_1.Post)('auto/start'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Auto Tracker: Iniciar rastreamento automático' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TimeEntriesController.prototype, "startAutoTrack", null);
__decorate([
    (0, common_1.Post)('auto/stop'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Auto Tracker: Parar rastreamento automático' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TimeEntriesController.prototype, "stopAutoTrack", null);
__decorate([
    (0, common_1.Post)('auto/heartbeat'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Auto Tracker: Enviar heartbeat (atividade)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TimeEntriesController.prototype, "heartbeat", null);
__decorate([
    (0, common_1.Get)('auto/status'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Auto Tracker: Verificar status' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TimeEntriesController.prototype, "getAutoTrackStatus", null);
__decorate([
    (0, common_1.Get)('auto/idle'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Auto Tracker: Verificar tempo ocioso' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TimeEntriesController.prototype, "getIdleTime", null);
__decorate([
    (0, common_1.Get)('approvals/pending'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Approval: Listar entries pendentes de aprovação' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TimeEntriesController.prototype, "getPendingApprovals", null);
__decorate([
    (0, common_1.Post)('approvals/:id/approve'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Approval: Aprovar entry de tempo' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TimeEntriesController.prototype, "approveEntry", null);
__decorate([
    (0, common_1.Post)('approvals/:id/reject'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Approval: Reprovar entry de tempo' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TimeEntriesController.prototype, "rejectEntry", null);
__decorate([
    (0, common_1.Get)('my-entries'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Approval: Listar minhas entries com status' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TimeEntriesController.prototype, "getMyEntriesWithStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a time entry' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TimeEntriesController.prototype, "delete", null);
__decorate([
    (0, common_1.Get)('week'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Get time entries for a specific week' }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TimeEntriesController.prototype, "getWeekEntries", null);
exports.TimeEntriesController = TimeEntriesController = __decorate([
    (0, swagger_1.ApiTags)('time-entries'),
    (0, common_1.Controller)('time-entries'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)()
], TimeEntriesController);
//# sourceMappingURL=time-entries.controller.js.map