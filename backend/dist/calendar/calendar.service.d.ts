export interface CalendarEntry {
    id: string;
    userId: string;
    userName: string;
    projectId: string | null;
    projectName: string | null;
    taskId: string | null;
    taskName: string | null;
    startTime: Date;
    endTime: Date | null;
    duration: number | null;
    description: string | null;
    billable: boolean;
    type: string;
    status: string;
}
export interface DayEntries {
    date: string;
    entries: CalendarEntry[];
    totalDuration: number;
    totalBillable: number;
}
export interface CalendarView {
    startDate: string;
    endDate: string;
    view: 'day' | 'week' | 'month';
    days: DayEntries[];
    totalDuration: number;
    totalBillable: number;
}
export declare class CalendarService {
    getEntriesForDateRange(userId: string, role: string, teamId: string | null, startDate: Date, endDate: Date, view?: 'day' | 'week' | 'month'): Promise<CalendarView>;
    getMonthEntries(userId: string, role: string, teamId: string | null, year: number, month: number): Promise<CalendarView>;
    getWeekEntries(userId: string, role: string, teamId: string | null, weekStartDate: Date): Promise<CalendarView>;
    getDayEntries(userId: string, role: string, teamId: string | null, date: Date): Promise<CalendarView>;
    updateEntry(entryId: string, userId: string, role: string, teamId: string | null, updates: {
        startTime?: Date;
        endTime?: Date;
        projectId?: string | null;
        taskId?: string | null;
        description?: string | null;
        billable?: boolean;
    }): Promise<{
        success: boolean;
        entry?: CalendarEntry;
        error?: string;
    }>;
}
