import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class ApiKeyGuard implements CanActivate {
    canActivate(context: ExecutionContext): Promise<boolean>;
    private verifyKey;
}
export declare class ApiKeyService {
    createApiKey(teamId: string, name: string, permissions?: string[], expiresInDays?: number): Promise<{
        key: string;
        keyRecord: any;
    }>;
    revokeApiKey(keyId: string): Promise<boolean>;
    listApiKeys(teamId: string): Promise<any[]>;
}
