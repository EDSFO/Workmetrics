import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class GdprService {
  // ============================================
  // DATA EXPORT (ARTICLE 20)
  // ============================================

  /**
   * AIDEV-NOTE: Request data export for a user
   */
  async requestExport(userId: string): Promise<{ success: boolean; exportId?: string; error?: string }> {
    try {
      // Check for existing pending export
      const existing = await prisma.dataExport.findFirst({
        where: {
          userId,
          status: { in: ['pending', 'processing'] },
        },
      });

      if (existing) {
        return { success: true, exportId: existing.id };
      }

      const exportRecord = await prisma.dataExport.create({
        data: {
          userId,
          status: 'pending',
          format: 'json',
          requestedAt: new Date(),
        },
      });

      // In production, trigger async export job
      this.processExportAsync(exportRecord.id);

      return { success: true, exportId: exportRecord.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * AIDEV-NOTE: Process export asynchronously (simplified)
   */
  private async processExportAsync(exportId: string): Promise<void> {
    try {
      await prisma.dataExport.update({
        where: { id: exportId },
        data: { status: 'processing' },
      });

      // In production, generate actual file and upload to storage
      // For now, just mark as completed after a delay
      setTimeout(async () => {
        await prisma.dataExport.update({
          where: { id: exportId },
          data: {
            status: 'completed',
            completedAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          },
        });
      }, 5000);
    } catch (error) {
      await prisma.dataExport.update({
        where: { id: exportId },
        data: { status: 'failed' },
      });
    }
  }

  /**
   * AIDEV-NOTE: Get export status
   */
  async getExportStatus(exportId: string, userId: string): Promise<any> {
    const exportRecord = await prisma.dataExport.findFirst({
      where: { id: exportId, userId },
    });

    if (!exportRecord) {
      return null;
    }

    return {
      id: exportRecord.id,
      status: exportRecord.status,
      format: exportRecord.format,
      expiresAt: exportRecord.expiresAt,
      requestedAt: exportRecord.requestedAt,
      completedAt: exportRecord.completedAt,
    };
  }

  /**
   * AIDEV-NOTE: Export all user data (GDPR Article 20)
   */
  async exportUserData(userId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          teamId: true,
          hourlyRate: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Get all user's time entries
      const timeEntries = await prisma.timeEntry.findMany({
        where: { userId },
        include: {
          project: true,
          task: true,
        },
      });

      // Get user's team
      const team = user.teamId
        ? await prisma.team.findUnique({
            where: { id: user.teamId },
          })
        : null;

      // Get user's projects
      const projects = await prisma.project.findMany({
        where: { teamId: user.teamId },
      });

      // Get user's tasks
      const tasks = await prisma.task.findMany({
        where: {
          project: { teamId: user.teamId },
        },
      });

      // Get time off requests
      const timeOff = await prisma.timeOff.findMany({
        where: { userId },
      });

      // Compile all data
      const data = {
        exportedAt: new Date().toISOString(),
        user,
        timeEntries: timeEntries.map(entry => ({
          ...entry,
          startTime: entry.startTime.toISOString(),
          endTime: entry.endTime?.toISOString(),
          createdAt: entry.createdAt.toISOString(),
          updatedAt: entry.updatedAt.toISOString(),
        })),
        team,
        projects,
        tasks,
        timeOffRequests: timeOff.map(t => ({
          ...t,
          startDate: t.startDate.toISOString(),
          endDate: t.endDate.toISOString(),
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
        })),
      };

      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // DATA DELETION (ARTICLE 17)
  // ============================================

  /**
   * AIDEV-NOTE: Delete all user data (Right to Erasure / Right to be Forgotten)
   * This is GDPR Article 17 - right to erasure
   */
  async deleteUserData(
    userId: string,
    anonymizeInstead: boolean = false,
  ): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      if (anonymizeInstead) {
        // Anonymize instead of deleting (keeps aggregates for reports)
        await prisma.user.update({
          where: { id: userId },
          data: {
            email: `deleted_${Date.now()}@anonymized.local`,
            name: 'Deleted User',
            passwordHash: 'DELETED',
            // Keep role and team for historical records
          },
        });

        // Anonymize time entries
        await prisma.timeEntry.updateMany({
          where: { userId },
          data: {
            description: '[DELETED USER DATA]',
          },
        });

        return {
          success: true,
          message: 'User data has been anonymized. Historical records preserved.',
        };
      } else {
        // Full deletion

        // Delete time entries
        await prisma.timeEntry.deleteMany({
          where: { userId },
        });

        // Delete time off requests
        await prisma.timeOff.deleteMany({
          where: { userId },
        });

        // Delete scheduled entries
        await prisma.scheduledEntry.deleteMany({
          where: { userId },
        });

        // Delete data exports
        await prisma.dataExport.deleteMany({
          where: { userId },
        });

        // Delete user
        await prisma.user.delete({
          where: { id: userId },
        });

        return {
          success: true,
          message: 'All user data has been permanently deleted.',
        };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // CONSENT MANAGEMENT
  // ============================================

  /**
   * AIDEV-NOTE: Record user consent
   */
  async recordConsent(
    userId: string,
    consentType: string,
    granted: boolean,
    ipAddress?: string,
  ): Promise<{ success: boolean }> {
    // In production, create a dedicated Consent model
    // For now, we'll use audit log for this
    await prisma.auditLog.create({
      data: {
        userId,
        action: `consent.${consentType}.${granted ? 'granted' : 'revoked'}`,
        resource: 'Consent',
        details: { consentType, granted, timestamp: new Date().toISOString() },
        ipAddress,
        status: 'success',
      },
    });

    return { success: true };
  }

  /**
   * AIDEV-NOTE: Check user consents
   */
  async getUserConsents(userId: string): Promise<any[]> {
    const logs = await prisma.auditLog.findMany({
      where: {
        userId,
        action: { startsWith: 'consent.' },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Parse consent records from audit logs
    const consents = new Map<string, any>();

    for (const log of logs) {
      const parts = log.action.split('.');
      if (parts.length >= 3) {
        const consentType = parts[1];
        const status = parts[2];
        if (!consents.has(consentType) || status === 'granted') {
          consents.set(consentType, {
            consentType,
            granted: status === 'granted',
            grantedAt: status === 'granted' ? log.createdAt : null,
            revokedAt: status === 'revoked' ? log.createdAt : null,
          });
        }
      }
    }

    return Array.from(consents.values());
  }

  // ============================================
  // DATA RETENTION
  // ============================================

  /**
   * AIDEV-NOTE: Get data retention policy
   */
  async getRetentionPolicy(teamId: string): Promise<any> {
    // In production, this would be configurable per organization
    return {
      timeEntries: { retentionDays: 2555, description: '7 years for tax compliance' }, // ~7 years
      auditLogs: { retentionDays: 365, description: '1 year for security' },
      timeOffRequests: { retentionDays: 2555, description: '7 years for HR compliance' },
    };
  }

  /**
   * AIDEV-NOTE: Delete expired data based on retention policy
   */
  async applyRetentionPolicy(teamId: string): Promise<{ deletedCount: number }> {
    // This would be called by a scheduled job
    // For now, just a placeholder
    return { deletedCount: 0 };
  }
}
