import { GdprService } from './gdpr.service';
export declare class GdprController {
    private readonly gdprService;
    constructor(gdprService: GdprService);
    requestExport(req: any): Promise<{
        success: boolean;
        exportId?: string;
        error?: string;
    }>;
    getExportStatus(exportId: string, req: any): Promise<any>;
    downloadExport(exportId: string, req: any): Promise<{
        success: boolean;
        error: string;
        data?: undefined;
        message?: undefined;
    } | {
        success: boolean;
        data: any;
        message: string;
        error?: undefined;
    }>;
    deleteAccount(req: any, body: {
        confirmDeletion: boolean;
        anonymizeInstead?: boolean;
    }): Promise<{
        success: boolean;
        message: string;
        error?: string;
    } | {
        success: boolean;
        error: string;
    }>;
    recordConsent(req: any, body: {
        consentType: string;
        granted: boolean;
    }): Promise<{
        success: boolean;
    }>;
    getConsents(req: any): Promise<{
        consents: any[];
    }>;
    getRetentionPolicy(req: any): Promise<any>;
}
