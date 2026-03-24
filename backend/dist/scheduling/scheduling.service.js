"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulingService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
let SchedulingService = class SchedulingService {
    async createScheduledEntry(userId, dto) {
        const entry = await prisma.scheduledEntry.create({
            data: {
                userId,
                projectId: dto.projectId || null,
                taskId: dto.taskId || null,
                description: dto.description || null,
                billable: dto.billable ?? true,
                startDate: new Date(dto.startDate),
                startTime: dto.startTime,
                duration: dto.duration,
                recurring: dto.recurring ?? false,
                recurringPattern: dto.recurringPattern || null,
                recurringDays: dto.recurringDays ? JSON.stringify(dto.recurringDays) : null,
                recurringEndDate: dto.recurringEndDate ? new Date(dto.recurringEndDate) : null,
                active: true,
            },
            include: {
                project: { select: { id: true, name: true } },
                task: { select: { id: true, name: true } },
            },
        });
        return this.toResponse(entry);
    }
    async getScheduledEntries(userId) {
        const entries = await prisma.scheduledEntry.findMany({
            where: { userId, active: true },
            include: {
                project: { select: { id: true, name: true } },
                task: { select: { id: true, name: true } },
            },
            orderBy: { startDate: 'asc' },
        });
        return entries.map(entry => this.toResponse(entry));
    }
    async getUpcomingEntries(userId, startDate, endDate) {
        const scheduledEntries = await prisma.scheduledEntry.findMany({
            where: {
                userId,
                active: true,
                startDate: { lte: endDate },
                OR: [
                    { recurringEndDate: null },
                    { recurringEndDate: { gte: startDate } },
                ],
            },
            include: {
                project: { select: { id: true, name: true } },
                task: { select: { id: true, name: true } },
            },
        });
        const upcomingEntries = [];
        for (const scheduled of scheduledEntries) {
            const dates = this.generateOccurrences(new Date(scheduled.startDate), scheduled.startTime, scheduled.duration, scheduled.recurring, scheduled.recurringPattern, scheduled.recurringDays ? JSON.parse(scheduled.recurringDays) : null, scheduled.recurringEndDate ? new Date(scheduled.recurringEndDate) : null, startDate, endDate);
            for (const date of dates) {
                upcomingEntries.push({
                    id: scheduled.id,
                    scheduledEntryId: scheduled.id,
                    date: date.toISOString(),
                    startTime: scheduled.startTime,
                    duration: scheduled.duration,
                    projectId: scheduled.projectId,
                    projectName: scheduled.project?.name || null,
                    taskId: scheduled.taskId,
                    taskName: scheduled.task?.name || null,
                    description: scheduled.description,
                    billable: scheduled.billable,
                    type: 'SCHEDULED',
                });
            }
        }
        return upcomingEntries.sort((a, b) => a.date.localeCompare(b.date));
    }
    generateOccurrences(startDate, startTime, duration, recurring, pattern, days, endDate, rangeStart, rangeEnd) {
        if (!recurring || !pattern) {
            if (startDate >= rangeStart && startDate <= rangeEnd) {
                return [this.setTimeOnDate(startDate, startTime)];
            }
            return [];
        }
        const occurrences = [];
        const [hours, minutes] = startTime.split(':').map(Number);
        let current = new Date(startDate);
        current.setHours(hours, minutes, 0, 0);
        const maxIterations = 365;
        let iterations = 0;
        while (current <= rangeEnd && occurrences.length < 100) {
            iterations++;
            if (iterations > maxIterations)
                break;
            if (endDate && current > endDate)
                break;
            if (current >= rangeStart) {
                let include = true;
                if (pattern === 'WEEKLY' && days) {
                    include = days.includes(current.getDay());
                }
                if (include) {
                    occurrences.push(new Date(current));
                }
            }
            switch (pattern) {
                case 'DAILY':
                    current.setDate(current.getDate() + 1);
                    break;
                case 'WEEKLY':
                    current.setDate(current.getDate() + 1);
                    break;
                case 'MONTHLY':
                    current.setMonth(current.getMonth() + 1);
                    break;
                default:
                    current.setDate(current.getDate() + 1);
            }
        }
        return occurrences;
    }
    setTimeOnDate(date, time) {
        const [hours, minutes] = time.split(':').map(Number);
        const result = new Date(date);
        result.setHours(hours, minutes, 0, 0);
        return result;
    }
    async updateScheduledEntry(id, userId, updates) {
        const existing = await prisma.scheduledEntry.findFirst({
            where: { id, userId },
        });
        if (!existing)
            return null;
        const entry = await prisma.scheduledEntry.update({
            where: { id },
            data: {
                projectId: updates.projectId !== undefined ? updates.projectId || null : undefined,
                taskId: updates.taskId !== undefined ? updates.taskId || null : undefined,
                description: updates.description !== undefined ? updates.description || null : undefined,
                billable: updates.billable !== undefined ? updates.billable : undefined,
                startDate: updates.startDate ? new Date(updates.startDate) : undefined,
                startTime: updates.startTime,
                duration: updates.duration,
                recurring: updates.recurring,
                recurringPattern: updates.recurringPattern,
                recurringDays: updates.recurringDays ? JSON.stringify(updates.recurringDays) : undefined,
                recurringEndDate: updates.recurringEndDate ? new Date(updates.recurringEndDate) : undefined,
            },
            include: {
                project: { select: { id: true, name: true } },
                task: { select: { id: true, name: true } },
            },
        });
        return this.toResponse(entry);
    }
    async deleteScheduledEntry(id, userId) {
        const existing = await prisma.scheduledEntry.findFirst({
            where: { id, userId },
        });
        if (!existing)
            return false;
        await prisma.scheduledEntry.update({
            where: { id },
            data: { active: false },
        });
        return true;
    }
    toResponse(entry) {
        return {
            id: entry.id,
            userId: entry.userId,
            projectId: entry.projectId,
            projectName: entry.project?.name || null,
            taskId: entry.taskId,
            taskName: entry.task?.name || null,
            description: entry.description,
            billable: entry.billable,
            startDate: entry.startDate.toISOString().split('T')[0],
            startTime: entry.startTime,
            duration: entry.duration,
            recurring: entry.recurring,
            recurringPattern: entry.recurringPattern,
            recurringDays: entry.recurringDays ? JSON.parse(entry.recurringDays) : null,
            recurringEndDate: entry.recurringEndDate ? entry.recurringEndDate.toISOString().split('T')[0] : null,
            active: entry.active,
        };
    }
};
exports.SchedulingService = SchedulingService;
exports.SchedulingService = SchedulingService = __decorate([
    (0, common_1.Injectable)()
], SchedulingService);
//# sourceMappingURL=scheduling.service.js.map