export interface TimesheetSubmission {
    id: string;
    userId: string;
    userName: string;
    periodStart: string;
    periodEnd: string;
    totalHours: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    submittedAt: string;
    entries: TimeEntrySummary[];
}
export interface TimeEntrySummary {
    id: string;
    date: string;
    projectName: string;
    taskName: string;
    hours: number;
    description: string;
    billable: boolean;
}
export declare class ApprovalsService {
    submitTimesheet(userId: string, periodStart: Date, periodEnd: Date): Promise<{
        success: boolean;
        message: string;
    }>;
    getPendingApprovals(requesterId: string, requesterRole: string, requesterTeamId: string | null): Promise<any[]>;
    approveEntries(approverId: string, targetUserId: string, entryIds: string[], comments?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    rejectEntries(approverId: string, targetUserId: string, entryIds: string[], reason: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getApprovalHistory(userId: string, limit?: number): Promise<any[]>;
    getPendingCount(userId: string): Promise<number>;
}
