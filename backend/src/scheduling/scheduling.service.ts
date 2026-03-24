import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateScheduledEntryDto {
  projectId?: string;
  taskId?: string;
  description?: string;
  billable?: boolean;
  startDate: string;
  startTime: string; // HH:mm
  duration: number; // seconds
  recurring?: boolean;
  recurringPattern?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  recurringDays?: number[]; // 0-6 (Sun-Sat) for WEEKLY
  recurringEndDate?: string;
}

export interface ScheduledEntryResponse {
  id: string;
  userId: string;
  projectId: string | null;
  projectName: string | null;
  taskId: string | null;
  taskName: string | null;
  description: string | null;
  billable: boolean;
  startDate: string;
  startTime: string;
  duration: number;
  recurring: boolean;
  recurringPattern: string | null;
  recurringDays: number[] | null;
  recurringEndDate: string | null;
  active: boolean;
}

@Injectable()
export class SchedulingService {
  /**
   * AIDEV-NOTE: Create a new scheduled entry
   */
  async createScheduledEntry(
    userId: string,
    dto: CreateScheduledEntryDto,
  ): Promise<ScheduledEntryResponse> {
    const entry = await prisma.scheduledEntry.create({
      data: {
        userId,
        projectId: dto.projectId || null,
        taskId: dto.taskId || null,
        description: dto.description || null,
        billable: dto.billable ?? true,
        startDate: new Date(dto.startDate),
        startTime: dto.startTime,
        duration: dto.duration,
        recurring: dto.recurring ?? false,
        recurringPattern: dto.recurringPattern || null,
        recurringDays: dto.recurringDays ? JSON.stringify(dto.recurringDays) : null,
        recurringEndDate: dto.recurringEndDate ? new Date(dto.recurringEndDate) : null,
        active: true,
      },
      include: {
        project: { select: { id: true, name: true } },
        task: { select: { id: true, name: true } },
      },
    });

    return this.toResponse(entry);
  }

  /**
   * AIDEV-NOTE: Get all scheduled entries for a user
   */
  async getScheduledEntries(userId: string): Promise<ScheduledEntryResponse[]> {
    const entries = await prisma.scheduledEntry.findMany({
      where: { userId, active: true },
      include: {
        project: { select: { id: true, name: true } },
        task: { select: { id: true, name: true } },
      },
      orderBy: { startDate: 'asc' },
    });

    return entries.map(entry => this.toResponse(entry));
  }

