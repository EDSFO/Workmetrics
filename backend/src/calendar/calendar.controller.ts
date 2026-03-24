import { Controller, Get, Post, Put, Body, Query, UseGuards, Request, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { Role } from '../auth/roles/role.enum';
import { CalendarService, CalendarView } from './calendar.service';

@ApiTags('calendar')
@Controller('calendar')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  /**
   * AIDEV-NOTE: Get calendar view for a month
   */
  @Get('month')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Get calendar view for a specific month' })
  @ApiQuery({ name: 'year', required: true, type: Number })
  @ApiQuery({ name: 'month', required: true, type: Number })
  async getMonthView(
    @Query('year') year: string,
    @Query('month') month: string,
    @Request() req: any,
  ): Promise<CalendarView> {
    return this.calendarService.getMonthEntries(
      req.user.id,
      req.user.role,
      req.user.teamId,
      parseInt(year, 10),
      parseInt(month, 10),
    );
  }

  /**
   * AIDEV-NOTE: Get calendar view for a week
   */
  @Get('week')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Get calendar view for a specific week' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date of the week (defaults to current week)' })
  async getWeekView(
    @Query('startDate') startDate: string,
    @Request() req: any,
  ): Promise<CalendarView> {
    const date = startDate ? new Date(startDate) : new Date();
    return this.calendarService.getWeekEntries(
      req.user.id,
      req.user.role,
      req.user.teamId,
      date,
    );
  }

  /**
   * AIDEV-NOTE: Get calendar view for a specific day
   */
  @Get('day')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Get calendar view for a specific day' })
  @ApiQuery({ name: 'date', required: true, type: String, description: 'Date in YYYY-MM-DD format' })
  async getDayView(
    @Query('date') date: string,
    @Request() req: any,
  ): Promise<CalendarView> {
    return this.calendarService.getDayEntries(
      req.user.id,
      req.user.role,
      req.user.teamId,
      new Date(date),
    );
  }

  /**
   * AIDEV-NOTE: Get entries for custom date range
   */
  @Get('range')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Get calendar view for a custom date range' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiQuery({ name: 'view', required: false, enum: ['day', 'week', 'month'] })
  async getRangeView(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('view') view: 'day' | 'week' | 'month' = 'week',
    @Request() req: any,
  ): Promise<CalendarView> {
    return this.calendarService.getEntriesForDateRange(
      req.user.id,
      req.user.role,
      req.user.teamId,
      new Date(startDate),
      new Date(endDate),
      view,
    );
  }

  /**
   * AIDEV-NOTE: Update time entry (for drag-and-drop editing)
   */
  @Put(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Update a time entry (e.g., for drag-and-drop editing)' })
  async updateEntry(
    @Param('id') id: string,
    @Body() updateDto: {
      startTime?: string;
      endTime?: string;
      projectId?: string | null;
      taskId?: string | null;
      description?: string | null;
      billable?: boolean;
    },
    @Request() req: any,
  ) {
    const updates: any = {};

    if (updateDto.startTime) updates.startTime = new Date(updateDto.startTime);
    if (updateDto.endTime) updates.endTime = new Date(updateDto.endTime);
    if (updateDto.projectId !== undefined) updates.projectId = updateDto.projectId;
    if (updateDto.taskId !== undefined) updates.taskId = updateDto.taskId;
    if (updateDto.description !== undefined) updates.description = updateDto.description;
    if (updateDto.billable !== undefined) updates.billable = updateDto.billable;

    return this.calendarService.updateEntry(
      id,
      req.user.id,
      req.user.role,
      req.user.teamId,
      updates,
    );
  }
}
