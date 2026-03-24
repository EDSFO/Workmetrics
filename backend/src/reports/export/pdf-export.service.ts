import { Injectable } from '@nestjs/common';
import { TimeEntryResult } from '../reports.service';

export interface PdfExportOptions {
  entries: TimeEntryResult[];
  startDate: string;
  endDate: string;
  reportTitle?: string;
  includeUser?: boolean;
}

@Injectable()
export class PdfExportService {
  /**
   * AIDEV-NOTE: Format duration as hours and minutes
   */
  formatDuration(seconds: number | null): string {
    if (!seconds) return '0h 0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  /**
   * AIDEV-NOTE: Format duration as decimal hours
   */
  formatHours(seconds: number | null): string {
    if (!seconds) return '0.00';
    return (seconds / 3600).toFixed(2);
  }

  /**
   * AIDEV-NOTE: Calculate totals
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

  /**
   * AIDEV-NOTE: Generate PDF buffer (returns raw buffer for now)
   * Note: In production, install pdfkit: npm install pdfkit
   */
  async generatePdf(options: PdfExportOptions): Promise<Buffer> {
    const { entries, startDate, endDate, reportTitle = 'Time Report', includeUser = true } = options;

    const totals = this.calculateTotals(entries);

    // AIDEV-NOTE: This is a simplified text-based report
    // In production, use pdfkit or similar library
    const reportLines: string[] = [
      '='.repeat(60),
      reportTitle,
      '='.repeat(60),
      '',
      `Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`,
      '',
      'SUMMARY',
      '-'.repeat(60),
      `Total Hours: ${this.formatHours(totals.totalDuration)} (${this.formatDuration(totals.totalDuration)})`,
      `Billable Hours: ${this.formatHours(totals.billableDuration)} (${this.formatDuration(totals.billableDuration)})`,
      `Total Entries: ${totals.entryCount}`,
      '',
      'TIME ENTRIES',
      '-'.repeat(60),
    ];

    // Group entries by date
    const entriesByDate = new Map<string, TimeEntryResult[]>();
    for (const entry of entries) {
      const date = entry.date;
      if (!entriesByDate.has(date)) {
        entriesByDate.set(date, []);
      }
      entriesByDate.get(date)!.push(entry);
    }

    // Generate entry lines
    for (const [date, dateEntries] of entriesByDate) {
      reportLines.push('');
      reportLines.push(`Date: ${new Date(date).toLocaleDateString('pt-BR')}`);
      reportLines.push('-'.repeat(40));

      let dayTotal = 0;
      for (const entry of dateEntries) {
        const startTime = new Date(entry.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const endTime = entry.endTime ? new Date(entry.endTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ' ongoing';
        const duration = this.formatDuration(entry.duration);
        dayTotal += entry.duration || 0;

        reportLines.push(`${startTime} - ${endTime} | ${duration} | ${entry.projectName}`);
        reportLines.push(`   Task: ${entry.taskName}`);
        if (entry.description) {
          reportLines.push(`   Desc: ${entry.description}`);
        }
        if (includeUser) {
          reportLines.push(`   User: ${entry.userName} (${entry.userEmail})`);
        }
        reportLines.push(`   Billable: ${entry.billable ? 'Yes' : 'No'}`);
      }

      reportLines.push(`   Day Total: ${this.formatDuration(dayTotal)}`);
    }

    reportLines.push('');
    reportLines.push('='.repeat(60));
    reportLines.push('End of Report');
    reportLines.push('='.repeat(60));

    // Convert to buffer (in production, use PDFKit for actual PDF)
    return Buffer.from(reportLines.join('\n'), 'utf-8');
  }

  /**
   * AIDEV-NOTE: Generate filename for PDF export
   */
  generateFilename(startDate: string, endDate: string): string {
    const start = new Date(startDate).toISOString().split('T')[0];
    const end = new Date(endDate).toISOString().split('T')[0];
    return `time-report-${start}-${end}.pdf`;
  }
}
