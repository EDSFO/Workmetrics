import { ApprovalsService } from './approvals.service';
export declare class ApprovalsController {
    private readonly approvalsService;
    constructor(approvalsService: ApprovalsService);
    submitTimesheet(req: any, body: {
        periodStart: string;
        periodEnd: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    getPendingApprovals(req: any): Promise<any[]>;
    approveEntries(req: any, body: {
        userId: string;
        entryIds: string[];
        comments?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    rejectEntries(req: any, body: {
        userId: string;
        entryIds: string[];
        reason: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    getHistory(req: any, limit?: string): Promise<any[]>;
    getPendingCount(req: any): Promise<{
        count: number;
    }>;
}
