import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
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
    me(req: any): Promise<{
        user: {
            id: any;
            email: any;
            name: any;
            role: any;
        };
    }>;
}
