export declare const INTEGRATION_TYPES: {
    readonly SLACK: "slack";
    readonly JIRA: "jira";
    readonly LINEAR: "linear";
};
export type IntegrationType = typeof INTEGRATION_TYPES[keyof typeof INTEGRATION_TYPES];
export declare class IntegrationsService {
    connectSlack(teamId: string, accessToken: string): Promise<any>;
    sendSlackNotification(teamId: string, channel: string, message: {
        text?: string;
        blocks?: any[];
        attachments?: any[];
    }): Promise<boolean>;
    notifySlackTimeEntry(teamId: string, userName: string, projectName: string, hours: number, description: string): Promise<boolean>;
    connectJira(teamId: string, domain: string, email: string, apiToken: string): Promise<any>;
    linkTimeEntryToJiraIssue(teamId: string, issueKey: string, timeEntryId: string, seconds: number, description: string): Promise<boolean>;
    connectLinear(teamId: string, apiKey: string): Promise<any>;
    linkTimeEntryToLinearIssue(teamId: string, issueId: string, timeEntryId: string, seconds: number, description: string): Promise<boolean>;
    listIntegrations(teamId: string): Promise<any[]>;
    disconnect(teamId: string, integrationId: string): Promise<boolean>;
}
