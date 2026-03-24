import { Injectable } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  userIds?: string[];
  projectIds?: string[];
  taskIds?: string[];
  billable?: boolean;
  status?: string;
  type?: string;
}

export interface TimeEntryResult {
  id: string;
  date: string;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  projectName: string;
  taskName: string;
  description: string | null;
  userName: string;
  userEmail: string;
  billable: boolean;
}

export interface SummaryByProject {
  projectId: string;
  projectName: string;
  totalSeconds: number;
  totalBillable: number;
  entryCount: number;
}

export interface SummaryByDay {
  date: string;
  totalSeconds: number;
  billableSeconds: number;
  entryCount: number;
}

export interface SummaryByUser {
  userId: string;
  userName: string;
  totalSeconds: number;
  totalBillable: number;
  entryCount: number;
}

@Injectable()
export class ReportsService {
  /**
   * AIDEV-NOTE: Get user IDs based on role (helper for authorization)
   */
  async getUserIdsByRole(user: { id: string; role: string; teamId: string | null }): Promise<string[]> {
    if (user.role === 'ADMIN') {
      const allUsers = await prisma.user.findMany({ select: { id: true } });
      return allUsers.map(u => u.id);
    } else if (user.role === 'MANAGER' && user.teamId) {
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
   * AIDEV-NOTE: Build Prisma where clause from filters
   */
  buildWhereClause(filters: ReportFilters, allowedUserIds: string[]): Prisma.TimeEntryWhereInput {
    const where: Prisma.TimeEntryWhereInput = {
      userId: { in: allowedUserIds },
      endTime: { not: null }, // Only completed entries by default
    };

    if (filters.startDate) {
      where.startTime = { ...where.startTime as object, gte: filters.startDate };
    }

    if (filters.endDate) {
      where.startTime = { ...where.startTime as object, lte: filters.endDate };
    }

    if (filters.projectIds && filters.projectIds.length > 0) {
      where.projectId = { in: filters.projectIds };
    }

    if (filters.taskIds && filters.taskIds.length > 0) {
      where.taskId = { in: filters.taskIds };
    }

    if (filters.billable !== undefined) {
      where.billable = filters.billable;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    return where;
  }

  /**
   * AIDEV-NOTE: Get time entries with filters
   */
  async getTimeEntries(
    user: { id: string; role: string; teamId: string | null },
    filters: ReportFilters
  ): Promise<TimeEntryResult[]> {
    const allowedUserIds = await this.getUserIdsByRole(user);
    const where = this.buildWhereClause(filters, allowedUserIds);

    const entries = await prisma.timeEntry.findMany({
      where,
      include: {
        project: true,
        task: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { startTime: 'desc' },
    });

    return entries.map(entry => ({
      id: entry.id,
      date: new Date(entry.startTime).toISOString().split('T')[0],
      startTime: entry.startTime.toISOString(),
      endTime: entry.endTime?.toISOString() || null,
      duration: entry.duration,
      projectName: entry.project?.name || 'No Project',
      taskName: entry.task?.name || 'No Task',
      description: entry.description,
      userName: entry.user.name,
      userEmail: entry.user.email,
      billable: entry.billable,
    }));
  }

  /**
   * AIDEV-NOTE: Get summary by project
   */
  async getSummaryByProject(
    user: { id: string; role: string; teamId: string | null },
    filters: ReportFilters
  ): Promise<SummaryByProject[]> {
    const allowedUserIds = await this.getUserIdsByRole(user);
    const where = this.buildWhereClause(filters, allowedUserIds);

    const entries = await prisma.timeEntry.findMany({
      where,
      include: { project: true },
    });

    const summaryMap = new Map<string, SummaryByProject>();

    for (const entry of entries) {
      const projectId = entry.projectId || 'no-project';
      if (!summaryMap.has(projectId)) {
        summaryMap.set(projectId, {
          projectId,
          projectName: entry.project?.name || 'No Project',
          totalSeconds: 0,
          totalBillable: 0,
          entryCount: 0,
        });
      }

      const summary = summaryMap.get(projectId)!;
      summary.totalSeconds += entry.duration || 0;
      summary.entryCount += 1;
      if (entry.billable) {
        summary.totalBillable += entry.duration || 0;
      }
    }

    return Array.from(summaryMap.values()).sort((a, b) => b.totalSeconds - a.totalSeconds);
  }

  /**
   * AIDEV-NOTE: Get summary by day
   */
  async getSummaryByDay(
    user: { id: string; role: string; teamId: string | null },
    filters: ReportFilters
  ): Promise<SummaryByDay[]> {
    const allowedUserIds = await this.getUserIdsByRole(user);
    const where = this.buildWhereClause(filters, allowedUserIds);

    const entries = await prisma.timeEntry.findMany({
      where,
    });

    const summaryMap = new Map<string, SummaryByDay>();

    for (const entry of entries) {
      const date = new Date(entry.startTime).toISOString().split('T')[0];
      if (!summaryMap.has(date)) {
        summaryMap.set(date, {
          date,
          totalSeconds: 0,
          billableSeconds: 0,
          entryCount: 0,
        });
      }

      const summary = summaryMap.get(date)!;
      summary.totalSeconds += entry.duration || 0;
      summary.entryCount += 1;
      if (entry.billable) {
        summary.billableSeconds += entry.duration || 0;
      }
    }

    return Array.from(summaryMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * AIDEV-NOTE: Get summary by user
   */
  async getSummaryByUser(
    user: { id: string; role: string; teamId: string | null },
    filters: ReportFilters
  ): Promise<SummaryByUser[]> {
    const allowedUserIds = await this.getUserIdsByRole(user);
    const where = this.buildWhereClause(filters, allowedUserIds);

    const entries = await prisma.timeEntry.findMany({
      where,
      include: { user: { select: { id: true, name: true } } },
    });

    const summaryMap = new Map<string, SummaryByUser>();

    for (const entry of entries) {
      if (!summaryMap.has(entry.userId)) {
        summaryMap.set(entry.userId, {
          userId: entry.userId,
          userName: entry.user.name,
          totalSeconds: 0,
          totalBillable: 0,
          entryCount: 0,
        });
      }

      const summary = summaryMap.get(entry.userId)!;
      summary.totalSeconds += entry.duration || 0;
      summary.entryCount += 1;
      if (entry.billable) {
        summary.totalBillable += entry.duration || 0;
      }
    }

    return Array.from(summaryMap.values()).sort((a, b) => b.totalSeconds - a.totalSeconds);
  }

  /**
   * AIDEV-NOTE: Get dashboard summary
   */
  async getDashboard(user: { id: string; role: string; teamId: string | null }) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const weekStart = new Date();
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const userIds = await this.getUserIdsByRole(user);

    // Today's entries
    const todayEntries = await prisma.timeEntry.findMany({
      where: {
        userId: { in: userIds },
        startTime: { gte: todayStart, lte: todayEnd },
        endTime: { not: null },
      },
    });

    const todayTotal = todayEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);

    // Week's entries
    const weekEntries = await prisma.timeEntry.findMany({
      where: {
        userId: { in: userIds },
        startTime: { gte: weekStart, lte: weekEnd },
        endTime: { not: null },
      },
    });

    const weekTotal = weekEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);

    // Active timer (only for current user)
    const activeTimer = await prisma.timeEntry.findFirst({
      where: {
        userId: user.id,
        endTime: null,
      },
      include: { project: true, task: true },
    });

    // Recent entries (last 5 for current user)
    const recentEntries = await prisma.timeEntry.findMany({
      where: {
        userId: user.id,
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
}
