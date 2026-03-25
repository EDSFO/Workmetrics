import { Injectable } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface CalendarEntry {
  id: string;
  userId: string;
  userName: string;
  projectId: string | null;
  projectName: string | null;
  taskId: string | null;
  taskName: string | null;
  startTime: Date;
  endTime: Date | null;
  duration: number | null;
  description: string | null;
  billable: boolean;
  type: string;
  status: string;
}

export interface DayEntries {
  date: string;
  entries: CalendarEntry[];
  totalDuration: number;
  totalBillable: number;
}

export interface CalendarView {
  startDate: string;
  endDate: string;
  view: 'day' | 'week' | 'month';
  days: DayEntries[];
  totalDuration: number;
  totalBillable: number;
}

@Injectable()
export class CalendarService {
  /**
   * AIDEV-NOTE: Get time entries for a date range (calendar view)
   */
  async getEntriesForDateRange(
    userId: string,
    role: string,
    teamId: string | null,
    startDate: Date,
    endDate: Date,
    view: 'day' | 'week' | 'month' = 'week',
  ): Promise<CalendarView> {
    // Determine which user IDs to fetch based on role
    let userIds: string[];

    if (role === 'ADMIN') {
      // Admin sees all users
      const allUsers = await prisma.user.findMany({ select: { id: true } });
      userIds = allUsers.map(u => u.id);
    } else if (role === 'MANAGER' && teamId) {
      // Manager sees their team's users
      const teamUsers = await prisma.user.findMany({
        where: { teamId },
        select: { id: true },
      });
      userIds = teamUsers.map(u => u.id);
    } else {
      // User sees only their own entries
      userIds = [userId];
    }

    // Fetch entries for the date range
    const entries = await prisma.timeEntry.findMany({
      where: {
        userId: { in: userIds },
        // Only TIME and AUTO entries for calendar (exclude kiosk movements)
        type: { in: ['TIME', 'AUTO'] },
        OR: [
          // Entries that started during the range
          {
            startTime: {
              gte: startDate,
              lte: endDate,
            },
          },
          // Entries that ended during the range
          {
            endTime: {
              gte: startDate,
              lte: endDate,
            },
          },
          // Entries that span the entire range
          {
            startTime: { lte: startDate },
            endTime: { gte: endDate },
          },
          // Active entries (no endTime) that started before range end
          {
            startTime: { lte: endDate },
            endTime: null,
          },
        ],
      },
      include: {
        user: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        task: { select: { id: true, name: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    // Transform entries to CalendarEntry format
    const transformedEntries: CalendarEntry[] = entries.map(entry => ({
      id: entry.id,
      userId: entry.userId,
      userName: entry.user.name,
      projectId: entry.projectId,
      projectName: entry.project?.name || null,
      taskId: entry.taskId,
      taskName: entry.task?.name || null,
      startTime: entry.startTime,
      endTime: entry.endTime,
      duration: entry.duration,
      description: entry.description,
      billable: entry.billable,
      type: entry.type,
      status: entry.status,
    }));

    // Group entries by day
    const daysMap = new Map<string, DayEntries>();

    // Initialize all days in the range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      daysMap.set(dateKey, {
        date: dateKey,
        entries: [],
        totalDuration: 0,
        totalBillable: 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Populate entries into their respective days
    for (const entry of transformedEntries) {
      const entryDate = entry.startTime.toISOString().split('T')[0];
      const dayEntry = daysMap.get(entryDate);

      if (dayEntry) {
        dayEntry.entries.push(entry);
        dayEntry.totalDuration += entry.duration || 0;
        if (entry.billable) {
          dayEntry.totalBillable += entry.duration || 0;
        }
      }
    }

    const days = Array.from(daysMap.values());
    const totalDuration = days.reduce((sum, day) => sum + day.totalDuration, 0);
    const totalBillable = days.reduce((sum, day) => sum + day.totalBillable, 0);

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      view,
      days,
      totalDuration,
      totalBillable,
    };
  }

  /**
   * AIDEV-NOTE: Get entries for a specific month
   */
  async getMonthEntries(
    userId: string,
    role: string,
    teamId: string | null,
    year: number,
    month: number, // 1-12
  ): Promise<CalendarView> {
    // Start of month
    const startDate = new Date(year, month - 1, 1);
    startDate.setHours(0, 0, 0, 0);

    // End of month
    const endDate = new Date(year, month, 0);
    endDate.setHours(23, 59, 59, 999);

    return this.getEntriesForDateRange(userId, role, teamId, startDate, endDate, 'month');
  }

  /**
   * AIDEV-NOTE: Get entries for a specific week
   */
  async getWeekEntries(
    userId: string,
    role: string,
    teamId: string | null,
    weekStartDate: Date,
  ): Promise<CalendarView> {
    // Ensure we start from Monday
    const day = weekStartDate.getDay();
    const diff = weekStartDate.getDate() - day + (day === 0 ? -6 : 1);
    weekStartDate.setDate(diff);
    weekStartDate.setHours(0, 0, 0, 0);

    // Calculate week end (Sunday 23:59:59)
    const weekEnd = new Date(weekStartDate);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return this.getEntriesForDateRange(userId, role, teamId, weekStartDate, weekEnd, 'week');
  }

  /**
   * AIDEV-NOTE: Get entries for a specific day
   */
  async getDayEntries(
    userId: string,
    role: string,
    teamId: string | null,
    date: Date,
  ): Promise<CalendarView> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    return this.getEntriesForDateRange(userId, role, teamId, startDate, endDate, 'day');
  }

  /**
   * AIDEV-NOTE: Update time entry (for drag-and-drop editing)
   */
  async updateEntry(
    entryId: string,
    userId: string,
    role: string,
    teamId: string | null,
    updates: {
      startTime?: Date;
      endTime?: Date;
      projectId?: string | null;
      taskId?: string | null;
      description?: string | null;
      billable?: boolean;
    },
  ): Promise<{ success: boolean; entry?: CalendarEntry; error?: string }> {
    // First, find the entry
    const entry = await prisma.timeEntry.findUnique({
      where: { id: entryId },
      include: {
        user: { select: { id: true, name: true, teamId: true } },
        project: { select: { id: true, name: true } },
        task: { select: { id: true, name: true } },
      },
    });

    if (!entry) {
      return { success: false, error: 'Entry not found' };
    }

    // Check authorization
    if (role !== 'ADMIN') {
      if (role === 'MANAGER') {
        // Manager can only update their team's entries
        if (entry.user.teamId !== teamId) {
          return { success: false, error: 'Not authorized to update this entry' };
        }
      } else {
        // User can only update their own entries
        if (entry.userId !== userId) {
          return { success: false, error: 'Not authorized to update this entry' };
        }
      }
    }

    // Calculate new duration if times changed
    let duration: number | undefined;
    if (updates.startTime && updates.endTime) {
      duration = Math.floor((updates.endTime.getTime() - updates.startTime.getTime()) / 1000);
    } else if (updates.startTime && entry.endTime) {
      duration = Math.floor((entry.endTime.getTime() - updates.startTime.getTime()) / 1000);
    } else if (updates.endTime && entry.startTime) {
      duration = Math.floor((updates.endTime.getTime() - entry.startTime.getTime()) / 1000);
    }

    const updated = await prisma.timeEntry.update({
      where: { id: entryId },
      data: {
        startTime: updates.startTime,
        endTime: updates.endTime,
        duration,
        projectId: updates.projectId,
        taskId: updates.taskId,
        description: updates.description,
        billable: updates.billable,
      },
      include: {
        user: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        task: { select: { id: true, name: true } },
      },
    });

    return {
      success: true,
      entry: {
        id: updated.id,
        userId: updated.userId,
        userName: updated.user.name,
        projectId: updated.projectId,
        projectName: updated.project?.name || null,
        taskId: updated.taskId,
        taskName: updated.task?.name || null,
        startTime: updated.startTime,
        endTime: updated.endTime,
        duration: updated.duration,
        description: updated.description,
        billable: updated.billable,
        type: updated.type,
        status: updated.status,
      },
    };
  }
}
