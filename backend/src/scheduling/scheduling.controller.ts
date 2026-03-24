import { Controller, Get, Post, Put, Delete, Body, Query, UseGuards, Request, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { Role } from '../auth/roles/role.enum';
import { SchedulingService, CreateScheduledEntryDto } from './scheduling.service';

@ApiTags('scheduling')
@Controller('scheduling')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  /**
   * AIDEV-NOTE: Create a new scheduled entry
   */
  @Post()
  @Roles(Role.ADMIN, Role.MANAGER, Role.MEMBER)
  @ApiOperation({ summary: 'Create a new scheduled time entry' })
  async create(
    @Request() req: any,
    @Body() dto: CreateScheduledEntryDto,
  ) {
    return this.schedulingService.createScheduledEntry(req.user.id, dto);
  }

  /**
   * AIDEV-NOTE: Get all scheduled entries for current user
   */
  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.MEMBER)
  @ApiOperation({ summary: 'Get all scheduled entries' })
  async getAll(@Request() req: any) {
    return this.schedulingService.getScheduledEntries(req.user.id);
  }

  /**
   * AIDEV-NOTE: Get upcoming generated time entries
   */
  @Get('upcoming')
  @Roles(Role.ADMIN, Role.MANAGER, Role.MEMBER)
  @ApiOperation({ summary: 'Get upcoming time entries from scheduled entries' })
  async getUpcoming(
    @Request() req: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return this.schedulingService.getUpcomingEntries(req.user.id, start, end);
  }

  /**
   * AIDEV-NOTE: Update a scheduled entry
   */
  @Put(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.MEMBER)
  @ApiOperation({ summary: 'Update a scheduled entry' })
  async update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: Partial<CreateScheduledEntryDto>,
  ) {
    return this.schedulingService.updateScheduledEntry(id, req.user.id, dto);
  }

  /**
   * AIDEV-NOTE: Delete a scheduled entry
   */
  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.MEMBER)
  @ApiOperation({ summary: 'Delete a scheduled entry' })
  async delete(@Param('id') id: string, @Request() req: any) {
    const success = await this.schedulingService.deleteScheduledEntry(id, req.user.id);
    return { success };
  }
}
