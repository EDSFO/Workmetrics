"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeOffService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
let TimeOffService = class TimeOffService {
    async requestTimeOff(userId, dto) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { teamId: true },
        });
        if (!user?.teamId) {
            return { success: false, message: 'User is not part of a team' };
        }
        const startDate = new Date(dto.startDate);
        const endDate = new Date(dto.endDate);
        if (endDate < startDate) {
            return { success: false, message: 'End date must be after start date' };
        }
        const existing = await prisma.timeOff.findFirst({
            where: {
                userId,
                status: { in: ['PENDING', 'APPROVED'] },
                OR: [
                    {
                        startDate: { lte: endDate },
                        endDate: { gte: startDate },
                    },
                ],
            },
        });
        if (existing) {
            return { success: false, message: 'Overlapping time off request exists' };
        }
        const timeOff = await prisma.timeOff.create({
            data: {
                userId,
                type: dto.type,
                startDate,
                endDate,
                hours: dto.hours,
                notes: dto.notes || null,
                status: 'PENDING',
            },
        });
        return {
            success: true,
            timeOff,
            message: 'Time off request submitted',
        };
    }
    async getMyTimeOff(userId) {
        return prisma.timeOff.findMany({
            where: { userId },
            orderBy: { startDate: 'desc' },
        });
    }
    async getPendingRequests(requesterId, requesterRole, requesterTeamId) {
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
        return prisma.timeOff.findMany({
            where: {
                userId: { in: userIds },
                status: 'PENDING',
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { startDate: 'asc' },
        });
    }
    async approveRequest(approverId, timeOffId) {
        const timeOff = await prisma.timeOff.findUnique({
            where: { id: timeOffId },
            include: { user: true },
        });
        if (!timeOff) {
            return { success: false, message: 'Request not found' };
        }
        if (timeOff.status !== 'PENDING') {
            return { success: false, message: 'Request is not pending' };
        }
        await prisma.timeOff.update({
            where: { id: timeOffId },
            data: {
                status: 'APPROVED',
                approverId,
                approvedAt: new Date(),
            },
        });
        return { success: true, message: 'Time off approved' };
    }
    async rejectRequest(approverId, timeOffId, reason) {
        const timeOff = await prisma.timeOff.findUnique({
            where: { id: timeOffId },
        });
        if (!timeOff) {
            return { success: false, message: 'Request not found' };
        }
        if (timeOff.status !== 'PENDING') {
            return { success: false, message: 'Request is not pending' };
        }
        await prisma.timeOff.update({
            where: { id: timeOffId },
            data: {
                status: 'REJECTED',
                approverId,
                approvedAt: new Date(),
                rejectionReason: reason,
            },
        });
        return { success: true, message: 'Time off rejected' };
    }
    async cancelRequest(userId, timeOffId) {
        const timeOff = await prisma.timeOff.findFirst({
            where: { id: timeOffId, userId },
        });
        if (!timeOff) {
            return { success: false, message: 'Request not found' };
        }
        if (timeOff.status === 'APPROVED') {
            return { success: false, message: 'Cannot cancel approved request' };
        }
        await prisma.timeOff.update({
            where: { id: timeOffId },
            data: { status: 'CANCELLED' },
        });
        return { success: true, message: 'Request cancelled' };
    }
    async getBalances(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { teamId: true },
        });
        if (!user?.teamId) {
            return [];
        }
        const policies = await prisma.timeOffPolicy.findMany({
            where: { teamId: user.teamId, active: true },
        });
        const balances = [];
        for (const policy of policies) {
            const approvedTimeOff = await prisma.timeOff.findMany({
                where: {
                    userId,
                    type: policy.type,
                    status: 'APPROVED',
                },
            });
            const pendingTimeOff = await prisma.timeOff.findMany({
                where: {
                    userId,
                    type: policy.type,
                    status: 'PENDING',
                },
            });
            const usedHours = approvedTimeOff.reduce((sum, t) => sum + Number(t.hours), 0);
            const pendingHours = pendingTimeOff.reduce((sum, t) => sum + Number(t.hours), 0);
            const accruedHours = Number(policy.accrualRate) * 12;
            const maxBalance = policy.maxBalance ? Number(policy.maxBalance) : Infinity;
            balances.push({
                policyType: policy.type,
                policyName: policy.name,
                accrued: Math.min(accruedHours, maxBalance),
                used: usedHours,
                pending: pendingHours,
                available: Math.max(0, Math.min(accruedHours, maxBalance) - usedHours - pendingHours),
                isPaid: policy.isPaid,
            });
        }
        return balances;
    }
    async createPolicy(teamId, dto) {
        return prisma.timeOffPolicy.create({
            data: {
                teamId,
                name: dto.name,
                type: dto.type,
                accrualRate: dto.accrualRate,
                maxBalance: dto.maxBalance || null,
                isPaid: dto.isPaid ?? true,
                active: true,
            },
        });
    }
    async getTeamPolicies(teamId) {
        return prisma.timeOffPolicy.findMany({
            where: { teamId, active: true },
            orderBy: { name: 'asc' },
        });
    }
};
exports.TimeOffService = TimeOffService;
exports.TimeOffService = TimeOffService = __decorate([
    (0, common_1.Injectable)()
], TimeOffService);
//# sourceMappingURL=time-off.service.js.map