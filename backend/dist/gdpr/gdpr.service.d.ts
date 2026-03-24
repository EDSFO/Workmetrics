export declare class GdprService {
    requestExport(userId: string): Promise<{
        success: boolean;
        exportId?: string;
        error?: string;
    }>;
    private processExportAsync;
    getExportStatus(exportId: string, userId: string): Promise<any>;
    exportUserData(userId: string): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    deleteUserData(userId: string, anonymizeInstead?: boolean): Promise<{
        success: boolean;
        message: string;
        error?: string;
    }>;
    recordConsent(userId: string, consentType: string, granted: boolean, ipAddress?: string): Promise<{
        success: boolean;
    }>;
    getUserConsents(userId: string): Promise<any[]>;
    getRetentionPolicy(teamId: string): Promise<any>;
    applyRetentionPolicy(teamId: string): Promise<{
        deletedCount: number;
    }>;
}
