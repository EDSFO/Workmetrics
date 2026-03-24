import { AuditService } from './audit.service';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    getAuditLogs(req: any, action?: string, resource?: string, startDate?: string, endDate?: string, limit?: string, offset?: string): Promise<{
        logs: any[];
        total: number;
    } | {
        logs: any[];
        total: number;
        error: string;
    }>;
    getAuditStats(req: any, days?: string): Promise<any>;
    getSecurityEvents(req: any, limit?: string): Promise<any[] | {
        events: any[];
        error: string;
    }>;
    getResourceAuditHistory(resource: string, resourceId: string, limit?: string): Promise<any[]>;
    getUserActivity(userId: string, limit?: string): Promise<any[]>;
}
