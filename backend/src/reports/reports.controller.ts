import { Controller, Get, Post, UseGuards, Request, Query, Res, Body } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { Role } from '../auth/roles/role.enum';
import { ReportsService, ReportFilters } from './reports.service';
import { CsvExportService } from './export/csv-export.service';
import { PdfExportService } from './export/pdf-export.service';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly csvExportService: CsvExportService,
    private readonly pdfExportService: PdfExportService,
  ) {}

  /**
   * AIDEV-NOTE: Dashboard endpoint - returns today's hours, weekly summary, active timer, and recent entries
   */
  @Get('dashboard')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Get dashboard summary with today hours, week total, active timer, and recent entries' })
  async getDashboard(@Request() req: any) {
    return this.reportsService.getDashboard(req.user);
  }

  /**
   * AIDEV-NOTE: Get time entries with advanced filters
   */
  @Post('entries')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Get time entries with advanced filters' })
  async getEntries(
    @Request() req: any,
    @Body() filters: {
      startDate?: string;
      endDate?: string;
      projectIds?: string[];
      taskIds?: string[];
      billable?: boolean;
      status?: string;
      type?: string;
    },
  ) {
    const reportFilters: ReportFilters = {
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
      projectIds: filters.projectIds,
      taskIds: filters.taskIds,
      billable: filters.billable,
      status: filters.status,
      type: filters.type,
    };

    const entries = await this.reportsService.getTimeEntries(req.user, reportFilters);

    return {
      entries,
      totalDuration: entries.reduce((sum, e) => sum + (e.duration || 0), 0),
      billableDuration: entries.filter(e => e.billable).reduce((sum, e) => sum + (e.duration || 0), 0),
      count: entries.length,
    };
  }

  /**
   * AIDEV-NOTE: Summary report - returns total hours by project and by day
   */
  @Get('summary')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Get summary report - total hours by project and by day' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO string)' })
  async getSummary(
    @Request() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const filters: ReportFilters = { startDate: start, endDate: end };

    const [byProject, byDay, byUser] = await Promise.all([
      this.reportsService.getSummaryByProject(req.user, filters),
      this.reportsService.getSummaryByDay(req.user, filters),
      this.reportsService.getSummaryByUser(req.user, filters),
    ]);

    const totalSeconds = byProject.reduce((sum, p) => sum + p.totalSeconds, 0);

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      totalSeconds,
      byProject,
      byDay,
      byUser,
    };
  }

  /**
   * AIDEV-NOTE: Summary by project
   */
  @Get('summary/by-project')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Get summary by project' })
  async getSummaryByProject(
    @Request() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return this.reportsService.getSummaryByProject(req.user, { startDate: start, endDate: end });
  }

  /**
   * AIDEV-NOTE: Summary by day
   */
  @Get('summary/by-day')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Get summary by day' })
  async getSummaryByDay(
    @Request() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return this.reportsService.getSummaryByDay(req.user, { startDate: start, endDate: end });
  }

  /**
   * AIDEV-NOTE: Summary by user
   */
  @Get('summary/by-user')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Get summary by user' })
  async getSummaryByUser(
    @Request() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return this.reportsService.getSummaryByUser(req.user, { startDate: start, endDate: end });
  }

  /**
   * AIDEV-NOTE: Detailed report - returns all time entries with details
   */
  @Get('detailed')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Get detailed report - all time entries with details' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO string)' })
  async getDetailed(
    @Request() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const filters: ReportFilters = { startDate: start, endDate: end };
    const entries = await this.reportsService.getTimeEntries(req.user, filters);

    const totalSeconds = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0);

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      totalSeconds,
      totalEntries: entries.length,
      entries,
    };
  }

  /**
   * AIDEV-NOTE: Export report as CSV
   */
  @Get('export/csv')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Export report as CSV file' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO string)' })
  async exportCsv(
    @Request() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Res() res?: Response,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const filters: ReportFilters = { startDate: start, endDate: end };
    const entries = await this.reportsService.getTimeEntries(req.user, filters);

    const csvContent = this.csvExportService.generateCsv({
      entries,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      includeUser: req.user.role !== 'USER', // Only admins/managers see all users
    });

    const filename = this.csvExportService.generateFilename(start.toISOString(), end.toISOString());

    res?.setHeader('Content-Type', 'text/csv');
    res?.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res?.send(csvContent);
  }

  /**
   * AIDEV-NOTE: Export report as PDF
   */
  @Get('export/pdf')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Export report as PDF file' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO string)' })
  async exportPdf(
    @Request() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Res() res?: Response,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const filters: ReportFilters = { startDate: start, endDate: end };
    const entries = await this.reportsService.getTimeEntries(req.user, filters);

    const pdfBuffer = await this.pdfExportService.generatePdf({
      entries,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      reportTitle: 'Time Tracking Report',
      includeUser: req.user.role !== 'USER',
    });

    const filename = this.pdfExportService.generateFilename(start.toISOString(), end.toISOString());

    res?.setHeader('Content-Type', 'application/pdf');
    res?.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res?.send(pdfBuffer);
  }

  /**
   * AIDEV-NOTE: Export filtered report as CSV
   */
  @Post('export/csv')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Export filtered report as CSV file' })
  async exportFilteredCsv(
    @Request() req: any,
    @Body() filters: {
      startDate?: string;
      endDate?: string;
      projectIds?: string[];
      taskIds?: string[];
      billable?: boolean;
      status?: string;
      type?: string;
    },
    @Res() res?: Response,
  ) {
    const reportFilters: ReportFilters = {
      startDate: filters.startDate ? new Date(filters.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: filters.endDate ? new Date(filters.endDate) : new Date(),
      projectIds: filters.projectIds,
      taskIds: filters.taskIds,
      billable: filters.billable,
      status: filters.status,
      type: filters.type,
    };

    reportFilters.startDate?.setHours(0, 0, 0, 0);
    reportFilters.endDate?.setHours(23, 59, 59, 999);

    const entries = await this.reportsService.getTimeEntries(req.user, reportFilters);

    const csvContent = this.csvExportService.generateCsv({
      entries,
      startDate: reportFilters.startDate?.toISOString() || '',
      endDate: reportFilters.endDate?.toISOString() || '',
      includeUser: req.user.role !== 'USER',
    });

    const filename = this.csvExportService.generateFilename(
      reportFilters.startDate?.toISOString() || '',
      reportFilters.endDate?.toISOString() || ''
    );

    res?.setHeader('Content-Type', 'text/csv');
    res?.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res?.send(csvContent);
  }
}
