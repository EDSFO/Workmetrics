import { Controller, Get, Post, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { Role } from '../auth/roles/role.enum';
import { ApprovalsService } from './approvals.service';

@ApiTags('approvals')
@Controller('approvals')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  /**
   * AIDEV-NOTE: Submit timesheet for approval
   */
  @Post('submit')
  @Roles(Role.ADMIN, Role.MANAGER, Role.MEMBER)
  @ApiOperation({ summary: 'Submit timesheet for approval' })
  async submitTimesheet(
    @Request() req: any,
    @Body() body: { periodStart: string; periodEnd: string },
  ) {
    return this.approvalsService.submitTimesheet(
      req.user.id,
      new Date(body.periodStart),
      new Date(body.periodEnd),
    );
  }

  /**
   * AIDEV-NOTE: Get pending approvals (for managers/admins)
   */
  @Get('pending')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Get pending approvals for team' })
  async getPendingApprovals(@Request() req: any) {
    return this.approvalsService.getPendingApprovals(
      req.user.id,
      req.user.role,
      req.user.teamId,
    );
  }

  /**
   * AIDEV-NOTE: Approve entries
   */
  @Post('approve')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Approve time entries' })
  async approveEntries(
    @Request() req: any,
    @Body() body: { userId: string; entryIds: string[]; comments?: string },
  ) {
    return this.approvalsService.approveEntries(
      req.user.id,
      body.userId,
      body.entryIds,
      body.comments,
    );
  }

  /**
   * AIDEV-NOTE: Reject entries
   */
  @Post('reject')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Reject time entries' })
  async rejectEntries(
    @Request() req: any,
    @Body() body: { userId: string; entryIds: string[]; reason: string },
  ) {
    return this.approvalsService.rejectEntries(
      req.user.id,
      body.userId,
      body.entryIds,
      body.reason,
    );
  }

  /**
   * AIDEV-NOTE: Get approval history
   */
  @Get('history')
  @Roles(Role.ADMIN, Role.MANAGER, Role.MEMBER)
  @ApiOperation({ summary: 'Get approval history for current user' })
  async getHistory(
    @Request() req: any,
    @Query('limit') limit?: string,
  ) {
    return this.approvalsService.getApprovalHistory(
      req.user.id,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  /**
   * AIDEV-NOTE: Get pending count for current user
   */
  @Get('pending/count')
  @Roles(Role.ADMIN, Role.MANAGER, Role.MEMBER)
  @ApiOperation({ summary: 'Get pending entries count for current user' })
  async getPendingCount(@Request() req: any) {
    const count = await this.approvalsService.getPendingCount(req.user.id);
    return { count };
  }
}
