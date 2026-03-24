import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { Role } from '../auth/roles/role.enum';
import { TimeOffService, CreateTimeOffDto, TimeOffPolicyDto } from './time-off.service';

@ApiTags('time-off')
@Controller('time-off')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TimeOffController {
  constructor(private readonly timeOffService: TimeOffService) {}

  /**
   * AIDEV-NOTE: Request time off
   */
  @Post()
  @Roles(Role.ADMIN, Role.MANAGER, Role.MEMBER)
  @ApiOperation({ summary: 'Request time off' })
  async request(@Request() req: any, @Body() dto: CreateTimeOffDto) {
    return this.timeOffService.requestTimeOff(req.user.id, dto);
  }

  /**
   * AIDEV-NOTE: Get my time off requests
   */
  @Get('my')
  @Roles(Role.ADMIN, Role.MANAGER, Role.MEMBER)
  @ApiOperation({ summary: 'Get my time off requests' })
  async getMyRequests(@Request() req: any) {
    return this.timeOffService.getMyTimeOff(req.user.id);
  }

  /**
   * AIDEV-NOTE: Get my time off balances
   */
  @Get('balances')
  @Roles(Role.ADMIN, Role.MANAGER, Role.MEMBER)
  @ApiOperation({ summary: 'Get my time off balances' })
  async getMyBalances(@Request() req: any) {
    return this.timeOffService.getBalances(req.user.id);
  }

  /**
   * AIDEV-NOTE: Cancel time off request
   */
  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.MEMBER)
  @ApiOperation({ summary: 'Cancel time off request' })
  async cancel(@Param('id') id: string, @Request() req: any) {
    return this.timeOffService.cancelRequest(req.user.id, id);
  }

  /**
   * AIDEV-NOTE: Get pending requests (for managers/admins)
   */
  @Get('pending')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Get pending time off requests for team' })
  async getPending(@Request() req: any) {
    return this.timeOffService.getPendingRequests(
      req.user.id,
      req.user.role,
      req.user.teamId,
    );
  }

  /**
   * AIDEV-NOTE: Approve time off request
   */
  @Put(':id/approve')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Approve time off request' })
  async approve(@Param('id') id: string, @Request() req: any) {
    return this.timeOffService.approveRequest(req.user.id, id);
  }

  /**
   * AIDEV-NOTE: Reject time off request
   */
  @Put(':id/reject')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Reject time off request' })
  async reject(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Request() req: any,
  ) {
    return this.timeOffService.rejectRequest(req.user.id, id, body.reason);
  }

  /**
   * AIDEV-NOTE: Get team policies
   */
  @Get('policies')
  @Roles(Role.ADMIN, Role.MANAGER, Role.MEMBER)
  @ApiOperation({ summary: 'Get team time off policies' })
  async getPolicies(@Request() req: any) {
    if (!req.user.teamId) {
      return [];
    }
    return this.timeOffService.getTeamPolicies(req.user.teamId);
  }

  /**
   * AIDEV-NOTE: Create policy (admin only)
   */
  @Post('policies')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create time off policy' })
  async createPolicy(@Body() dto: TimeOffPolicyDto, @Request() req: any) {
    if (!req.user.teamId) {
      return { success: false, message: 'User is not part of a team' };
    }
    return this.timeOffService.createPolicy(req.user.teamId, dto);
  }
}
