import { IntegrationsService } from './integrations.service';
export declare class IntegrationsController {
    private readonly integrationsService;
    constructor(integrationsService: IntegrationsService);
    connectSlack(req: any, body: {
        accessToken: string;
    }): Promise<any>;
    testSlack(req: any, body: {
        channel: string;
        message: string;
    }): Promise<{
        success: boolean;
    }>;
    connectJira(req: any, body: {
        domain: string;
        email: string;
        apiToken: string;
    }): Promise<any>;
    linkToJira(req: any, body: {
        issueKey: string;
        timeEntryId: string;
        seconds: number;
        description: string;
    }): Promise<{
        success: boolean;
    }>;
    connectLinear(req: any, body: {
        apiKey: string;
    }): Promise<any>;
    linkToLinear(req: any, body: {
        issueId: string;
        timeEntryId: string;
        seconds: number;
        description: string;
    }): Promise<{
        success: boolean;
    }>;
    list(req: any): Promise<{
        integrations: any[];
    }>;
    disconnect(id: string, req: any): Promise<{
        success: boolean;
    }>;
}
