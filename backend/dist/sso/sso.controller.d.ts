import { Response } from 'express';
import { SsoService } from './sso.service';
export declare class SsoController {
    private readonly ssoService;
    constructor(ssoService: SsoService);
    createProvider(req: any, body: {
        type: string;
        name: string;
        config: any;
        defaultRole?: string;
    }): Promise<{
        success: boolean;
        provider?: any;
        error?: string;
    }>;
    listProviders(req: any): Promise<{
        providers: any[];
    }>;
    updateProvider(id: string, req: any, body: {
        enabled?: boolean;
        config?: any;
        defaultRole?: string;
    }): Promise<{
        success: boolean;
        error?: string;
    }>;
    deleteProvider(id: string, req: any): Promise<{
        success: boolean;
    }>;
    samlLogin(providerId: string, res: Response): Promise<void | Response<any, Record<string, any>>>;
    samlCallback(providerId: string, body: {
        SAMLResponse: string;
        RelayState?: string;
    }, res: Response): Promise<Response<any, Record<string, any>>>;
    oidcLogin(providerId: string, redirectUri: string, res: Response): Promise<void | Response<any, Record<string, any>>>;
    oidcCallback(providerId: string, code: string, state: string, res: Response): Promise<Response<any, Record<string, any>>>;
    ldapLogin(providerId: string, body: {
        username: string;
        password: string;
    }, res: Response): Promise<Response<any, Record<string, any>>>;
}
