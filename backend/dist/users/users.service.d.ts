import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
export declare class UsersService implements OnModuleInit, OnModuleDestroy {
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    findByEmail(email: string): Promise<{
        id: string;
        email: string;
        passwordHash: string;
        name: string;
        role: string;
        teamId: string | null;
        hourlyRate: import("@prisma/client/runtime/library").Decimal | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findById(id: string): Promise<{
        team: {
            tenant: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                logo: string | null;
                primaryColor: string;
                customDomain: string | null;
                timezone: string;
                planId: string;
                stripeCustomerId: string | null;
                stripeSubscriptionId: string | null;
                status: string;
            };
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            ownerId: string;
        };
    } & {
        id: string;
        email: string;
        passwordHash: string;
        name: string;
        role: string;
        teamId: string | null;
        hourlyRate: import("@prisma/client/runtime/library").Decimal | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(): Promise<{
        id: string;
        email: string;
        name: string;
        role: string;
        teamId: string;
        hourlyRate: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findByTeamId(teamId: string): Promise<{
        id: string;
        email: string;
        name: string;
        role: string;
        teamId: string;
        hourlyRate: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    updateRole(userId: string, role: string): Promise<{
        id: string;
        email: string;
        passwordHash: string;
        name: string;
        role: string;
        teamId: string | null;
        hourlyRate: import("@prisma/client/runtime/library").Decimal | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    delete(userId: string): Promise<{
        id: string;
        email: string;
        passwordHash: string;
        name: string;
        role: string;
        teamId: string | null;
        hourlyRate: import("@prisma/client/runtime/library").Decimal | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(data: {
        email: string;
        passwordHash: string;
        name: string;
        role?: string;
        teamId?: string;
    }): Promise<{
        id: string;
        email: string;
        passwordHash: string;
        name: string;
        role: string;
        teamId: string | null;
        hourlyRate: import("@prisma/client/runtime/library").Decimal | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
