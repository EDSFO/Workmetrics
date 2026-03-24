import { CalendarService, CalendarView } from './calendar.service';
export declare class CalendarController {
    private readonly calendarService;
    constructor(calendarService: CalendarService);
    getMonthView(year: string, month: string, req: any): Promise<CalendarView>;
    getWeekView(startDate: string, req: any): Promise<CalendarView>;
    getDayView(date: string, req: any): Promise<CalendarView>;
    getRangeView(startDate: string, endDate: string, view: 'day' | 'week' | 'month', req: any): Promise<CalendarView>;
    updateEntry(id: string, updateDto: {
        startTime?: string;
        endTime?: string;
        projectId?: string | null;
        taskId?: string | null;
        description?: string | null;
        billable?: boolean;
    }, req: any): Promise<{
        success: boolean;
        entry?: import("./calendar.service").CalendarEntry;
        error?: string;
    }>;
}
