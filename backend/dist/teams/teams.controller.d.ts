import { UsersService } from '../users/users.service';
export declare class TeamsController {
    private usersService;
    constructor(usersService: UsersService);
    getMembers(req: any): Promise<{
        users: {
            id: string;
            email: string;
            name: string;
            role: string;
            teamId: string;
            hourlyRate: import("@prisma/client/runtime/library").Decimal;
            createdAt: Date;
            updatedAt: Date;
        }[];
    }>;
    getAllTeams(req: any): Promise<{
        teams: ({
            users: {
                id: string;
                email: string;
                name: string;
            }[];
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            ownerId: string;
        })[];
    }>;
    createTeam(createDto: {
        name: string;
    }, req: any): Promise<{
        error: string;
        team?: undefined;
    } | {
        team: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            ownerId: string;
        };
        error?: undefined;
    }>;
    inviteMember(inviteDto: {
        email: string;
        role?: string;
    }, req: any): Promise<{
        error: string;
        invitation?: undefined;
        message?: undefined;
    } | {
        invitation: {
            id: string;
            email: string;
            token: string;
            expiresAt: Date;
        };
        message: string;
        error?: undefined;
    }>;
    acceptInvitation(acceptDto: {
        token: string;
        name: string;
        password: string;
    }): Promise<{
        error: string;
        user?: undefined;
        message?: undefined;
    } | {
        user: {
            id: string;
            email: string;
            name: string;
            role: string;
        };
        message: string;
        error?: undefined;
    }>;
    changeRole(userId: string, updateDto: {
        role: string;
    }, req: any): Promise<{
        error: string;
        user?: undefined;
        message?: undefined;
    } | {
        user: {
            id: string;
            email: string;
            name: string;
            role: string;
            teamId: string;
        };
        message: string;
        error?: undefined;
    }>;
    removeMember(userId: string, req: any): Promise<{
        error: string;
        message?: undefined;
    } | {
        message: string;
        error?: undefined;
    }>;
}
