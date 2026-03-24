import { Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private usersService;
    constructor(usersService: UsersService);
    validate(payload: {
        sub: string;
        email: string;
    }): Promise<{
        userId: string;
        email: string;
        name: string;
        role: string;
        teamId: string;
        tenantId: string;
    }>;
}
export {};
