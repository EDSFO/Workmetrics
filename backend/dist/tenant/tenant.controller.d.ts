import { TenantService } from './tenant.service';
export declare class TenantController {
    private readonly tenantService;
    constructor(tenantService: TenantService);
    register(registerDto: {
        tenantName: string;
        slug: string;
        email: string;
        name: string;
        password: string;
    }): Promise<{
        message: string;
        tenant: {
            id: string;
            name: string;
            slug: string;
        };
        user: {
            id: string;
            email: string;
            name: string;
        };
    }>;
    getCurrent(req: any): Promise<{
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
    } | {
        error: string;
    }>;
    updateSettings(req: any, settingsDto: {
        name?: string;
        logo?: string;
        primaryColor?: string;
        customDomain?: string;
        timezone?: string;
    }): Promise<({
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
    }) | {
        error: string;
    }>;
    getLimits(req: any): Promise<{
        error: string;
        users?: undefined;
        projects?: undefined;
        plan?: undefined;
    } | {
        users: {
            current: number;
            max: number;
            canAdd: boolean;
            remaining: number;
        };
        projects: {
            current: number;
            max: number;
            canAdd: boolean;
            remaining: number;
        };
        plan: {
            name: string;
            maxUsers: number;
            maxProjects: number;
        };
        error?: undefined;
    }>;
    getPlan(req: any): Promise<{
        error: string;
        plan?: undefined;
        features?: undefined;
    } | {
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
        features: import("@prisma/client/runtime/library").JsonValue;
        error?: undefined;
    }>;
    getAvailablePlans(): Promise<{
        id: string;
        name: string;
        monthlyPrice: import("@prisma/client/runtime/library").Decimal;
        maxUsers: number;
        maxProjects: number;
        features: import("@prisma/client/runtime/library").JsonValue;
        sortOrder: number;
    }[]>;
}
