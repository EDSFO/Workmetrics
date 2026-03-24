"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GdprService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
let GdprService = class GdprService {
    async requestExport(userId) {
        try {
            const existing = await prisma.dataExport.findFirst({
                where: {
                    userId,
                    status: { in: ['pending', 'processing'] },
                },
            });
            if (existing) {
                return { success: true, exportId: existing.id };
            }
            const exportRecord = await prisma.dataExport.create({
                data: {
                    userId,
                    status: 'pending',
                    format: 'json',
                    requestedAt: new Date(),
                },
            });
            this.processExportAsync(exportRecord.id);
            return { success: true, exportId: exportRecord.id };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async processExportAsync(exportId) {
        try {
            await prisma.dataExport.update({
                where: { id: exportId },
                data: { status: 'processing' },
            });
            setTimeout(async () => {
                await prisma.dataExport.update({
                    where: { id: exportId },
                    data: {
                        status: 'completed',
                        completedAt: new Date(),
                        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    },
                });
            }, 5000);
        }
        catch (error) {
            await prisma.dataExport.update({
                where: { id: exportId },
                data: { status: 'failed' },
            });
        }
    }
    async getExportStatus(exportId, userId) {
        const exportRecord = await prisma.dataExport.findFirst({
            where: { id: exportId, userId },
        });
        if (!exportRecord) {
            return null;
        }
        return {
            id: exportRecord.id,
            status: exportRecord.status,
            format: exportRecord.format,
            expiresAt: exportRecord.expiresAt,
            requestedAt: exportRecord.requestedAt,
            completedAt: exportRecord.completedAt,
        };
    }
    async exportUserData(userId) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    teamId: true,
                    hourlyRate: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            if (!user) {
                return { success: false, error: 'User not found' };
            }
            const timeEntries = await prisma.timeEntry.findMany({
                where: { userId },
                include: {
                    project: true,
                    task: true,
                },
            });
            const team = user.teamId
                ? await prisma.team.findUnique({
                    where: { id: user.teamId },
                })
                : null;
            const projects = await prisma.project.findMany({
                where: { teamId: user.teamId },
            });
            const tasks = await prisma.task.findMany({
                where: {
                    project: { teamId: user.teamId },
                },
            });
            const timeOff = await prisma.timeOff.findMany({
                where: { userId },
            });
            const data = {
                exportedAt: new Date().toISOString(),
                user,
                timeEntries: timeEntries.map(entry => ({
                    ...entry,
                    startTime: entry.startTime.toISOString(),
                    endTime: entry.endTime?.toISOString(),
                    createdAt: entry.createdAt.toISOString(),
                    updatedAt: entry.updatedAt.toISOString(),
                })),
                team,
                projects,
                tasks,
                timeOffRequests: timeOff.map(t => ({
                    ...t,
                    startDate: t.startDate.toISOString(),
                    endDate: t.endDate.toISOString(),
                    createdAt: t.createdAt.toISOString(),
                    updatedAt: t.updatedAt.toISOString(),
                })),
            };
            return { success: true, data };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async deleteUserData(userId, anonymizeInstead = false) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                return { success: false, error: 'User not found' };
            }
            if (anonymizeInstead) {
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        email: `deleted_${Date.now()}@anonymized.local`,
                        name: 'Deleted User',
                        passwordHash: 'DELETED',
                    },
                });
                await prisma.timeEntry.updateMany({
                    where: { userId },
                    data: {
                        description: '[DELETED USER DATA]',
                    },
                });
                return {
                    success: true,
                    message: 'User data has been anonymized. Historical records preserved.',
                };
            }
            else {
                await prisma.timeEntry.deleteMany({
                    where: { userId },
                });
                await prisma.timeOff.deleteMany({
                    where: { userId },
                });
                await prisma.scheduledEntry.deleteMany({
                    where: { userId },
                });
                await prisma.dataExport.deleteMany({
                    where: { userId },
                });
                await prisma.user.delete({
                    where: { id: userId },
                });
                return {
                    success: true,
                    message: 'All user data has been permanently deleted.',
                };
            }
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async recordConsent(userId, consentType, granted, ipAddress) {
        await prisma.auditLog.create({
            data: {
                userId,
                action: `consent.${consentType}.${granted ? 'granted' : 'revoked'}`,
                resource: 'Consent',
                details: { consentType, granted, timestamp: new Date().toISOString() },
                ipAddress,
                status: 'success',
            },
        });
        return { success: true };
    }
    async getUserConsents(userId) {
        const logs = await prisma.auditLog.findMany({
            where: {
                userId,
                action: { startsWith: 'consent.' },
            },
            orderBy: { createdAt: 'desc' },
        });
        const consents = new Map();
        for (const log of logs) {
            const parts = log.action.split('.');
            if (parts.length >= 3) {
                const consentType = parts[1];
                const status = parts[2];
                if (!consents.has(consentType) || status === 'granted') {
                    consents.set(consentType, {
                        consentType,
                        granted: status === 'granted',
                        grantedAt: status === 'granted' ? log.createdAt : null,
                        revokedAt: status === 'revoked' ? log.createdAt : null,
                    });
                }
            }
        }
        return Array.from(consents.values());
    }
    async getRetentionPolicy(teamId) {
        return {
            timeEntries: { retentionDays: 2555, description: '7 years for tax compliance' },
            auditLogs: { retentionDays: 365, description: '1 year for security' },
            timeOffRequests: { retentionDays: 2555, description: '7 years for HR compliance' },
        };
    }
    async applyRetentionPolicy(teamId) {
        return { deletedCount: 0 };
    }
};
exports.GdprService = GdprService;
exports.GdprService = GdprService = __decorate([
    (0, common_1.Injectable)()
], GdprService);
//# sourceMappingURL=gdpr.service.js.map