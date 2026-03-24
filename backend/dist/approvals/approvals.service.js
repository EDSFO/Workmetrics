"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
let ApprovalsService = class ApprovalsService {
    async submitTimesheet(userId, periodStart, periodEnd) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { teamId: true },
        });
        if (!user?.teamId) {
            return { success: false, message: 'User is not part of a team' };
        }
        const entries = await prisma.timeEntry.findMany({
            where: {
                userId,
                startTime: { gte: periodStart },
                endTime: { lte: periodEnd },
                endTime: { not: null },
                type: { in: ['TIME', 'AUTO'] },
            },
            include: {
                project: { select: { name: true } },
                task: { select: { name: true } },
            },
            orderBy: { startTime: 'asc' },
        });
        if (entries.length === 0) {
            return { success: false, message: 'No entries found for this period' };
        }
        await prisma.timeEntry.updateMany({
            where: {
                userId,
                startTime: { gte: periodStart },
                endTime: { lte: periodEnd },
                id: { in: entries.map(e => e.id) },
            },
            data: { status: 'PENDING' },
        });
        return {
            success: true,
            message: `Submitted ${entries.length} entries for approval`,
        };
    }
    async getPendingApprovals(requesterId, requesterRole, requesterTeamId) {
        let userIds;
        if (requesterRole === 'ADMIN') {
            const allUsers = await prisma.user.findMany({ select: { id: true } });
            userIds = allUsers.map(u => u.id);
        }
        else if (requesterRole === 'MANAGER' && requesterTeamId) {
            const teamUsers = await prisma.user.findMany({
                where: { teamId: requesterTeamId },
                select: { id: true },
            });
            userIds = teamUsers.map(u => u.id);
        }
        else {
            return [];
        }
        const pendingEntries = await prisma.timeEntry.findMany({
            where: {
                userId: { in: userIds },
                status: 'PENDING',
                endTime: { not: null },
                type: { in: ['TIME', 'AUTO'] },
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
                project: { select: { id: true, name: true } },
                task: { select: { id: true, name: true } },
            },
            orderBy: { startTime: 'desc' },
        });
        const groupedByUser = new Map();
        for (const entry of pendingEntries) {
            const userId = entry.userId;
            if (!groupedByUser.has(userId)) {
                groupedByUser.set(userId, {
                    userId,
                    userName: entry.user.name,
                    userEmail: entry.user.email,
                    entries: [],
                    totalHours: 0,
                });
            }
            const group = groupedByUser.get(userId);
            const hours = (entry.duration || 0) / 3600;
            group.entries.push({
                id: entry.id,
                date: entry.startTime.toISOString().split('T')[0],
                projectName: entry.project?.name || 'No Project',
                taskName: entry.task?.name || 'No Task',
                hours: parseFloat(hours.toFixed(2)),
                description: entry.description,
                billable: entry.billable,
            });
            group.totalHours += hours;
        }
        return Array.from(groupedByUser.values()).map(group => ({
            ...group,
            totalHours: parseFloat(group.totalHours.toFixed(2)),
        }));
    }
    async approveEntries(approverId, targetUserId, entryIds, comments) {
        const approver = await prisma.user.findUnique({
            where: { id: approverId },
            select: { role: true, teamId: true },
        });
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { teamId: true },
        });
        if (!approver || !targetUser) {
            return { success: false, message: 'User not found' };
        }
        if (approver.role === 'MANAGER' && approver.teamId !== targetUser.teamId) {
            return { success: false, message: 'Not authorized to approve these entries' };
        }
        await prisma.timeEntry.updateMany({
            where: {
                id: { in: entryIds },
                userId: targetUserId,
                status: 'PENDING',
            },
            data: {
                status: 'APPROVED',
                description: comments
                    ? (entry) => `${entry.description || ''}\n\nApproved by: ${comments}`.trim()
                    : undefined,
            },
        });
        return {
            success: true,
            message: `${entryIds.length} entries approved`,
        };
    }
    async rejectEntries(approverId, targetUserId, entryIds, reason) {
        const approver = await prisma.user.findUnique({
            where: { id: approverId },
            select: { role: true, teamId: true },
        });
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { teamId: true },
        });
        if (!approver || !targetUser) {
            return { success: false, message: 'User not found' };
        }
        if (approver.role === 'MANAGER' && approver.teamId !== targetUser.teamId) {
            return { success: false, message: 'Not authorized to reject these entries' };
        }
        for (const entryId of entryIds) {
            const entry = await prisma.timeEntry.findUnique({ where: { id: entryId } });
            if (entry) {
                const rejectionNote = `\n\n--- Rejected ---\nReason: ${reason}`;
                await prisma.timeEntry.update({
                    where: { id: entryId },
                    data: {
                        status: 'REJECTED',
                        description: entry.description
                            ? `${entry.description}${rejectionNote}`
                            : rejectionNote,
                    },
                });
            }
        }
        return {
            success: true,
            message: `${entryIds.length} entries rejected`,
        };
    }
    async getApprovalHistory(userId, limit = 50) {
        const entries = await prisma.timeEntry.findMany({
            where: {
                userId,
                status: { in: ['APPROVED', 'REJECTED'] },
            },
            include: {
                project: { select: { name: true } },
                task: { select: { name: true } },
            },
            orderBy: { updatedAt: 'desc' },
            take: limit,
        });
        return entries.map(entry => ({
            id: entry.id,
            date: entry.startTime.toISOString().split('T')[0],
            projectName: entry.project?.name || 'No Project',
            taskName: entry.task?.name || 'No Task',
            hours: entry.duration ? parseFloat((entry.duration / 3600).toFixed(2)) : 0,
            status: entry.status,
            description: entry.description,
            updatedAt: entry.updatedAt,
        }));
    }
    async getPendingCount(userId) {
        return prisma.timeEntry.count({
            where: {
                userId,
                status: 'PENDING',
            },
        });
    }
};
exports.ApprovalsService = ApprovalsService;
exports.ApprovalsService = ApprovalsService = __decorate([
    (0, common_1.Injectable)()
], ApprovalsService);
//# sourceMappingURL=approvals.service.js.map