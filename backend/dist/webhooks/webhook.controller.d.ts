import { WebhookService } from './webhook.service';
export declare class WebhookController {
    private readonly webhookService;
    constructor(webhookService: WebhookService);
    create(req: any, body: {
        url: string;
        events: string[];
    }): Promise<{
        error: string;
        webhook?: undefined;
        secret?: undefined;
        message?: undefined;
    } | {
        webhook: any;
        secret: string;
        message: string;
        error?: undefined;
    }>;
    list(req: any): Promise<{
        webhooks: any[];
    }>;
    delete(id: string, req: any): Promise<{
        error: string;
        message?: undefined;
    } | {
        message: string;
        error?: undefined;
    }>;
    deliveries(id: string, req: any): Promise<{
        error: string;
        deliveries?: undefined;
    } | {
        deliveries: any[];
        error?: undefined;
    }>;
    events(): Promise<{
        events: {
            name: string;
            event: "time_entry.created" | "time_entry.updated" | "time_entry.deleted" | "project.created" | "project.updated" | "project.deleted" | "task.created" | "task.updated" | "task.deleted" | "user.invited" | "user.joined" | "time_off.requested" | "time_off.approved" | "time_off.rejected";
            description: string;
        }[];
    }>;
    private getEventDescription;
}
