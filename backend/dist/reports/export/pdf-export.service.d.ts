import { TimeEntryResult } from '../reports.service';
export interface PdfExportOptions {
    entries: TimeEntryResult[];
    startDate: string;
    endDate: string;
    reportTitle?: string;
    includeUser?: boolean;
}
export declare class PdfExportService {
    formatDuration(seconds: number | null): string;
    formatHours(seconds: number | null): string;
    calculateTotals(entries: TimeEntryResult[]): {
        totalDuration: number;
        billableDuration: number;
        entryCount: number;
    };
    generatePdf(options: PdfExportOptions): Promise<Buffer>;
    generateFilename(startDate: string, endDate: string): string;
}
