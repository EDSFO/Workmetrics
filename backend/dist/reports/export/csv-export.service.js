"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CsvExportService = void 0;
const common_1 = require("@nestjs/common");
let CsvExportService = class CsvExportService {
    generateCsv(options) {
        const { entries, includeUser = true } = options;
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
            }
            else {
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
    generateFilename(startDate, endDate) {
        const start = new Date(startDate).toISOString().split('T')[0];
        const end = new Date(endDate).toISOString().split('T')[0];
        return `time-report-${start}-${end}.csv`;
    }
    calculateTotals(entries) {
        return entries.reduce((acc, entry) => ({
            totalDuration: acc.totalDuration + (entry.duration || 0),
            billableDuration: acc.billableDuration + (entry.billable ? (entry.duration || 0) : 0),
            entryCount: acc.entryCount + 1,
        }), { totalDuration: 0, billableDuration: 0, entryCount: 0 });
    }
};
exports.CsvExportService = CsvExportService;
exports.CsvExportService = CsvExportService = __decorate([
    (0, common_1.Injectable)()
], CsvExportService);
//# sourceMappingURL=csv-export.service.js.map