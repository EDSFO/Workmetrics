import { Prisma } from '@prisma/client';
export interface ReportFilters {
    startDate?: Date;
    endDate?: Date;
    userIds?: string[];
    projectIds?: string[];
    taskIds?: string[];
    billable?: boolean;
    status?: string;
    type?: string;
}
export interface TimeEntryResult {
    id: string;
    date: string;
    startTime: string;
    endTime: string | null;
    duration: number | null;
    projectName: string;
    taskName: string;
    description: string | null;
    userName: string;
    userEmail: string;
    billable: boolean;
}
export interface SummaryByProject {
    projectId: string;
    projectName: string;
    totalSeconds: number;
    totalBillable: number;
    entryCount: number;
}
export interface SummaryByDay {
    date: string;
    totalSeconds: number;
    billableSeconds: number;
    entryCount: number;
}
export interface SummaryByUser {
    userId: string;
    userName: string;
    totalSeconds: number;
    totalBillable: number;
    entryCount: number;
}
export declare class ReportsService {
    getUserIdsByRole(user: {
        id: string;
        role: string;
        teamId: string | null;
    }): Promise<string[]>;
    buildWhereClause(filters: ReportFilters, allowedUserIds: string[]): Prisma.TimeEntryWhereInput;
    getTimeEntries(user: {
        id: string;
        role: string;
        teamId: string | null;
    }, filters: ReportFilters): Promise<TimeEntryResult[]>;
    getSummaryByProject(user: {
        id: string;
        role: string;
        teamId: string | null;
    }, filters: ReportFilters): Promise<SummaryByProject[]>;
    getSummaryByDay(user: {
        id: string;
        role: string;
        teamId: string | null;
    }, filters: ReportFilters): Promise<SummaryByDay[]>;
    getSummaryByUser(user: {
        id: string;
        role: string;
        teamId: string | null;
    }, filters: ReportFilters): Promise<SummaryByUser[]>;
    getDashboard(user: {
        id: string;
        role: string;
        teamId: string | null;
    }): Promise<{
        todayTotal: number;
        weekTotal: number;
        activeTimer: {
            project: {
                id: string;
                name: string;
                teamId: string;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                budgetHours: Prisma.Decimal | null;
                budgetAmount: Prisma.Decimal | null;
                archived: boolean;
            };
            task: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                projectId: string;
                estimatedHours: Prisma.Decimal | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            description: string | null;
            type: string;
            projectId: string | null;
            userId: string;
            taskId: string | null;
            startTime: Date;
            endTime: Date | null;
            duration: number | null;
            billable: boolean;
        };
        recentEntries: ({
            project: {
                id: string;
                name: string;
                teamId: string;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                budgetHours: Prisma.Decimal | null;
                budgetAmount: Prisma.Decimal | null;
                archived: boolean;
            };
            task: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                projectId: string;
                estimatedHours: Prisma.Decimal | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            description: string | null;
            type: string;
            projectId: string | null;
            userId: string;
            taskId: string | null;
            startTime: Date;
            endTime: Date | null;
            duration: number | null;
            billable: boolean;
        })[];
    }>;
}
