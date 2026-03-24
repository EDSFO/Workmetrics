import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GdprService } from './gdpr.service';

@ApiTags('gdpr')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('gdpr')
export class GdprController {
  constructor(private readonly gdprService: GdprService) {}

  // ============================================
  // DATA EXPORT (ARTICLE 20)
  // ============================================

  /**
   * AIDEV-NOTE: Request data export
   */
  @Post('export')
  @ApiOperation({ summary: 'Request data export (GDPR Article 20)' })
  async requestExport(@Request() req: any) {
    return this.gdprService.requestExport(req.user.id);
  }

  /**
   * AIDEV-NOTE: Get export status
   */
  @Get('export/:exportId')
  @ApiOperation({ summary: 'Get data export status' })
  async getExportStatus(@Param('exportId') exportId: string, @Request() req: any) {
    return this.gdprService.getExportStatus(exportId, req.user.id);
  }

  /**
   * AIDEV-NOTE: Export all user data
   */
  @Get('export/:exportId/download')
  @ApiOperation({ summary: 'Download exported data' })
  async downloadExport(@Param('exportId') exportId: string, @Request() req: any) {
    const exportData = await this.gdprService.exportUserData(req.user.id);

    if (!exportData.success) {
      return { success: false, error: exportData.error };
    }

    return {
      success: true,
      data: exportData.data,
      message: 'Data export retrieved successfully',
    };
  }

  // ============================================
  // DATA DELETION (ARTICLE 17)
  // ============================================

  /**
   * AIDEV-NOTE: Delete user account and data
   */
  @Delete('account')
  @ApiOperation({ summary: 'Delete account and all user data (GDPR Article 17)' })
  async deleteAccount(
    @Request() req: any,
    @Body() body: { confirmDeletion: boolean; anonymizeInstead?: boolean },
  ) {
    if (!body.confirmDeletion) {
      return { success: false, error: 'Deletion must be confirmed' };
    }

    return this.gdprService.deleteUserData(
      req.user.id,
      body.anonymizeInstead ?? false,
    );
  }

  // ============================================
  // CONSENT MANAGEMENT
  // ============================================

  /**
   * AIDEV-NOTE: Record user consent
   */
  @Post('consent')
  @ApiOperation({ summary: 'Record user consent' })
  async recordConsent(
    @Request() req: any,
    @Body() body: { consentType: string; granted: boolean },
  ) {
    return this.gdprService.recordConsent(
      req.user.id,
      body.consentType,
      body.granted,
    );
  }

  /**
   * AIDEV-NOTE: Get user consents
   */
  @Get('consent')
  @ApiOperation({ summary: 'Get user consents' })
  async getConsents(@Request() req: any) {
    const consents = await this.gdprService.getUserConsents(req.user.id);
    return { consents };
  }

  // ============================================
  // DATA RETENTION
  // ============================================

  /**
   * AIDEV-NOTE: Get retention policy
   */
  @Get('retention')
  @ApiOperation({ summary: 'Get data retention policy' })
  async getRetentionPolicy(@Request() req: any) {
    if (!req.user.teamId) {
      return { success: false, error: 'User is not part of a team' };
    }
    return this.gdprService.getRetentionPolicy(req.user.teamId);
  }
}