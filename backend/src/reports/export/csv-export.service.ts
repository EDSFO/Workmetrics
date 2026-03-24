import { Injectable } from '@nestjs/common';
import { TimeEntryResult } from '../reports.service';

export interface CsvExportOptions {
  entries: TimeEntryResult[];
  startDate: string;
  endDate: string;
  includeUser?: boolean;
}

@Injectable()
export class CsvExportService {
  /**
   * AIDEV-NOTE: Generate CSV content from time entries
   */
  generateCsv(options: CsvExportOptions): string {
    const { entries, includeUser = true } = options;

    // Define headers based on options
    const headers = includeUser
      ? ['Date', 'Start Time', 'End Time', 'Duration (hours)', 'Project', 'Task', 'Description', 'User', 'Email', 'Billable']
      : ['Date', 'Start Time', 'End Time', 'Duration (hours)', 'Project', 'Task', 'Description', 'Billable'];

    const rows = entries.map(entry => {
      const durationHours = entry.duration ? (entry.duration / 3600).toFixed(2) : '0.00';
      const startTime = new Date(entry.startTime).toLocaleString('pt-BR');
      const endTime = entry.endTime ? new Date(entry.endTime).toLocaleString('pt-BR') : '';
      const date = new Date(entry.startTime).toISOString().split('T')[0];
      const projectName = entry.projectName;
      const taskName = entry.taskName;
      const description = entry.description ? `"${entry.description.replace(/"/g, '""')}"` : '';
      const billable = entry.billable ? 'Yes' : 'No';

      if (includeUser) {
        return [
          date,
          startTime,
          endTime,
          durationHours,
          projectName,
          taskName,
          description,
          entry.userName,
          entry.userEmail,
          billable,
        ].join(',');
      } else {
        return [
          date,
          startTime,
          endTime,
          durationHours,
          projectName,
          taskName,
          description,
          billable,
        ].join(',');
      }
    });

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * AIDEV-NOTE: Generate filename for CSV export
   */
  generateFilename(startDate: string, endDate: string): string {
    const start = new Date(startDate).toISOString().split('T')[0];
    const end = new Date(endDate).toISOString().split('T')[0];
    return `time-report-${start}-${end}.csv`;
  }

  /**
   * AIDEV-NOTE: Calculate totals for CSV summary
   */
  calculateTotals(entries: TimeEntryResult[]): { totalDuration: number; billableDuration: number; entryCount: number } {
    return entries.reduce(
      (acc, entry) => ({
        totalDuration: acc.totalDuration + (entry.duration || 0),
        billableDuration: acc.billableDuration + (entry.billable ? (entry.duration || 0) : 0),
        entryCount: acc.entryCount + 1,
      }),
      { totalDuration: 0, billableDuration: 0, entryCount: 0 }
    );
  }
}
