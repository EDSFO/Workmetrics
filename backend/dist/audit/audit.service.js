"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = exports.AUDIT_EVENT_TYPES = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.AUDIT_EVENT_TYPES = {
    USER_LOGIN: 'user.login',
    USER_LOGOUT: 'user.logout',
    USER_CREATED: 'user.created',
    USER_UPDATED: 'user.updated',
    USER_DELETED: 'user.deleted',
    TIME_ENTRY_CREATED: 'time_entry.created',
    TIME_ENTRY_UPDATED: 'time_entry.updated',
    TIME_ENTRY_DELETED: 'time_entry.deleted',
    PROJECT_CREATED: 'project.created',
    PROJECT_UPDATED: 'project.updated',
    PROJECT_DELETED: 'project.deleted',
    TEAM_CREATED: 'team.created',
    TEAM_UPDATED: 'team.updated',
    TEAM_DELETED: 'team.deleted',
    ROLE_CHANGED: 'admin.role_changed',
    PERMISSIONS_CHANGED: 'admin.permissions_changed',
    SETTINGS_CHANGED: 'admin.settings_changed',
    SSO_LOGIN: 'sso.login',
    SSO_PROVIDER_CREATED: 'sso.provider_created',
    SSO_PROVIDER_UPDATED: 'sso.provider_updated',
    SSO_PROVIDER_DELETED: 'sso.provider_deleted',
    DATA_EXPORTED: 'gdpr.data_exported',
    DATA_DELETED: 'gdpr.data_deleted',
    CONSENT_GRANTED: 'gdpr.consent_granted',
    CONSENT_REVOKED: 'gdpr.consent_revoked',
};
let AuditService = class AuditService {
    async log(params) {
        try {
            await prisma.auditLog.create({
                data: {
                    userId: params.userId,
                    action: params.action,
                    resource: params.resource,
                    resourceId: params.resourceId,
                    details: params.details ? JSON.parse(JSON.stringify(params.details)) : undefined,
                    ipAddress: params.ipAddress,
                    userAgent: params.userAgent,
                    status: params.status || 'success',
                    teamId: params.teamId,
                },
            });
        }
        catch (error) {
            console.error('Failed to create audit log:', error);
        }
    }
    async logLogin(userId, ipAddress, userAgent) {
        await this.log({
            userId,
            action: exports.AUDIT_EVENT_TYPES.USER_LOGIN,
            resource: 'User',
            ipAddress,
            userAgent,
            status: 'success',
        });
    }
    async logLogout(userId, ipAddress) {
        await this.log({
            userId,
            action: exports.AUDIT_EVENT_TYPES.USER_LOGOUT,
            resource: 'User',
            ipAddress,
            status: 'success',
        });
    }
    async logResourceChange(userId, action, resource, resourceId, changes, teamId) {
        await this.log({
            userId,
            action,
            resource,
            resourceId,
            details: changes ? { changes } : undefined,
            teamId,
            status: 'success',
        });
    }
    async logAdminAction(adminUserId, action, targetUserId, details, teamId) {
        await this.log({
            userId: adminUserId,
            action,
            resource: 'Admin',
            resourceId: targetUserId,
            details,
            teamId,
            status: 'success',
        });
    }
    async logSecurityEvent(event, details, ipAddress) {
        await this.log({
            action: event,
            resource: 'Security',
            details,
            ipAddress,
            status: 'failure',
        });
    }
    async getAuditLogs(params) {
        const where = {};
        if (params.teamId)
            where.teamId = params.teamId;
        if (params.userId)
            where.userId = params.userId;
        if (params.action)
            where.action = params.action;
        if (params.resource)
            where.resource = params.resource;
        if (params.startDate || params.endDate) {
            where.createdAt = {};
            if (params.startDate)
                where.createdAt.gte = params.startDate;
            if (params.endDate)
                where.createdAt.lte = params.endDate;
        }
        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: params.limit || 100,
                skip: params.offset || 0,
                include: {
                    user: {
                        select: { id: true, name: true, email: true, role: true },
                    },
                },
            }),
            prisma.auditLog.count({ where }),
        ]);
        return { logs, total };
    }
    async getResourceAuditHistory(resource, resourceId, limit = 50) {
        return prisma.auditLog.findMany({
            where: { resource, resourceId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
    }
    async getUserActivity(userId, limit = 50) {
        return prisma.auditLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    async getSecurityEvents(teamId, limit = 100) {
        const securityEvents = [
            'user.login',
            'user.logout',
            'admin.role_changed',
            'gdpr.data_exported',
            'gdpr.data_deleted',
            'sso.login',
        ];
        return prisma.auditLog.findMany({
            where: {
                teamId,
                action: { in: securityEvents },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
        });
    }
    async getAuditStats(teamId, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const [totalLogs, byAction, byResource, recentActivity] = await Promise.all([
            prisma.auditLog.count({ where: { teamId, createdAt: { gte: startDate } } }),
            prisma.auditLog.groupBy({
                by: ['action'],
                where: { teamId, createdAt: { gte: startDate } },
                _count: { action: true },
                orderBy: { _count: { action: 'desc' } },
                take: 10,
            }),
            prisma.auditLog.groupBy({
                by: ['resource'],
                where: { teamId, createdAt: { gte: startDate } },
                _count: { resource: true },
                orderBy: { _count: { resource: 'desc' } },
            }),
            prisma.auditLog.findMany({
                where: { teamId, createdAt: { gte: startDate } },
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: {
                    id: true,
                    action: true,
                    resource: true,
                    createdAt: true,
                    status: true,
                    user: { select: { name: true } },
                },
            }),
        ]);
        return {
            period: { startDate, endDate: new Date(), days },
            totalLogs,
            byAction: byAction.map((a) => ({ action: a.action, count: a._count.action })),
            byResource: byResource.map((r) => ({ resource: r.resource, count: r._count.resource })),
            recentActivity,
        };
    }
    async applyRetentionPolicy(teamId, retentionDays = 365) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        const result = await prisma.auditLog.deleteMany({
            where: {
                teamId,
                createdAt: { lt: cutoffDate },
                action: { notIn: ['admin.role_changed', 'admin.permissions_changed'] },
            },
        });
        return { deletedCount: result.count };
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)()
], AuditService);
//# sourceMappingURL=audit.service.js.map