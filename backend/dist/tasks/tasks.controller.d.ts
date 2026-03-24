export declare class TasksController {
    findByProject(projectId: string, req: any): Promise<{
        tasks: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            projectId: string;
            estimatedHours: import("@prisma/client/runtime/library").Decimal | null;
        }[];
    }>;
    create(projectId: string, createDto: {
        name: string;
        estimatedHours?: number;
    }, req: any): Promise<{
        error: string;
        task?: undefined;
    } | {
        task: {
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
        };
        error?: undefined;
    }>;
    findOne(id: string, req: any): Promise<{
        error: string;
        task?: undefined;
    } | {
        task: {
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
        };
        error?: undefined;
    }>;
    update(id: string, updateDto: {
        name?: string;
        estimatedHours?: number;
    }, req: any): Promise<{
        error: string;
        task?: undefined;
    } | {
        task: {
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
        };
        error?: undefined;
    }>;
    delete(id: string, req: any): Promise<{
        error: string;
        message?: undefined;
    } | {
        message: string;
        error?: undefined;
    }>;
}
