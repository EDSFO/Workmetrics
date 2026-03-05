import { Controller, Get, UseGuards, Request, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { Role } from '../auth/roles/role.enum';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportsController {
  /**
   * AIDEV-NOTE: Dashboard endpoint - returns today's hours, weekly summary, active timer, and recent entries
   */
  @Get('dashboard')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Get dashboard summary with today hours, week total, active timer, and recent entries' })
  async getDashboard(@Request() req: any) {
    // Get start of today (midnight)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Get start of week (Monday)
    const weekStart = new Date();
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Determine which user IDs to fetch based on role
    let userIds: string[];

    if (req.user.role === Role.ADMIN) {
      // Admin sees all users
      const allUsers = await prisma.user.findMany({ select: { id: true } });
      userIds = allUsers.map(u => u.id);
    } else if (req.user.role === Role.MANAGER && req.user.teamId) {
      // Manager sees their team's users
      const teamUsers = await prisma.user.findMany({
        where: { teamId: req.user.teamId },
        select: { id: true },
      });
      userIds = teamUsers.map(u => u.id);
    } else {
      // User sees only their own entries
      userIds = [req.user.id];
    }

    // Get today's total (only completed entries)
    const todayEntries = await prisma.timeEntry.findMany({
      where: {
        userId: { in: userIds },
        startTime: { gte: todayStart, lte: todayEnd },
        endTime: { not: null }, // Only completed entries
      },
    });

    const todayTotal = todayEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);

    // Get week's total (only completed entries)
    const weekEntries = await prisma.timeEntry.findMany({
      where: {
        userId: { in: userIds },
        startTime: { gte: weekStart, lte: weekEnd },
        endTime: { not: null }, // Only completed entries
      },
    });

    const weekTotal = weekEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);

    // Get active timer (only for current user)
    const activeTimer = await prisma.timeEntry.findFirst({
      where: {
        userId: req.user.id,
        endTime: null,
      },
      include: { project: true, task: true },
    });

    // Get recent entries (last 5 completed entries for current user)
    const recentEntries = await prisma.timeEntry.findMany({
      where: {
        userId: req.user.id,
        endTime: { not: null },
      },
      include: { project: true, task: true },
      orderBy: { startTime: 'desc' },
      take: 5,
    });

    return {
      todayTotal,
      weekTotal,
      activeTimer,
      recentEntries,
    };
  }

  /**
   * AIDEV-NOTE: Helper to get user IDs based on role
   */
  private async getUserIdsByRole(user: any): Promise<string[]> {
    if (user.role === Role.ADMIN) {
      const allUsers = await prisma.user.findMany({ select: { id: true } });
      return allUsers.map(u => u.id);
    } else if (user.role === Role.MANAGER && user.teamId) {
      const teamUsers = await prisma.user.findMany({
        where: { teamId: user.teamId },
        select: { id: true },
      });
      return teamUsers.map(u => u.id);
    } else {
      return [user.id];
    }
  }

  /**
   * AIDEV-NOTE: Summary report - returns total hours by project and by day
   */
  @Get('summary')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Get summary report - total hours by project and by day' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO string)' })
  async getSummary(@Request() req: any, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    // Default to last 30 days if not provided
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const userIds = await this.getUserIdsByRole(req.user);

    // Get completed entries within date range
    const entries = await prisma.timeEntry.findMany({
      where: {
        userId: { in: userIds },
        startTime: { gte: start, lte: end },
        endTime: { not: null },
      },
      include: { project: true },
    });

    // Calculate total by project
    const byProject: Record<string, { projectName: string; totalSeconds: number }> = {};
    for (const entry of entries) {
      const projectId = entry.projectId || 'no-project';
      if (!byProject[projectId]) {
        byProject[projectId] = {
          projectName: entry.project?.name || 'No Project',
          totalSeconds: 0,
        };
      }
      byProject[projectId].totalSeconds += entry.duration || 0;
    }

    // Calculate total by day
    const byDay: Record<string, number> = {};
    for (const entry of entries) {
      const day = new Date(entry.startTime).toISOString().split('T')[0];
      if (!byDay[day]) {
        byDay[day] = 0;
      }
      byDay[day] += entry.duration || 0;
    }

    // Calculate grand total
    const totalSeconds = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0);

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      totalSeconds,
      byProject: Object.values(byProject).sort((a, b) => b.totalSeconds - a.totalSeconds),
      byDay: Object.entries(byDay)
        .map(([date, seconds]) => ({ date, seconds }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  /**
   * AIDEV-NOTE: Detailed report - returns all time entries with details
   */
  @Get('detailed')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Get detailed report - all time entries with details' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO string)' })
  async getDetailed(@Request() req: any, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    // Default to last 30 days if not provided
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const userIds = await this.getUserIdsByRole(req.user);

    // Get completed entries within date range
    const entries = await prisma.timeEntry.findMany({
      where: {
        userId: { in: userIds },
        startTime: { gte: start, lte: end },
        endTime: { not: null },
      },
      include: {
        project: true,
        task: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { startTime: 'desc' },
    });

    // Calculate grand total
    const totalSeconds = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0);

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      totalSeconds,
      totalEntries: entries.length,
      entries: entries.map(entry => ({
        id: entry.id,
        date: new Date(entry.startTime).toISOString().split('T')[0],
        startTime: entry.startTime,
        endTime: entry.endTime,
        duration: entry.duration,
        projectName: entry.project?.name || 'No Project',
        taskName: entry.task?.name || 'No Task',
        description: entry.description,
        userName: entry.user.name,
        userEmail: entry.user.email,
      })),
    };
  }

  /**
   * AIDEV-NOTE: Export report as CSV
   */
  @Get('export')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Export report as CSV file' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO string)' })
  async exportCsv(@Request() req: any, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string, @Res() res?: Response) {
    // Default to last 30 days if not provided
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const userIds = await this.getUserIdsByRole(req.user);

    // Get completed entries within date range
    const entries = await prisma.timeEntry.findMany({
      where: {
        userId: { in: userIds },
        startTime: { gte: start, lte: end },
        endTime: { not: null },
      },
      include: {
        project: true,
        task: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { startTime: 'desc' },
    });

    // Create CSV content
    const headers = ['Date', 'Start Time', 'End Time', 'Duration (hours)', 'Project', 'Task', 'Description', 'User', 'Email'];
    const rows = entries.map(entry => {
      const durationHours = entry.duration ? (entry.duration / 3600).toFixed(2) : '0.00';
      const startTime = new Date(entry.startTime).toLocaleString();
      const endTime = entry.endTime ? new Date(entry.endTime).toLocaleString() : '';
      const date = new Date(entry.startTime).toISOString().split('T')[0];
      const projectName = entry.project?.name || 'No Project';
      const taskName = entry.task?.name || 'No Task';
      const description = entry.description ? `"${entry.description.replace(/"/g, '""')}"` : '';
      const userName = entry.user.name;
      const userEmail = entry.user.email;

      return [date, startTime, endTime, durationHours, projectName, taskName, description, userName, userEmail].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    // Set response headers for file download
    const filename = `time-report-${start.toISOString().split('T')[0]}-${end.toISOString().split('T')[0]}.csv`;

    res?.setHeader('Content-Type', 'text/csv');
    res?.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res?.send(csvContent);
  }
}
