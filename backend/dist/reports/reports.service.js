"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
let ReportsService = class ReportsService {
    async getUserIdsByRole(user) {
        if (user.role === 'ADMIN') {
            const allUsers = await prisma.user.findMany({ select: { id: true } });
            return allUsers.map(u => u.id);
        }
        else if (user.role === 'MANAGER' && user.teamId) {
            const teamUsers = await prisma.user.findMany({
                where: { teamId: user.teamId },
                select: { id: true },
            });
            return teamUsers.map(u => u.id);
        }
        else {
            return [user.id];
        }
    }
    buildWhereClause(filters, allowedUserIds) {
        const where = {
            userId: { in: allowedUserIds },
            endTime: { not: null },
        };
        if (filters.startDate) {
            where.startTime = { ...where.startTime, gte: filters.startDate };
        }
        if (filters.endDate) {
            where.startTime = { ...where.startTime, lte: filters.endDate };
        }
        if (filters.projectIds && filters.projectIds.length > 0) {
            where.projectId = { in: filters.projectIds };
        }
        if (filters.taskIds && filters.taskIds.length > 0) {
            where.taskId = { in: filters.taskIds };
        }
        if (filters.billable !== undefined) {
            where.billable = filters.billable;
        }
        if (filters.status) {
            where.status = filters.status;
        }
        if (filters.type) {
            where.type = filters.type;
        }
        return where;
    }
    async getTimeEntries(user, filters) {
        const allowedUserIds = await this.getUserIdsByRole(user);
        const where = this.buildWhereClause(filters, allowedUserIds);
        const entries = await prisma.timeEntry.findMany({
            where,
            include: {
                project: true,
                task: true,
                user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { startTime: 'desc' },
        });
        return entries.map(entry => ({
            id: entry.id,
            date: new Date(entry.startTime).toISOString().split('T')[0],
            startTime: entry.startTime.toISOString(),
            endTime: entry.endTime?.toISOString() || null,
            duration: entry.duration,
            projectName: entry.project?.name || 'No Project',
            taskName: entry.task?.name || 'No Task',
            description: entry.description,
            userName: entry.user.name,
            userEmail: entry.user.email,
            billable: entry.billable,
        }));
    }
    async getSummaryByProject(user, filters) {
        const allowedUserIds = await this.getUserIdsByRole(user);
        const where = this.buildWhereClause(filters, allowedUserIds);
        const entries = await prisma.timeEntry.findMany({
            where,
            include: { project: true },
        });
        const summaryMap = new Map();
        for (const entry of entries) {
            const projectId = entry.projectId || 'no-project';
            if (!summaryMap.has(projectId)) {
                summaryMap.set(projectId, {
                    projectId,
                    projectName: entry.project?.name || 'No Project',
                    totalSeconds: 0,
                    totalBillable: 0,
                    entryCount: 0,
                });
            }
            const summary = summaryMap.get(projectId);
            summary.totalSeconds += entry.duration || 0;
            summary.entryCount += 1;
            if (entry.billable) {
                summary.totalBillable += entry.duration || 0;
            }
        }
        return Array.from(summaryMap.values()).sort((a, b) => b.totalSeconds - a.totalSeconds);
    }
    async getSummaryByDay(user, filters) {
        const allowedUserIds = await this.getUserIdsByRole(user);
        const where = this.buildWhereClause(filters, allowedUserIds);
        const entries = await prisma.timeEntry.findMany({
            where,
        });
        const summaryMap = new Map();
        for (const entry of entries) {
            const date = new Date(entry.startTime).toISOString().split('T')[0];
            if (!summaryMap.has(date)) {
                summaryMap.set(date, {
                    date,
                    totalSeconds: 0,
                    billableSeconds: 0,
                    entryCount: 0,
                });
            }
            const summary = summaryMap.get(date);
            summary.totalSeconds += entry.duration || 0;
            summary.entryCount += 1;
            if (entry.billable) {
                summary.billableSeconds += entry.duration || 0;
            }
        }
        return Array.from(summaryMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    }
    async getSummaryByUser(user, filters) {
        const allowedUserIds = await this.getUserIdsByRole(user);
        const where = this.buildWhereClause(filters, allowedUserIds);
        const entries = await prisma.timeEntry.findMany({
            where,
            include: { user: { select: { id: true, name: true } } },
        });
        const summaryMap = new Map();
        for (const entry of entries) {
            if (!summaryMap.has(entry.userId)) {
                summaryMap.set(entry.userId, {
                    userId: entry.userId,
                    userName: entry.user.name,
                    totalSeconds: 0,
                    totalBillable: 0,
                    entryCount: 0,
                });
            }
            const summary = summaryMap.get(entry.userId);
            summary.totalSeconds += entry.duration || 0;
            summary.entryCount += 1;
            if (entry.billable) {
                summary.totalBillable += entry.duration || 0;
            }
        }
        return Array.from(summaryMap.values()).sort((a, b) => b.totalSeconds - a.totalSeconds);
    }
    async getDashboard(user) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        const weekStart = new Date();
        const day = weekStart.getDay();
        const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
        weekStart.setDate(diff);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        const userIds = await this.getUserIdsByRole(user);
        const todayEntries = await prisma.timeEntry.findMany({
            where: {
                userId: { in: userIds },
                startTime: { gte: todayStart, lte: todayEnd },
                endTime: { not: null },
            },
        });
        const todayTotal = todayEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
        const weekEntries = await prisma.timeEntry.findMany({
            where: {
                userId: { in: userIds },
                startTime: { gte: weekStart, lte: weekEnd },
                endTime: { not: null },
            },
        });
        const weekTotal = weekEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
        const activeTimer = await prisma.timeEntry.findFirst({
            where: {
                userId: user.id,
                endTime: null,
            },
            include: { project: true, task: true },
        });
        const recentEntries = await prisma.timeEntry.findMany({
            where: {
                userId: user.id,
                endTime: { not: null },
            },
            include: { project: true, task: true },
            orderBy: { startTime: 'desc' },
            take: 5,
        });
        return {
            todayTotal,
            weekTotal,
            activeTimer,
            recentEntries,
        };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)()
], ReportsService);
//# sourceMappingURL=reports.service.js.map