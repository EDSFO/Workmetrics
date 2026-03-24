export declare class TimeEntriesController {
    start(startDto: {
        projectId?: string;
        taskId?: string;
        description?: string;
    }, req: any): Promise<{
        timeEntry: {
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
        expiresIn: any;
        message: string;
    } | {
        timeEntry: {
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
        expiresIn: any;
        message?: undefined;
    }>;
    stop(stopDto: {
        id: string;
    }, req: any): Promise<{
        error: string;
        timeEntry?: undefined;
    } | {
        timeEntry: {
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
    getActive(req: any): Promise<{
        timeEntry: {
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
    }>;
    findAll(req: any): Promise<{
        timeEntries: ({
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
    create(createDto: any, req: any): Promise<{
        error: string;
        timeEntry?: undefined;
    } | {
        timeEntry: {
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
    clockIn(req: any): Promise<{
        error: string;
        timeEntry?: undefined;
        message?: undefined;
    } | {
        timeEntry: {
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
        message: string;
        error?: undefined;
    }>;
    clockOut(req: any): Promise<{
        error: string;
        timeEntry?: undefined;
        message?: undefined;
    } | {
        timeEntry: {
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
        message: string;
        error?: undefined;
    }>;
    startPause(req: any): Promise<{
        error: string;
        timeEntry?: undefined;
        message?: undefined;
    } | {
        timeEntry: {
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
        message: string;
        error?: undefined;
    }>;
    endPause(req: any): Promise<{
        error: string;
        message?: undefined;
    } | {
        message: string;
        error?: undefined;
    }>;
    getTodayEntries(req: any): Promise<{
        entries: {
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
        }[];
        totalWorkTime: number;
        isWorking: boolean;
        currentEntry: any;
    }>;
    getKioskStatus(req: any): Promise<{
        status: string;
        message: string;
        entry?: undefined;
    } | {
        status: string;
        message: string;
        entry: {
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
    }>;
    startAutoTrack(startDto: {
        projectId?: string;
        taskId?: string;
        description?: string;
    }, req: any): Promise<{
        timeEntry: {
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
        message: string;
        isActive: boolean;
    }>;
    stopAutoTrack(req: any): Promise<{
        error: string;
        timeEntry?: undefined;
        message?: undefined;
        isActive?: undefined;
    } | {
        timeEntry: {
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
        message: string;
        isActive: boolean;
        error?: undefined;
    }>;
    heartbeat(heartbeatDto: {
        activity?: string;
    }, req: any): Promise<{
        error: string;
        isActive: boolean;
        timeEntry?: undefined;
        message?: undefined;
        lastActivity?: undefined;
    } | {
        timeEntry: {
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
        message: string;
        isActive: boolean;
        lastActivity: string;
        error?: undefined;
    }>;
    getAutoTrackStatus(req: any): Promise<{
        isActive: boolean;
        message: string;
        timeEntry?: undefined;
        elapsedSeconds?: undefined;
    } | {
        isActive: boolean;
        timeEntry: {
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
        elapsedSeconds: number;
        message: string;
    }>;
    getIdleTime(req: any): Promise<{
        isIdle: boolean;
        idleTimeSeconds: number;
        message: string;
    }>;
    getPendingApprovals(req: any): Promise<{
        entries: any[];
        message: string;
        count?: undefined;
    } | {
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
        count: number;
        message?: undefined;
    }>;
    approveEntry(req: any): Promise<{
        error: string;
        timeEntry?: undefined;
        message?: undefined;
    } | {
        timeEntry: {
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
        message: string;
        error?: undefined;
    }>;
    rejectEntry(req: any): Promise<{
        error: string;
        timeEntry?: undefined;
        message?: undefined;
    } | {
        timeEntry: {
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
        message: string;
        error?: undefined;
    }>;
    getMyEntriesWithStatus(req: any): Promise<{
        entries: ({
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
        summary: {
            total: number;
            pending: number;
            approved: number;
            rejected: number;
        };
    }>;
    delete(id: string, req: any): Promise<{
        error: string;
        success?: undefined;
        message?: undefined;
    } | {
        success: boolean;
        message: string;
        error?: undefined;
    }>;
    getWeekEntries(startDate: string, req: any): Promise<{
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
        weekTotal: number;
        weekStart: string;
        weekEnd: string;
    }>;
}
