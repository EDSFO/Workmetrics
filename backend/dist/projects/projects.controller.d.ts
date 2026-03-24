export declare class ProjectsController {
    findAll(req: any): Promise<{
        projects: ({
            team: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                tenantId: string;
                ownerId: string;
            };
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
    getTasksByProject(projectId: string, req: any): Promise<{
        tasks: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            projectId: string;
            estimatedHours: import("@prisma/client/runtime/library").Decimal | null;
        }[];
    }>;
    create(createDto: {
        name: string;
        description?: string;
        teamId?: string;
        budgetHours?: number;
        budgetAmount?: number;
    }, req: any): Promise<{
        error: string;
        project?: undefined;
    } | {
        project: {
            team: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                tenantId: string;
                ownerId: string;
            };
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
        };
        error?: undefined;
    }>;
    findOne(id: string, req: any): Promise<{
        error: string;
        project?: undefined;
    } | {
        project: {
            team: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                tenantId: string;
                ownerId: string;
            };
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
        };
        error?: undefined;
    }>;
    update(id: string, updateDto: {
        name?: string;
        description?: string;
        budgetHours?: number;
        budgetAmount?: number;
    }, req: any): Promise<{
        error: string;
        project?: undefined;
    } | {
        project: {
            team: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                tenantId: string;
                ownerId: string;
            };
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
        };
        error?: undefined;
    }>;
    archive(id: string, req: any): Promise<{
        error: string;
        project?: undefined;
        message?: undefined;
    } | {
        project: {
            team: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                tenantId: string;
                ownerId: string;
            };
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
        };
        message: string;
        error?: undefined;
    }>;
}
