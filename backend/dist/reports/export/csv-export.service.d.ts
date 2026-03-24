import { TimeEntryResult } from '../reports.service';
export interface CsvExportOptions {
    entries: TimeEntryResult[];
    startDate: string;
    endDate: string;
    includeUser?: boolean;
}
export declare class CsvExportService {
    generateCsv(options: CsvExportOptions): string;
    generateFilename(startDate: string, endDate: string): string;
    calculateTotals(entries: TimeEntryResult[]): {
        totalDuration: number;
        billableDuration: number;
        entryCount: number;
    };
}
