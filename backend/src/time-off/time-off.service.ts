import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateTimeOffDto {
  type: string; // PTO, SICK, PARENTAL, BEREAVEMENT, OTHER
  startDate: string;
  endDate: string;
  hours: number;
  notes?: string;
}

export interface TimeOffPolicyDto {
  name: string;
  type: string;
  accrualRate: number;
  maxBalance?: number;
  isPaid?: boolean;
}

export interface TimeOffBalance {
  policyType: string;
  policyName: string;
  accrued: number;
  used: number;
  pending: number;
  available: number;
  isPaid: boolean;
}

@Injectable()
export class TimeOffService {
  /**
   * AIDEV-NOTE: Request time off
   */
  async requestTimeOff(
    userId: string,
    dto: CreateTimeOffDto,
  ): Promise<{ success: boolean; timeOff?: any; message: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { teamId: true },
    });

    if (!user?.teamId) {
      return { success: false, message: 'User is not part of a team' };
    }

    // Check if dates are valid
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (endDate < startDate) {
      return { success: false, message: 'End date must be after start date' };
    }

    // Check for overlapping requests
    const existing = await prisma.timeOff.findFirst({
      where: {
        userId,
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
    });

    if (existing) {
      return { success: false, message: 'Overlapping time off request exists' };
    }

    const timeOff = await prisma.timeOff.create({
      data: {
        userId,
        type: dto.type,
        startDate,
        endDate,
        hours: dto.hours,
        notes: dto.notes || null,
        status: 'PENDING',
      },
    });

    return {
      success: true,
      timeOff,
      message: 'Time off request submitted',
    };
  }

  /**
   * AIDEV-NOTE: Get user's time off requests
   */
  async getMyTimeOff(userId: string): Promise<any[]> {
    return prisma.timeOff.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' },
    });
  }

  /**
   * AIDEV-NOTE: Get pending time off requests (for managers/admins)
   */
  async getPendingRequests(
    requesterId: string,
    requesterRole: string,
    requesterTeamId: string | null,
  ): Promise<any[]> {
    let userIds: string[];

    if (requesterRole === 'ADMIN') {
      const allUsers = await prisma.user.findMany({ select: { id: true } });
      userIds = allUsers.map(u => u.id);
    } else if (requesterRole === 'MANAGER' && requesterTeamId) {
      const teamUsers = await prisma.user.findMany({
        where: { teamId: requesterTeamId },
        select: { id: true },
      });
      userIds = teamUsers.map(u => u.id);
    } else {
      return [];
    }

    return prisma.timeOff.findMany({
      where: {
        userId: { in: userIds },
        status: 'PENDING',
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  /**
   * AIDEV-NOTE: Approve time off request
   */
  async approveRequest(
    approverId: string,
    timeOffId: string,
  ): Promise<{ success: boolean; message: string }> {
    const timeOff = await prisma.timeOff.findUnique({
      where: { id: timeOffId },
      include: { user: true },
    });

    if (!timeOff) {
      return { success: false, message: 'Request not found' };
    }

    if (timeOff.status !== 'PENDING') {
      return { success: false, message: 'Request is not pending' };
    }

    await prisma.timeOff.update({
      where: { id: timeOffId },
      data: {
        status: 'APPROVED',
        approvedBy: approverId,
        approvedAt: new Date(),
      },
    });

    return { success: true, message: 'Time off approved' };
  }

  /**
   * AIDEV-NOTE: Reject time off request
   */
  async rejectRequest(
    approverId: string,
    timeOffId: string,
    reason: string,
  ): Promise<{ success: boolean; message: string }> {
    const timeOff = await prisma.timeOff.findUnique({
      where: { id: timeOffId },
    });

    if (!timeOff) {
      return { success: false, message: 'Request not found' };
    }

    if (timeOff.status !== 'PENDING') {
      return { success: false, message: 'Request is not pending' };
    }

    await prisma.timeOff.update({
      where: { id: timeOffId },
      data: {
        status: 'REJECTED',
        approvedBy: approverId,
        approvedAt: new Date(),
        rejectionReason: reason,
      },
    });

    return { success: true, message: 'Time off rejected' };
  }

  /**
   * AIDEV-NOTE: Cancel time off request
   */
  async cancelRequest(
    userId: string,
    timeOffId: string,
  ): Promise<{ success: boolean; message: string }> {
    const timeOff = await prisma.timeOff.findFirst({
      where: { id: timeOffId, userId },
    });

    if (!timeOff) {
      return { success: false, message: 'Request not found' };
    }

    if (timeOff.status === 'APPROVED') {
      return { success: false, message: 'Cannot cancel approved request' };
    }

    await prisma.timeOff.update({
      where: { id: timeOffId },
      data: { status: 'CANCELLED' },
    });

    return { success: true, message: 'Request cancelled' };
  }

  /**
   * AIDEV-NOTE: Get time off balances for user
   */
  async getBalances(userId: string): Promise<TimeOffBalance[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { teamId: true },
    });

    if (!user?.teamId) {
      return [];
    }

    const policies = await prisma.timeOffPolicy.findMany({
      where: { teamId: user.teamId, isActive: true },
    });

    const balances: TimeOffBalance[] = [];

    for (const policy of policies) {
      // Calculate used hours
      const approvedTimeOff = await prisma.timeOff.findMany({
        where: {
          userId,
          type: policy.type,
          status: 'APPROVED',
        },
      });

      const pendingTimeOff = await prisma.timeOff.findMany({
        where: {
          userId,
          type: policy.type,
          status: 'PENDING',
        },
      });

      const usedHours = approvedTimeOff.reduce((sum, t) => sum + Number(t.hours), 0);
      const pendingHours = pendingTimeOff.reduce((sum, t) => sum + Number(t.hours), 0);
      const accruedHours = Number(policy.accrualRate) * 12; // Assuming monthly accrual, 12 months
      const maxBalance = policy.maxBalance ? Number(policy.maxBalance) : Infinity;

      balances.push({
        policyType: policy.type,
        policyName: policy.name,
        accrued: Math.min(accruedHours, maxBalance),
        used: usedHours,
        pending: pendingHours,
        available: Math.max(0, Math.min(accruedHours, maxBalance) - usedHours - pendingHours),
        isPaid: policy.isPaid,
      });
    }

    return balances;
  }

  /**
   * AIDEV-NOTE: Create time off policy (for managers/admins)
   */
  async createPolicy(
    teamId: string,
    dto: TimeOffPolicyDto,
  ): Promise<any> {
    return prisma.timeOffPolicy.create({
      data: {
        teamId,
        name: dto.name,
        type: dto.type,
        accrualRate: dto.accrualRate,
        maxBalance: dto.maxBalance || null,
        isPaid: dto.isPaid ?? true,
        isActive: true,
      },
    });
  }

  /**
   * AIDEV-NOTE: Get team policies
   */
  async getTeamPolicies(teamId: string): Promise<any[]> {
    return prisma.timeOffPolicy.findMany({
      where: { teamId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }
}
