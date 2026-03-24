import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const AUDIT_EVENT_TYPES = {
  // User events
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',

  // Time entry events
  TIME_ENTRY_CREATED: 'time_entry.created',
  TIME_ENTRY_UPDATED: 'time_entry.updated',
  TIME_ENTRY_DELETED: 'time_entry.deleted',

  // Project events
  PROJECT_CREATED: 'project.created',
  PROJECT_UPDATED: 'project.updated',
  PROJECT_DELETED: 'project.deleted',

  // Team events
  TEAM_CREATED: 'team.created',
  TEAM_UPDATED: 'team.updated',
  TEAM_DELETED: 'team.deleted',

  // Admin events
  ROLE_CHANGED: 'admin.role_changed',
  PERMISSIONS_CHANGED: 'admin.permissions_changed',
  SETTINGS_CHANGED: 'admin.settings_changed',

  // SSO events
  SSO_LOGIN: 'sso.login',
  SSO_PROVIDER_CREATED: 'sso.provider_created',
  SSO_PROVIDER_UPDATED: 'sso.provider_updated',
  SSO_PROVIDER_DELETED: 'sso.provider_deleted',

  // GDPR events
  DATA_EXPORTED: 'gdpr.data_exported',
  DATA_DELETED: 'gdpr.data_deleted',
  CONSENT_GRANTED: 'gdpr.consent_granted',
  CONSENT_REVOKED: 'gdpr.consent_revoked',
} as const;

export type AuditEventType = typeof AUDIT_EVENT_TYPES[keyof typeof AUDIT_EVENT_TYPES];

export interface CreateAuditLogParams {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status?: 'success' | 'failure' | 'pending';
  teamId?: string;
}

@Injectable()
export class AuditService {
  // ============================================
  // LOG CREATION
  // ============================================

  /**
   * AIDEV-NOTE: Create audit log entry
   */
  async log(params: CreateAuditLogParams): Promise<void> {
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
    } catch (error) {
      // Log to console in development, in production use a fallback logger
      console.error('Failed to create audit log:', error);
    }
  }

  /**
   * AIDEV-NOTE: Log user login
   */
  async logLogin(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.log({
      userId,
      action: AUDIT_EVENT_TYPES.USER_LOGIN,
      resource: 'User',
      ipAddress,
      userAgent,
      status: 'success',
    });
  }

  /**
   * AIDEV-NOTE: Log user logout
   */
  async logLogout(userId: string, ipAddress?: string): Promise<void> {
    await this.log({
      userId,
      action: AUDIT_EVENT_TYPES.USER_LOGOUT,
      resource: 'User',
      ipAddress,
      status: 'success',
    });
  }

  /**
   * AIDEV-NOTE: Log resource change
   */
  async logResourceChange(
    userId: string,
    action: string,
    resource: string,
    resourceId: string,
    changes?: Record<string, any>,
    teamId?: string,
  ): Promise<void> {
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

  /**
   * AIDEV-NOTE: Log admin action
   */
  async logAdminAction(
    adminUserId: string,
    action: string,
    targetUserId: string,
    details?: Record<string, any>,
    teamId?: string,
  ): Promise<void> {
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

  /**
   * AIDEV-NOTE: Log security event
   */
  async logSecurityEvent(
    event: string,
    details: Record<string, any>,
    ipAddress?: string,
  ): Promise<void> {
    await this.log({
      action: event,
      resource: 'Security',
      details,
      ipAddress,
      status: 'failure',
    });
  }

  // ============================================
  // QUERIES
  // ============================================

  /**
   * AIDEV-NOTE: Get audit logs with filters
   */
  async getAuditLogs(params: {
    teamId?: string;
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: any[]; total: number }> {
    const where: any = {};

    if (params.teamId) where.teamId = params.teamId;
    if (params.userId) where.userId = params.userId;
    if (params.action) where.action = params.action;
    if (params.resource) where.resource = params.resource;

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = params.startDate;
      if (params.endDate) where.createdAt.lte = params.endDate;
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

  /**
   * AIDEV-NOTE: Get audit logs for a specific resource
   */
  async getResourceAuditHistory(
    resource: string,
    resourceId: string,
    limit: number = 50,
  ): Promise<any[]> {
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

  /**
   * AIDEV-NOTE: Get user activity log
   */
  async getUserActivity(userId: string, limit: number = 50): Promise<any[]> {
    return prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * AIDEV-NOTE: Get security events
   */
  async getSecurityEvents(teamId: string, limit: number = 100): Promise<any[]> {
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

  /**
   * AIDEV-NOTE: Get audit statistics
   */
  async getAuditStats(teamId: string, days: number = 30): Promise<any> {
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

  // ============================================
  // DATA RETENTION
  // ============================================

  /**
   * AIDEV-NOTE: Delete old audit logs based on retention policy
   */
  async applyRetentionPolicy(teamId: string, retentionDays: number = 365): Promise<{ deletedCount: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await prisma.auditLog.deleteMany({
      where: {
        teamId,
        createdAt: { lt: cutoffDate },
        action: { notIn: ['admin.role_changed', 'admin.permissions_changed'] }, // Keep admin changes longer
      },
    });

    return { deletedCount: result.count };
  }
}