  /**
   * AIDEV-NOTE: Get upcoming generated time entries from scheduled entries
   */
  async getUpcomingEntries(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any[]> {
    const scheduledEntries = await prisma.scheduledEntry.findMany({
      where: {
        userId,
        active: true,
        startDate: { lte: endDate },
        OR: [
          { recurringEndDate: null },
          { recurringEndDate: { gte: startDate } },
        ],
      },
      include: {
        project: { select: { id: true, name: true } },
        task: { select: { id: true, name: true } },
      },
    });

    const upcomingEntries: any[] = [];

    for (const scheduled of scheduledEntries) {
      const dates = this.generateOccurrences(
        new Date(scheduled.startDate),
        scheduled.startTime,
        scheduled.duration,
        scheduled.recurring,
        scheduled.recurringPattern,
        scheduled.recurringDays ? JSON.parse(scheduled.recurringDays) : null,
        scheduled.recurringEndDate ? new Date(scheduled.recurringEndDate) : null,
        startDate,
        endDate,
      );

      for (const date of dates) {
        upcomingEntries.push({
          id: scheduled.id,
          scheduledEntryId: scheduled.id,
          date: date.toISOString(),
          startTime: scheduled.startTime,
          duration: scheduled.duration,
          projectId: scheduled.projectId,
          projectName: scheduled.project?.name || null,
          taskId: scheduled.taskId,
          taskName: scheduled.task?.name || null,
          description: scheduled.description,
          billable: scheduled.billable,
          type: 'SCHEDULED',
        });
      }
    }

    return upcomingEntries.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * AIDEV-NOTE: Generate occurrence dates based on recurring pattern
   */
  private generateOccurrences(
    startDate: Date,
    startTime: string,
    duration: number,
    recurring: boolean,
    pattern: string | null,
    days: number[] | null,
    endDate: Date | null,
    rangeStart: Date,
    rangeEnd: Date,
  ): Date[] {
    if (!recurring || !pattern) {
      // Non-recurring: just return the start date if within range
      if (startDate >= rangeStart && startDate <= rangeEnd) {
        return [this.setTimeOnDate(startDate, startTime)];
      }
      return [];
    }

    const occurrences: Date[] = [];
    const [hours, minutes] = startTime.split(':').map(Number);
    let current = new Date(startDate);
    current.setHours(hours, minutes, 0, 0);

    const maxIterations = 365; // Safety limit
    let iterations = 0;

    while (current <= rangeEnd && occurrences.length < 100) {
      iterations++;
      if (iterations > maxIterations) break;

      // Check if beyond recurring end date
      if (endDate && current > endDate) break;

      // Check if within range
      if (current >= rangeStart) {
        let include = true;

        if (pattern === 'WEEKLY' && days) {
          // Only include on specified days
          include = days.includes(current.getDay());
        }

        if (include) {
          occurrences.push(new Date(current));
        }
      }

      // Advance to next occurrence
      switch (pattern) {
        case 'DAILY':
          current.setDate(current.getDate() + 1);
          break;
        case 'WEEKLY':
          current.setDate(current.getDate() + 1);
          break;
        case 'MONTHLY':
          current.setMonth(current.getMonth() + 1);
          break;
        default:
          current.setDate(current.getDate() + 1);
      }
    }

    return occurrences;
  }

  /**
   * AIDEV-NOTE: Set time on a date
   */
  private setTimeOnDate(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  /**
   * AIDEV-NOTE: Update a scheduled entry
   */
  async updateScheduledEntry(
    id: string,
    userId: string,
    updates: Partial<CreateScheduledEntryDto>,
  ): Promise<ScheduledEntryResponse | null> {
    const existing = await prisma.scheduledEntry.findFirst({
      where: { id, userId },
    });

    if (!existing) return null;

    const entry = await prisma.scheduledEntry.update({
      where: { id },
      data: {
        projectId: updates.projectId !== undefined ? updates.projectId || null : undefined,
        taskId: updates.taskId !== undefined ? updates.taskId || null : undefined,
        description: updates.description !== undefined ? updates.description || null : undefined,
        billable: updates.billable !== undefined ? updates.billable : undefined,
        startDate: updates.startDate ? new Date(updates.startDate) : undefined,
        startTime: updates.startTime,
        duration: updates.duration,
        recurring: updates.recurring,
        recurringPattern: updates.recurringPattern,
        recurringDays: updates.recurringDays ? JSON.stringify(updates.recurringDays) : undefined,
        recurringEndDate: updates.recurringEndDate ? new Date(updates.recurringEndDate) : undefined,
      },
      include: {
        project: { select: { id: true, name: true } },
        task: { select: { id: true, name: true } },
      },
    });

    return this.toResponse(entry);
  }

  /**
   * AIDEV-NOTE: Delete/deactivate a scheduled entry
   */
  async deleteScheduledEntry(id: string, userId: string): Promise<boolean> {
    const existing = await prisma.scheduledEntry.findFirst({
      where: { id, userId },
    });

    if (!existing) return false;

    await prisma.scheduledEntry.update({
      where: { id },
      data: { active: false },
    });

    return true;
  }

  /**
   * AIDEV-NOTE: Convert to response format
   */
  private toResponse(entry: any): ScheduledEntryResponse {
    return {
      id: entry.id,
      userId: entry.userId,
      projectId: entry.projectId,
      projectName: entry.project?.name || null,
      taskId: entry.taskId,
      taskName: entry.task?.name || null,
      description: entry.description,
      billable: entry.billable,
      startDate: entry.startDate.toISOString().split('T')[0],
      startTime: entry.startTime,
      duration: entry.duration,
      recurring: entry.recurring,
      recurringPattern: entry.recurringPattern,
      recurringDays: entry.recurringDays ? JSON.parse(entry.recurringDays) : null,
      recurringEndDate: entry.recurringEndDate ? entry.recurringEndDate.toISOString().split('T')[0] : null,
      active: entry.active,
    };
  }
}
