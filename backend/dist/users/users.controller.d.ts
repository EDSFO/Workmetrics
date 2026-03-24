import { UsersService } from './users.service';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    findAll(req: any): Promise<{
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
    me(req: any): Promise<{
        user: {
            id: any;
            email: any;
            name: any;
            role: any;
            teamId: any;
        };
    }>;
    delete(id: string, req: any): Promise<{
        message: string;
    }>;
}
