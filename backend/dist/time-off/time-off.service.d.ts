export interface CreateTimeOffDto {
    type: string;
    startDate: string;
    endDate: string;
    hours: number;
    notes?: string;
}
export interface TimeOffPolicyDto {
    name: string;
    type: string;
    accrualRate: number;
    maxBalance?: number;
    isPaid?: boolean;
}
export interface TimeOffBalance {
    policyType: string;
    policyName: string;
    accrued: number;
    used: number;
    pending: number;
    available: number;
    isPaid: boolean;
}
export declare class TimeOffService {
    requestTimeOff(userId: string, dto: CreateTimeOffDto): Promise<{
        success: boolean;
        timeOff?: any;
        message: string;
    }>;
    getMyTimeOff(userId: string): Promise<any[]>;
    getPendingRequests(requesterId: string, requesterRole: string, requesterTeamId: string | null): Promise<any[]>;
    approveRequest(approverId: string, timeOffId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    rejectRequest(approverId: string, timeOffId: string, reason: string): Promise<{
        success: boolean;
        message: string;
    }>;
    cancelRequest(userId: string, timeOffId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getBalances(userId: string): Promise<TimeOffBalance[]>;
    createPolicy(teamId: string, dto: TimeOffPolicyDto): Promise<any>;
    getTeamPolicies(teamId: string): Promise<any[]>;
}
