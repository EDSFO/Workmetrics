"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
let CalendarService = class CalendarService {
    async getEntriesForDateRange(userId, role, teamId, startDate, endDate, view = 'week') {
        let userIds;
        if (role === 'ADMIN') {
            const allUsers = await prisma.user.findMany({ select: { id: true } });
            userIds = allUsers.map(u => u.id);
        }
        else if (role === 'MANAGER' && teamId) {
            const teamUsers = await prisma.user.findMany({
                where: { teamId },
                select: { id: true },
            });
            userIds = teamUsers.map(u => u.id);
        }
        else {
            userIds = [userId];
        }
        const entries = await prisma.timeEntry.findMany({
            where: {
                userId: { in: userIds },
                type: { in: ['TIME', 'AUTO'] },
                OR: [
                    {
                        startTime: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                    {
                        endTime: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                    {
                        startTime: { lte: startDate },
                        endTime: { gte: endDate },
                    },
                    {
                        startTime: { lte: endDate },
                        endTime: null,
                    },
                ],
            },
            include: {
                user: { select: { id: true, name: true } },
                project: { select: { id: true, name: true } },
                task: { select: { id: true, name: true } },
            },
            orderBy: { startTime: 'asc' },
        });
        const transformedEntries = entries.map(entry => ({
            id: entry.id,
            userId: entry.userId,
            userName: entry.user.name,
            projectId: entry.projectId,
            projectName: entry.project?.name || null,
            taskId: entry.taskId,
            taskName: entry.task?.name || null,
            startTime: entry.startTime,
            endTime: entry.endTime,
            duration: entry.duration,
            description: entry.description,
            billable: entry.billable,
            type: entry.type,
            status: entry.status,
        }));
        const daysMap = new Map();
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateKey = currentDate.toISOString().split('T')[0];
            daysMap.set(dateKey, {
                date: dateKey,
                entries: [],
                totalDuration: 0,
                totalBillable: 0,
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }
        for (const entry of transformedEntries) {
            const entryDate = entry.startTime.toISOString().split('T')[0];
            const dayEntry = daysMap.get(entryDate);
            if (dayEntry) {
                dayEntry.entries.push(entry);
                dayEntry.totalDuration += entry.duration || 0;
                if (entry.billable) {
                    dayEntry.totalBillable += entry.duration || 0;
                }
            }
        }
        const days = Array.from(daysMap.values());
        const totalDuration = days.reduce((sum, day) => sum + day.totalDuration, 0);
        const totalBillable = days.reduce((sum, day) => sum + day.totalBillable, 0);
        return {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            view,
            days,
            totalDuration,
            totalBillable,
        };
    }
    async getMonthEntries(userId, role, teamId, year, month) {
        const startDate = new Date(year, month - 1, 1);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(year, month, 0);
        endDate.setHours(23, 59, 59, 999);
        return this.getEntriesForDateRange(userId, role, teamId, startDate, endDate, 'month');
    }
    async getWeekEntries(userId, role, teamId, weekStartDate) {
        const day = weekStartDate.getDay();
        const diff = weekStartDate.getDate() - day + (day === 0 ? -6 : 1);
        weekStartDate.setDate(diff);
        weekStartDate.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStartDate);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        return this.getEntriesForDateRange(userId, role, teamId, weekStartDate, weekEnd, 'week');
    }
    async getDayEntries(userId, role, teamId, date) {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        return this.getEntriesForDateRange(userId, role, teamId, startDate, endDate, 'day');
    }
    async updateEntry(entryId, userId, role, teamId, updates) {
        const entry = await prisma.timeEntry.findUnique({
            where: { id: entryId },
            include: {
                user: { select: { id: true, name: true } },
                project: { select: { id: true, name: true } },
                task: { select: { id: true, name: true } },
            },
        });
        if (!entry) {
            return { success: false, error: 'Entry not found' };
        }
        if (role !== 'ADMIN') {
            if (role === 'MANAGER') {
                if (entry.user.teamId !== teamId) {
                    return { success: false, error: 'Not authorized to update this entry' };
                }
            }
            else {
                if (entry.userId !== userId) {
                    return { success: false, error: 'Not authorized to update this entry' };
                }
            }
        }
        let duration;
        if (updates.startTime && updates.endTime) {
            duration = Math.floor((updates.endTime.getTime() - updates.startTime.getTime()) / 1000);
        }
        else if (updates.startTime && entry.endTime) {
            duration = Math.floor((entry.endTime.getTime() - updates.startTime.getTime()) / 1000);
        }
        else if (updates.endTime && entry.startTime) {
            duration = Math.floor((updates.endTime.getTime() - entry.startTime.getTime()) / 1000);
        }
        const updated = await prisma.timeEntry.update({
            where: { id: entryId },
            data: {
                startTime: updates.startTime,
                endTime: updates.endTime,
                duration,
                projectId: updates.projectId,
                taskId: updates.taskId,
                description: updates.description,
                billable: updates.billable,
            },
            include: {
                user: { select: { id: true, name: true } },
                project: { select: { id: true, name: true } },
                task: { select: { id: true, name: true } },
            },
        });
        return {
            success: true,
            entry: {
                id: updated.id,
                userId: updated.userId,
                userName: updated.user.name,
                projectId: updated.projectId,
                projectName: updated.project?.name || null,
                taskId: updated.taskId,
                taskName: updated.task?.name || null,
                startTime: updated.startTime,
                endTime: updated.endTime,
                duration: updated.duration,
                description: updated.description,
                billable: updated.billable,
                type: updated.type,
                status: updated.status,
            },
        };
    }
};
exports.CalendarService = CalendarService;
exports.CalendarService = CalendarService = __decorate([
    (0, common_1.Injectable)()
], CalendarService);
//# sourceMappingURL=calendar.service.js.map