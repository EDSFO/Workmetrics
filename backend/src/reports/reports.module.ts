import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { CsvExportService } from './export/csv-export.service';
import { PdfExportService } from './export/pdf-export.service';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, CsvExportService, PdfExportService],
  exports: [ReportsService, CsvExportService, PdfExportService],
})
export class ReportsModule {}
