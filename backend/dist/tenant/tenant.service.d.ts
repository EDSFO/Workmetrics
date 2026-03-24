export declare class TenantService {
    createTenant(data: {
        name: string;
        slug: string;
        email: string;
        userName: string;
        password: string;
    }): Promise<{
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
        user: {
            id: string;
            email: string;
            passwordHash: string;
            name: string;
            role: string;
            teamId: string | null;
            hourlyRate: import("@prisma/client/runtime/library").Decimal | null;
            createdAt: Date;
            updatedAt: Date;
        };
        team: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            ownerId: string;
        };
    }>;
    getTenant(tenantId: string): Promise<{
        plan: {
            id: string;
            name: string;
            isActive: boolean;
            monthlyPrice: import("@prisma/client/runtime/library").Decimal;
            maxUsers: number;
            maxProjects: number;
            features: import("@prisma/client/runtime/library").JsonValue;
            sortOrder: number;
        };
    } & {
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
    }>;
    getTenantBySlug(slug: string): Promise<{
        plan: {
            id: string;
            name: string;
            isActive: boolean;
            monthlyPrice: import("@prisma/client/runtime/library").Decimal;
            maxUsers: number;
            maxProjects: number;
            features: import("@prisma/client/runtime/library").JsonValue;
            sortOrder: number;
        };
    } & {
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
    }>;
    updateTenant(tenantId: string, data: {
        name?: string;
        logo?: string;
        primaryColor?: string;
        customDomain?: string;
        timezone?: string;
    }): Promise<{
        plan: {
            id: string;
            name: string;
            isActive: boolean;
            monthlyPrice: import("@prisma/client/runtime/library").Decimal;
            maxUsers: number;
            maxProjects: number;
            features: import("@prisma/client/runtime/library").JsonValue;
            sortOrder: number;
        };
    } & {
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
    }>;
    checkLimits(tenantId: string, resource: 'users' | 'projects'): Promise<{
        current: number;
        max: number;
        canAdd: boolean;
        remaining: number;
    }>;
    getTenantByUserId(userId: string): Promise<{
        userRole: string;
        plan: {
            id: string;
            name: string;
            isActive: boolean;
            monthlyPrice: import("@prisma/client/runtime/library").Decimal;
            maxUsers: number;
            maxProjects: number;
            features: import("@prisma/client/runtime/library").JsonValue;
            sortOrder: number;
        };
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
    }>;
}
