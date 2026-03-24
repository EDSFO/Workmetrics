import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
export declare class AuthService {
    private usersService;
    private jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    register(registerDto: RegisterDto): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            role: string;
        };
        accessToken: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            role: string;
        };
        accessToken: string;
    }>;
    validateUser(userId: string): Promise<{
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
}
