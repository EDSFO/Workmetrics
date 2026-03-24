import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { Role } from '../auth/roles/role.enum';
import { AuditService } from './audit.service';

@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * AIDEV-NOTE: Get audit logs with filters
   */
  @Get('logs')
  @Roles(Role.ADMIN, Role.OWNER)
  @ApiOperation({ summary: 'Get audit logs with filters' })
  async getAuditLogs(
    @Request() req: any,
    @Query('action') action?: string,
    @Query('resource') resource?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    if (!req.user.teamId) {
      return { logs: [], total: 0, error: 'User is not part of a team' };
    }

    return this.auditService.getAuditLogs({
      teamId: req.user.teamId,
      action,
      resource,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit, 10) : 100,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }

  /**
   * AIDEV-NOTE: Get audit statistics
   */
  @Get('stats')
  @Roles(Role.ADMIN, Role.OWNER)
  @ApiOperation({ summary: 'Get audit statistics' })
  async getAuditStats(
    @Request() req: any,
    @Query('days') days?: string,
  ) {
    if (!req.user.teamId) {
      return { error: 'User is not part of a team' };
    }

    return this.auditService.getAuditStats(
      req.user.teamId,
      days ? parseInt(days, 10) : 30,
    );
  }

  /**
   * AIDEV-NOTE: Get security events
   */
  @Get('security')
  @Roles(Role.ADMIN, Role.OWNER)
  @ApiOperation({ summary: 'Get security events' })
  async getSecurityEvents(
    @Request() req: any,
    @Query('limit') limit?: string,
  ) {
    if (!req.user.teamId) {
      return { events: [], error: 'User is not part of a team' };
    }

    return this.auditService.getSecurityEvents(
      req.user.teamId,
      limit ? parseInt(limit, 10) : 100,
    );
  }

  /**
   * AIDEV-NOTE: Get resource audit history
   */
  @Get('resource/:resource/:resourceId')
  @Roles(Role.ADMIN, Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Get audit history for a specific resource' })
  async getResourceAuditHistory(
    @Param('resource') resource: string,
    @Param('resourceId') resourceId: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditService.getResourceAuditHistory(
      resource,
      resourceId,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  /**
   * AIDEV-NOTE: Get user activity
   */
  @Get('user/:userId')
  @Roles(Role.ADMIN, Role.OWNER)
  @ApiOperation({ summary: 'Get activity log for a specific user' })
  async getUserActivity(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditService.getUserActivity(
      userId,
      limit ? parseInt(limit, 10) : 50,
    );
  }
}