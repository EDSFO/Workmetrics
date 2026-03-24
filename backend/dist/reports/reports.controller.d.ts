import { Response } from 'express';
import { ReportsService } from './reports.service';
import { CsvExportService } from './export/csv-export.service';
import { PdfExportService } from './export/pdf-export.service';
export declare class ReportsController {
    private readonly reportsService;
    private readonly csvExportService;
    private readonly pdfExportService;
    constructor(reportsService: ReportsService, csvExportService: CsvExportService, pdfExportService: PdfExportService);
    getDashboard(req: any): Promise<{
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
                budgetHours: import("@prisma/client/runtime/library").Decimal | null;
                budgetAmount: import("@prisma/client/runtime/library").Decimal | null;
                archived: boolean;
            };
            task: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                projectId: string;
                estimatedHours: import("@prisma/client/runtime/library").Decimal | null;
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
                budgetHours: import("@prisma/client/runtime/library").Decimal | null;
                budgetAmount: import("@prisma/client/runtime/library").Decimal | null;
                archived: boolean;
            };
            task: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                projectId: string;
                estimatedHours: import("@prisma/client/runtime/library").Decimal | null;
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
    getEntries(req: any, filters: {
        startDate?: string;
        endDate?: string;
        projectIds?: string[];
        taskIds?: string[];
        billable?: boolean;
        status?: string;
        type?: string;
    }): Promise<{
        entries: import("./reports.service").TimeEntryResult[];
        totalDuration: number;
        billableDuration: number;
        count: number;
    }>;
    getSummary(req: any, startDate?: string, endDate?: string): Promise<{
        startDate: string;
        endDate: string;
        totalSeconds: number;
        byProject: import("./reports.service").SummaryByProject[];
        byDay: import("./reports.service").SummaryByDay[];
        byUser: import("./reports.service").SummaryByUser[];
    }>;
    getSummaryByProject(req: any, startDate?: string, endDate?: string): Promise<import("./reports.service").SummaryByProject[]>;
    getSummaryByDay(req: any, startDate?: string, endDate?: string): Promise<import("./reports.service").SummaryByDay[]>;
    getSummaryByUser(req: any, startDate?: string, endDate?: string): Promise<import("./reports.service").SummaryByUser[]>;
    getDetailed(req: any, startDate?: string, endDate?: string): Promise<{
        startDate: string;
        endDate: string;
        totalSeconds: number;
        totalEntries: number;
        entries: import("./reports.service").TimeEntryResult[];
    }>;
    exportCsv(req: any, startDate?: string, endDate?: string, res?: Response): Promise<void>;
    exportPdf(req: any, startDate?: string, endDate?: string, res?: Response): Promise<void>;
    exportFilteredCsv(req: any, filters: {
        startDate?: string;
        endDate?: string;
        projectIds?: string[];
        taskIds?: string[];
        billable?: boolean;
        status?: string;
        type?: string;
    }, res?: Response): Promise<void>;
}
