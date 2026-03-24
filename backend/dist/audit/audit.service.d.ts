export declare const AUDIT_EVENT_TYPES: {
    readonly USER_LOGIN: "user.login";
    readonly USER_LOGOUT: "user.logout";
    readonly USER_CREATED: "user.created";
    readonly USER_UPDATED: "user.updated";
    readonly USER_DELETED: "user.deleted";
    readonly TIME_ENTRY_CREATED: "time_entry.created";
    readonly TIME_ENTRY_UPDATED: "time_entry.updated";
    readonly TIME_ENTRY_DELETED: "time_entry.deleted";
    readonly PROJECT_CREATED: "project.created";
    readonly PROJECT_UPDATED: "project.updated";
    readonly PROJECT_DELETED: "project.deleted";
    readonly TEAM_CREATED: "team.created";
    readonly TEAM_UPDATED: "team.updated";
    readonly TEAM_DELETED: "team.deleted";
    readonly ROLE_CHANGED: "admin.role_changed";
    readonly PERMISSIONS_CHANGED: "admin.permissions_changed";
    readonly SETTINGS_CHANGED: "admin.settings_changed";
    readonly SSO_LOGIN: "sso.login";
    readonly SSO_PROVIDER_CREATED: "sso.provider_created";
    readonly SSO_PROVIDER_UPDATED: "sso.provider_updated";
    readonly SSO_PROVIDER_DELETED: "sso.provider_deleted";
    readonly DATA_EXPORTED: "gdpr.data_exported";
    readonly DATA_DELETED: "gdpr.data_deleted";
    readonly CONSENT_GRANTED: "gdpr.consent_granted";
    readonly CONSENT_REVOKED: "gdpr.consent_revoked";
};
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
export declare class AuditService {
    log(params: CreateAuditLogParams): Promise<void>;
    logLogin(userId: string, ipAddress?: string, userAgent?: string): Promise<void>;
    logLogout(userId: string, ipAddress?: string): Promise<void>;
    logResourceChange(userId: string, action: string, resource: string, resourceId: string, changes?: Record<string, any>, teamId?: string): Promise<void>;
    logAdminAction(adminUserId: string, action: string, targetUserId: string, details?: Record<string, any>, teamId?: string): Promise<void>;
    logSecurityEvent(event: string, details: Record<string, any>, ipAddress?: string): Promise<void>;
    getAuditLogs(params: {
        teamId?: string;
        userId?: string;
        action?: string;
        resource?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        offset?: number;
    }): Promise<{
        logs: any[];
        total: number;
    }>;
    getResourceAuditHistory(resource: string, resourceId: string, limit?: number): Promise<any[]>;
    getUserActivity(userId: string, limit?: number): Promise<any[]>;
    getSecurityEvents(teamId: string, limit?: number): Promise<any[]>;
    getAuditStats(teamId: string, days?: number): Promise<any>;
    applyRetentionPolicy(teamId: string, retentionDays?: number): Promise<{
        deletedCount: number;
    }>;
}
