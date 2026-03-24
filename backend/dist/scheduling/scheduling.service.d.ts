export interface CreateScheduledEntryDto {
    projectId?: string;
    taskId?: string;
    description?: string;
    billable?: boolean;
    startDate: string;
    startTime: string;
    duration: number;
    recurring?: boolean;
    recurringPattern?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    recurringDays?: number[];
    recurringEndDate?: string;
}
export interface ScheduledEntryResponse {
    id: string;
    userId: string;
    projectId: string | null;
    projectName: string | null;
    taskId: string | null;
    taskName: string | null;
    description: string | null;
    billable: boolean;
    startDate: string;
    startTime: string;
    duration: number;
    recurring: boolean;
    recurringPattern: string | null;
    recurringDays: number[] | null;
    recurringEndDate: string | null;
    active: boolean;
}
export declare class SchedulingService {
    createScheduledEntry(userId: string, dto: CreateScheduledEntryDto): Promise<ScheduledEntryResponse>;
    getScheduledEntries(userId: string): Promise<ScheduledEntryResponse[]>;
    getUpcomingEntries(userId: string, startDate: Date, endDate: Date): Promise<any[]>;
    private generateOccurrences;
    private setTimeOnDate;
    updateScheduledEntry(id: string, userId: string, updates: Partial<CreateScheduledEntryDto>): Promise<ScheduledEntryResponse | null>;
    deleteScheduledEntry(id: string, userId: string): Promise<boolean>;
    private toResponse;
}
