export declare class InvoicesController {
    createInvoice(createDto: {
        clientName: string;
        clientEmail?: string;
        periodStart: string;
        periodEnd: string;
        entryIds?: string[];
        hourlyRate?: number;
        notes?: string;
        dueDate?: string;
    }, req: any): Promise<{
        error: string;
        invoice?: undefined;
        entriesCount?: undefined;
        totalHours?: undefined;
    } | {
        invoice: {
            number: string;
            id: string;
            hourlyRate: import("@prisma/client/runtime/library").Decimal;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            userId: string;
            clientName: string;
            clientEmail: string | null;
            periodStart: Date;
            periodEnd: Date;
            totalHours: import("@prisma/client/runtime/library").Decimal;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            notes: string | null;
            dueDate: Date | null;
            paidAt: Date | null;
        };
        entriesCount: any;
        totalHours: string;
        error?: undefined;
    }>;
    findAll(req: any): Promise<{
        invoices: ({
            user: {
                id: string;
                email: string;
                name: string;
            };
            _count: {
                entries: number;
            };
        } & {
            number: string;
            id: string;
            hourlyRate: import("@prisma/client/runtime/library").Decimal;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            userId: string;
            clientName: string;
            clientEmail: string | null;
            periodStart: Date;
            periodEnd: Date;
            totalHours: import("@prisma/client/runtime/library").Decimal;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            notes: string | null;
            dueDate: Date | null;
            paidAt: Date | null;
        })[];
    }>;
    findOne(id: string, req: any): Promise<{
        error: string;
        invoice?: undefined;
        timeEntries?: undefined;
    } | {
        invoice: {
            user: {
                id: string;
                email: string;
                name: string;
            };
            entries: ({} & {
                id: string;
                entryId: string;
                invoiceId: string;
            })[];
        } & {
            number: string;
            id: string;
            hourlyRate: import("@prisma/client/runtime/library").Decimal;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            userId: string;
            clientName: string;
            clientEmail: string | null;
            periodStart: Date;
            periodEnd: Date;
            totalHours: import("@prisma/client/runtime/library").Decimal;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            notes: string | null;
            dueDate: Date | null;
            paidAt: Date | null;
        };
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
        error?: undefined;
    }>;
    updateStatus(id: string, updateDto: {
        status: string;
    }, req: any): Promise<{
        error: string;
        invoice?: undefined;
        message?: undefined;
    } | {
        invoice: {
            number: string;
            id: string;
            hourlyRate: import("@prisma/client/runtime/library").Decimal;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            userId: string;
            clientName: string;
            clientEmail: string | null;
            periodStart: Date;
            periodEnd: Date;
            totalHours: import("@prisma/client/runtime/library").Decimal;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            notes: string | null;
            dueDate: Date | null;
            paidAt: Date | null;
        };
        message: string;
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
