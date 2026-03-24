import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { ApiKeyGuard } from './api-auth.guard';
import { ApiKeyService } from './api-auth.guard';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@ApiTags('API')
@ApiSecurity('ApiKeyAuth')
@Controller('api/v1')
@UseGuards(ApiKeyGuard)
export class ApiController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  /**
   * AIDEV-NOTE: Get current API key info
   */
  @Get('me')
  @ApiOperation({ summary: 'Get current API key info' })
  async getMe(@Request() req: any) {
    return {
      teamId: req.apiKey.teamId,
      permissions: req.apiKey.permissions,
    };
  }

  // ============================================
  // TIME ENTRIES
  // ============================================

  /**
   * AIDEV-NOTE: List time entries
   */
  @Get('time-entries')
  @ApiOperation({ summary: 'List time entries' })
  async listTimeEntries(
    @Request() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('userId') userId?: string,
    @Query('projectId') projectId?: string,
  ) {
    const where: any = { teamId: req.apiKey.teamId };

    if (startDate) where.startTime = { gte: new Date(startDate) };
    if (endDate) where.endTime = { lte: new Date(endDate) };
    if (userId) where.userId = userId;
    if (projectId) where.projectId = projectId;

    const entries = await prisma.timeEntry.findMany({
      where,
      include: {
        project: true,
        task: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { startTime: 'desc' },
      take: 1000,
    });

    return { entries };
  }

  /**
   * AIDEV-NOTE: Create time entry
   */
  @Post('time-entries')
  @ApiOperation({ summary: 'Create time entry' })
  async createTimeEntry(
    @Request() req: any,
    @Body() body: {
      userId: string;
      projectId?: string;
      taskId?: string;
      startTime: string;
      endTime?: string;
      duration?: number;
      description?: string;
      billable?: boolean;
    },
  ) {
    // Verify user belongs to team
    const user = await prisma.user.findFirst({
      where: { id: body.userId, teamId: req.apiKey.teamId },
    });

    if (!user) {
      return { error: 'User not found in team' };
    }

    const entry = await prisma.timeEntry.create({
      data: {
        userId: body.userId,
        projectId: body.projectId || null,
        taskId: body.taskId || null,
        startTime: new Date(body.startTime),
        endTime: body.endTime ? new Date(body.endTime) : null,
        duration: body.duration || null,
        description: body.description || null,
        billable: body.billable ?? true,
        type: 'TIME',
        status: 'APPROVED',
      },
      include: {
        project: true,
        task: true,
      },
    });

    return { entry };
  }

  /**
   * AIDEV-NOTE: Update time entry
   */
  @Put('time-entries/:id')
  @ApiOperation({ summary: 'Update time entry' })
  async updateTimeEntry(
    @Param('id') id: string,
    @Request() req: any,
    @Body() updates: {
      projectId?: string;
      taskId?: string;
      startTime?: string;
      endTime?: string;
      duration?: number;
      description?: string;
      billable?: boolean;
    },
  ) {
    // Verify entry belongs to team
    const existing = await prisma.timeEntry.findFirst({
      where: { id, user: { teamId: req.apiKey.teamId } },
    });

    if (!existing) {
      return { error: 'Time entry not found' };
    }

    const entry = await prisma.timeEntry.update({
      where: { id },
      data: {
        projectId: updates.projectId,
        taskId: updates.taskId,
        startTime: updates.startTime ? new Date(updates.startTime) : undefined,
        endTime: updates.endTime ? new Date(updates.endTime) : undefined,
        duration: updates.duration,
        description: updates.description,
        billable: updates.billable,
      },
      include: {
        project: true,
        task: true,
      },
    });

    return { entry };
  }

  // ============================================
  // PROJECTS
  // ============================================

  /**
   * AIDEV-NOTE: List projects
   */
  @Get('projects')
  @ApiOperation({ summary: 'List projects' })
  async listProjects(@Request() req: any) {
    const projects = await prisma.project.findMany({
      where: { teamId: req.apiKey.teamId, archived: false },
      include: {
        tasks: true,
        _count: { select: { timeEntries: true } },
      },
    });

    return { projects };
  }

  /**
   * AIDEV-NOTE: Create project
   */
  @Post('projects')
  @ApiOperation({ summary: 'Create project' })
  async createProject(
    @Request() req: any,
    @Body() body: { name: string; description?: string; budgetHours?: number },
  ) {
    const project = await prisma.project.create({
      data: {
        name: body.name,
        description: body.description,
        teamId: req.apiKey.teamId,
        budgetHours: body.budgetHours,
      },
    });

    return { project };
  }

  // ============================================
  // TASKS
  // ============================================

  /**
   * AIDEV-NOTE: List tasks
   */
  @Get('tasks')
  @ApiOperation({ summary: 'List tasks' })
  async listTasks(
    @Request() req: any,
    @Query('projectId') projectId?: string,
  ) {
    const where: any = { project: { teamId: req.apiKey.teamId } };
    if (projectId) where.projectId = projectId;

    const tasks = await prisma.task.findMany({
      where,
      include: { project: true },
    });

    return { tasks };
  }

  /**
   * AIDEV-NOTE: Create task
   */
  @Post('tasks')
  @ApiOperation({ summary: 'Create task' })
  async createTask(
    @Request() req: any,
    @Body() body: { projectId: string; name: string; estimatedHours?: number },
  ) {
    // Verify project belongs to team
    const project = await prisma.project.findFirst({
      where: { id: body.projectId, teamId: req.apiKey.teamId },
    });

    if (!project) {
      return { error: 'Project not found in team' };
    }

    const task = await prisma.task.create({
      data: {
        projectId: body.projectId,
        name: body.name,
        estimatedHours: body.estimatedHours,
      },
    });

    return { task };
  }

  // ============================================
  // USERS
  // ============================================

  /**
   * AIDEV-NOTE: List team users
   */
  @Get('users')
  @ApiOperation({ summary: 'List team users' })
  async listUsers(@Request() req: any) {
    const users = await prisma.user.findMany({
      where: { teamId: req.apiKey.teamId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        hourlyRate: true,
        createdAt: true,
      },
    });

    return { users };
  }

  // ============================================
  // REPORTS
  // ============================================

  /**
   * AIDEV-NOTE: Get time report
   */
  @Get('reports/summary')
  @ApiOperation({ summary: 'Get time summary report' })
  async getReport(
    @Request() req: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const entries = await prisma.timeEntry.findMany({
      where: {
        user: { teamId: req.apiKey.teamId },
        startTime: { gte: start },
        endTime: { lte: end },
        endTime: { not: null },
      },
      include: {
        project: true,
        user: { select: { id: true, name: true } },
      },
    });

    // Group by project
    const byProject: Record<string, any> = {};
    for (const entry of entries) {
      const pid = entry.projectId || 'no-project';
      if (!byProject[pid]) {
        byProject[pid] = {
          projectName: entry.project?.name || 'No Project',
          totalSeconds: 0,
          entryCount: 0,
        };
      }
      byProject[pid].totalSeconds += entry.duration || 0;
      byProject[pid].entryCount++;
    }

    const totalSeconds = entries.reduce((sum, e) => sum + (e.duration || 0), 0);

    return {
      startDate,
      endDate,
      totalSeconds,
      totalHours: (totalSeconds / 3600).toFixed(2),
      byProject: Object.values(byProject),
      entryCount: entries.length,
    };
  }
}
