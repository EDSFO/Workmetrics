"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfExportService = void 0;
const common_1 = require("@nestjs/common");
let PdfExportService = class PdfExportService {
    formatDuration(seconds) {
        if (!seconds)
            return '0h 0m';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }
    formatHours(seconds) {
        if (!seconds)
            return '0.00';
        return (seconds / 3600).toFixed(2);
    }
    calculateTotals(entries) {
        return entries.reduce((acc, entry) => ({
            totalDuration: acc.totalDuration + (entry.duration || 0),
            billableDuration: acc.billableDuration + (entry.billable ? (entry.duration || 0) : 0),
            entryCount: acc.entryCount + 1,
        }), { totalDuration: 0, billableDuration: 0, entryCount: 0 });
    }
    async generatePdf(options) {
        const { entries, startDate, endDate, reportTitle = 'Time Report', includeUser = true } = options;
        const totals = this.calculateTotals(entries);
        const reportLines = [
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
        const entriesByDate = new Map();
        for (const entry of entries) {
            const date = entry.date;
            if (!entriesByDate.has(date)) {
                entriesByDate.set(date, []);
            }
            entriesByDate.get(date).push(entry);
        }
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
        return Buffer.from(reportLines.join('\n'), 'utf-8');
    }
    generateFilename(startDate, endDate) {
        const start = new Date(startDate).toISOString().split('T')[0];
        const end = new Date(endDate).toISOString().split('T')[0];
        return `time-report-${start}-${end}.pdf`;
    }
};
exports.PdfExportService = PdfExportService;
exports.PdfExportService = PdfExportService = __decorate([
    (0, common_1.Injectable)()
], PdfExportService);
//# sourceMappingURL=pdf-export.service.js.map