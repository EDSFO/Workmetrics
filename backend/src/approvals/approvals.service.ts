import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface TimesheetSubmission {
  id: string;
  userId: string;
  userName: string;
  periodStart: string;
  periodEnd: string;
  totalHours: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  entries: TimeEntrySummary[];
}

export interface TimeEntrySummary {
  id: string;
  date: string;
  projectName: string;
  taskName: string;
  hours: number;
  description: string;
  billable: boolean;
}

@Injectable()
export class ApprovalsService {
  /**
   * AIDEV-NOTE: Submit a timesheet for approval
   */
  async submitTimesheet(
    userId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<{ success: boolean; message: string }> {
    // Get user's team
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { teamId: true },
    });

    if (!user?.teamId) {
      return { success: false, message: 'User is not part of a team' };
    }

    // Get all completed entries in the period
    const entries = await prisma.timeEntry.findMany({
      where: {
        userId,
        startTime: { gte: periodStart },
        endTime: { lte: periodEnd },
        endTime: { not: null },
        type: { in: ['TIME', 'AUTO'] },
      },
      include: {
        project: { select: { name: true } },
        task: { select: { name: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    if (entries.length === 0) {
      return { success: false, message: 'No entries found for this period' };
    }

    // Update all entries to PENDING status
    await prisma.timeEntry.updateMany({
      where: {
        userId,
        startTime: { gte: periodStart },
        endTime: { lte: periodEnd },
        id: { in: entries.map(e => e.id) },
      },
      data: { status: 'PENDING' },
    });

    return {
      success: true,
      message: `Submitted ${entries.length} entries for approval`,
    };
  }

  /**
   * AIDEV-NOTE: Get pending approvals for manager/admin
   */
  async getPendingApprovals(
    requesterId: string,
    requesterRole: string,
    requesterTeamId: string | null,
  ): Promise<any[]> {
    let userIds: string[];

    if (requesterRole === 'ADMIN') {
      // Admin sees all pending
      const allUsers = await prisma.user.findMany({ select: { id: true } });
      userIds = allUsers.map(u => u.id);
    } else if (requesterRole === 'MANAGER' && requesterTeamId) {
      // Manager sees their team's pending
      const teamUsers = await prisma.user.findMany({
        where: { teamId: requesterTeamId },
        select: { id: true },
      });
      userIds = teamUsers.map(u => u.id);
    } else {
      return [];
    }

    const pendingEntries = await prisma.timeEntry.findMany({
      where: {
        userId: { in: userIds },
        status: 'PENDING',
        endTime: { not: null },
        type: { in: ['TIME', 'AUTO'] },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
        task: { select: { id: true, name: true } },
      },
      orderBy: { startTime: 'desc' },
    });

    // Group by user
    const groupedByUser = new Map<string, any>();
    for (const entry of pendingEntries) {
      const userId = entry.userId;
      if (!groupedByUser.has(userId)) {
        groupedByUser.set(userId, {
          userId,
          userName: entry.user.name,
          userEmail: entry.user.email,
          entries: [],
          totalHours: 0,
        });
      }
      const group = groupedByUser.get(userId);
      const hours = (entry.duration || 0) / 3600;
      group.entries.push({
        id: entry.id,
        date: entry.startTime.toISOString().split('T')[0],
        projectName: entry.project?.name || 'No Project',
        taskName: entry.task?.name || 'No Task',
        hours: parseFloat(hours.toFixed(2)),
        description: entry.description,
        billable: entry.billable,
      });
      group.totalHours += hours;
    }

    // Calculate total hours per user
    return Array.from(groupedByUser.values()).map(group => ({
      ...group,
      totalHours: parseFloat(group.totalHours.toFixed(2)),
    }));
  }

  /**
   * AIDEV-NOTE: Approve entries for a user
   */
  async approveEntries(
    approverId: string,
    targetUserId: string,
    entryIds: string[],
    comments?: string,
  ): Promise<{ success: boolean; message: string }> {
    // Verify approver has permission
    const approver = await prisma.user.findUnique({
      where: { id: approverId },
      select: { role: true, teamId: true },
    });

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { teamId: true },
    });

    if (!approver || !targetUser) {
      return { success: false, message: 'User not found' };
    }

    // Managers can only approve their team's entries
    if (approver.role === 'MANAGER' && approver.teamId !== targetUser.teamId) {
      return { success: false, message: 'Not authorized to approve these entries' };
    }

    // Update entries
    await prisma.timeEntry.updateMany({
      where: {
        id: { in: entryIds },
        userId: targetUserId,
        status: 'PENDING',
      },
      data: {
        status: 'APPROVED',
        description: comments
          ? (entry: any) => `${entry.description || ''}\n\nApproved by: ${comments}`.trim()
          : undefined,
      },
    });

    return {
      success: true,
      message: `${entryIds.length} entries approved`,
    };
  }

  /**
   * AIDEV-NOTE: Reject entries for a user
   */
  async rejectEntries(
    approverId: string,
    targetUserId: string,
    entryIds: string[],
    reason: string,
  ): Promise<{ success: boolean; message: string }> {
    // Verify approver has permission
    const approver = await prisma.user.findUnique({
      where: { id: approverId },
      select: { role: true, teamId: true },
    });

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { teamId: true },
    });

    if (!approver || !targetUser) {
      return { success: false, message: 'User not found' };
    }

    // Managers can only reject their team's entries
    if (approver.role === 'MANAGER' && approver.teamId !== targetUser.teamId) {
      return { success: false, message: 'Not authorized to reject these entries' };
    }

    // Update entries
    for (const entryId of entryIds) {
      const entry = await prisma.timeEntry.findUnique({ where: { id: entryId } });
      if (entry) {
        const rejectionNote = `\n\n--- Rejected ---\nReason: ${reason}`;
        await prisma.timeEntry.update({
          where: { id: entryId },
          data: {
            status: 'REJECTED',
            description: entry.description
              ? `${entry.description}${rejectionNote}`
              : rejectionNote,
          },
        });
      }
    }

    return {
      success: true,
      message: `${entryIds.length} entries rejected`,
    };
  }

  /**
   * AIDEV-NOTE: Get approval history for a user
   */
  async getApprovalHistory(
    userId: string,
    limit: number = 50,
  ): Promise<any[]> {
    const entries = await prisma.timeEntry.findMany({
      where: {
        userId,
        status: { in: ['APPROVED', 'REJECTED'] },
      },
      include: {
        project: { select: { name: true } },
        task: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    return entries.map(entry => ({
      id: entry.id,
      date: entry.startTime.toISOString().split('T')[0],
      projectName: entry.project?.name || 'No Project',
      taskName: entry.task?.name || 'No Task',
      hours: entry.duration ? parseFloat((entry.duration / 3600).toFixed(2)) : 0,
      status: entry.status,
      description: entry.description,
      updatedAt: entry.updatedAt,
    }));
  }

  /**
   * AIDEV-NOTE: Get user's pending entries count
   */
  async getPendingCount(userId: string): Promise<number> {
    return prisma.timeEntry.count({
      where: {
        userId,
        status: 'PENDING',
      },
    });
  }
}
