import { ApiKeyService } from './api-auth.guard';
export declare class ApiController {
    private readonly apiKeyService;
    constructor(apiKeyService: ApiKeyService);
    getMe(req: any): Promise<{
        teamId: any;
        permissions: any;
    }>;
    listTimeEntries(req: any, startDate?: string, endDate?: string, userId?: string, projectId?: string): Promise<{
        entries: ({
            user: {
                id: string;
                email: string;
                name: string;
            };
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
    createTimeEntry(req: any, body: {
        userId: string;
        projectId?: string;
        taskId?: string;
        startTime: string;
        endTime?: string;
        duration?: number;
        description?: string;
        billable?: boolean;
    }): Promise<{
        error: string;
        entry?: undefined;
    } | {
        entry: {
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
        error?: undefined;
    }>;
    updateTimeEntry(id: string, req: any, updates: {
        projectId?: string;
        taskId?: string;
        startTime?: string;
        endTime?: string;
        duration?: number;
        description?: string;
        billable?: boolean;
    }): Promise<{
        error: string;
        entry?: undefined;
    } | {
        entry: {
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
        error?: undefined;
    }>;
    listProjects(req: any): Promise<{
        projects: ({
            _count: {
                timeEntries: number;
            };
            tasks: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                projectId: string;
                estimatedHours: import("@prisma/client/runtime/library").Decimal | null;
            }[];
        } & {
            id: string;
            name: string;
            teamId: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            budgetHours: import("@prisma/client/runtime/library").Decimal | null;
            budgetAmount: import("@prisma/client/runtime/library").Decimal | null;
            archived: boolean;
        })[];
    }>;
    createProject(req: any, body: {
        name: string;
        description?: string;
        budgetHours?: number;
    }): Promise<{
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
    }>;
    listTasks(req: any, projectId?: string): Promise<{
        tasks: ({
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
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            projectId: string;
            estimatedHours: import("@prisma/client/runtime/library").Decimal | null;
        })[];
    }>;
    createTask(req: any, body: {
        projectId: string;
        name: string;
        estimatedHours?: number;
    }): Promise<{
        error: string;
        task?: undefined;
    } | {
        task: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            projectId: string;
            estimatedHours: import("@prisma/client/runtime/library").Decimal | null;
        };
        error?: undefined;
    }>;
    listUsers(req: any): Promise<{
        users: {
            id: string;
            email: string;
            name: string;
            role: string;
            hourlyRate: import("@prisma/client/runtime/library").Decimal;
            createdAt: Date;
        }[];
    }>;
    getReport(req: any, startDate: string, endDate: string): Promise<{
        startDate: string;
        endDate: string;
        totalSeconds: number;
        totalHours: string;
        byProject: any[];
        entryCount: number;
    }>;
}
