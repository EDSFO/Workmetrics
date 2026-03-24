export declare const WEBHOOK_EVENTS: {
    readonly TIME_ENTRY_CREATED: "time_entry.created";
    readonly TIME_ENTRY_UPDATED: "time_entry.updated";
    readonly TIME_ENTRY_DELETED: "time_entry.deleted";
    readonly PROJECT_CREATED: "project.created";
    readonly PROJECT_UPDATED: "project.updated";
    readonly PROJECT_DELETED: "project.deleted";
    readonly TASK_CREATED: "task.created";
    readonly TASK_UPDATED: "task.updated";
    readonly TASK_DELETED: "task.deleted";
    readonly USER_INVITED: "user.invited";
    readonly USER_JOINED: "user.joined";
    readonly TIME_OFF_REQUESTED: "time_off.requested";
    readonly TIME_OFF_APPROVED: "time_off.approved";
    readonly TIME_OFF_REJECTED: "time_off.rejected";
};
export type WebhookEvent = typeof WEBHOOK_EVENTS[keyof typeof WEBHOOK_EVENTS];
export declare class WebhookService {
    private readonly MAX_RETRIES;
    private readonly RETRY_DELAYS;
    createWebhook(teamId: string, url: string, events: string[]): Promise<{
        webhook: any;
        secret: string;
    }>;
    listWebhooks(teamId: string): Promise<any[]>;
    deleteWebhook(webhookId: string, teamId: string): Promise<boolean>;
    triggerEvent(teamId: string, event: string, payload: any): Promise<void>;
    private queueDelivery;
    private processDeliveryQueue;
    private deliverWebhook;
    private generateSignature;
    verifySignature(payload: string, secret: string, signature: string): boolean;
    getDeliveryHistory(webhookId: string, limit?: number): Promise<any[]>;
}
