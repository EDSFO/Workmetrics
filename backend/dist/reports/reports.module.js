"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsModule = void 0;
const common_1 = require("@nestjs/common");
const reports_controller_1 = require("./reports.controller");
const reports_service_1 = require("./reports.service");
const csv_export_service_1 = require("./export/csv-export.service");
const pdf_export_service_1 = require("./export/pdf-export.service");
let ReportsModule = class ReportsModule {
};
exports.ReportsModule = ReportsModule;
exports.ReportsModule = ReportsModule = __decorate([
    (0, common_1.Module)({
        controllers: [reports_controller_1.ReportsController],
        providers: [reports_service_1.ReportsService, csv_export_service_1.CsvExportService, pdf_export_service_1.PdfExportService],
        exports: [reports_service_1.ReportsService, csv_export_service_1.CsvExportService, pdf_export_service_1.PdfExportService],
    })
], ReportsModule);
//# sourceMappingURL=reports.module.js.map