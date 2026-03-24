import { SchedulingService, CreateScheduledEntryDto } from './scheduling.service';
export declare class SchedulingController {
    private readonly schedulingService;
    constructor(schedulingService: SchedulingService);
    create(req: any, dto: CreateScheduledEntryDto): Promise<import("./scheduling.service").ScheduledEntryResponse>;
    getAll(req: any): Promise<import("./scheduling.service").ScheduledEntryResponse[]>;
    getUpcoming(req: any, startDate: string, endDate: string): Promise<any[]>;
    update(id: string, req: any, dto: Partial<CreateScheduledEntryDto>): Promise<import("./scheduling.service").ScheduledEntryResponse>;
    delete(id: string, req: any): Promise<{
        success: boolean;
    }>;
}
