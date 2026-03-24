export declare class StandardTasksController {
    findAll(): Promise<{
        standardTasks: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            estimatedHours: import("@prisma/client/runtime/library").Decimal | null;
            color: string;
            icon: string;
            isActive: boolean;
        }[];
    }>;
    create(createDto: {
        name: string;
        description?: string;
        estimatedHours?: number;
        color?: string;
        icon?: string;
    }): Promise<{
        standardTask: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            estimatedHours: import("@prisma/client/runtime/library").Decimal | null;
            color: string;
            icon: string;
            isActive: boolean;
        };
    }>;
    findOne(id: string): Promise<{
        error: string;
        standardTask?: undefined;
    } | {
        standardTask: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            estimatedHours: import("@prisma/client/runtime/library").Decimal | null;
            color: string;
            icon: string;
            isActive: boolean;
        };
        error?: undefined;
    }>;
    update(id: string, updateDto: {
        name?: string;
        description?: string;
        estimatedHours?: number;
        color?: string;
        icon?: string;
        isActive?: boolean;
    }): Promise<{
        error: string;
        standardTask?: undefined;
    } | {
        standardTask: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            estimatedHours: import("@prisma/client/runtime/library").Decimal | null;
            color: string;
            icon: string;
            isActive: boolean;
        };
        error?: undefined;
    }>;
    delete(id: string): Promise<{
        error: string;
        message?: undefined;
    } | {
        message: string;
        error?: undefined;
    }>;
    applyToProject(id: string, projectId: string, req: any): Promise<{
        error: string;
        task?: undefined;
        message?: undefined;
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
        message: string;
        error?: undefined;
    }>;
}
