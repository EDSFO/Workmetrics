import { TimeOffService, CreateTimeOffDto, TimeOffPolicyDto } from './time-off.service';
export declare class TimeOffController {
    private readonly timeOffService;
    constructor(timeOffService: TimeOffService);
    request(req: any, dto: CreateTimeOffDto): Promise<{
        success: boolean;
        timeOff?: any;
        message: string;
    }>;
    getMyRequests(req: any): Promise<any[]>;
    getMyBalances(req: any): Promise<import("./time-off.service").TimeOffBalance[]>;
    cancel(id: string, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    getPending(req: any): Promise<any[]>;
    approve(id: string, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    reject(id: string, body: {
        reason: string;
    }, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    getPolicies(req: any): Promise<any[]>;
    createPolicy(dto: TimeOffPolicyDto, req: any): Promise<any>;
}
