import { Controller, Get, Post, Put, Delete, UseGuards, Request, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { Role } from '../auth/roles/role.enum';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@ApiTags('tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TasksController {
  /**
   * AIDEV-NOTE: Tasks - Get tasks for a project
   */
  @Get('project/:projectId')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Get tasks for a specific project' })
  async findByProject(@Param('projectId') projectId: string, @Request() req: any) {
    // Verify user has access to this project
    if (req.user.role !== Role.ADMIN && req.user.role !== Role.MANAGER) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });
      if (!project || project.teamId !== req.user.teamId) {
        return { tasks: [] };
      }
    }

    const tasks = await prisma.task.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
    return { tasks };
  }

  /**
   * AIDEV-NOTE: Tasks - Create a new task
   */
  @Post('project/:projectId')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Create a new task in a project' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Param('projectId') projectId: string, @Body() createDto: { name: string; estimatedHours?: number }, @Request() req: any) {
    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return { error: 'Project not found' };
    }

    // Managers can only create tasks in their team's projects
    if (req.user.role === Role.MANAGER) {
      if (!req.user.teamId || project.teamId !== req.user.teamId) {
        return { error: 'You can only create tasks in your team\'s projects' };
      }
    }

    const task = await prisma.task.create({
      data: {
        name: createDto.name,
        projectId,
        estimatedHours: createDto.estimatedHours ? String(createDto.estimatedHours) : null,
      },
      include: { project: true },
    });

    return { task };
  }

  /**
   * AIDEV-NOTE: Tasks - Get a specific task
   */
  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Get a specific task by ID' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!task) {
      return { error: 'Task not found' };
    }

    // Check access
    if (req.user.role !== Role.ADMIN && req.user.role !== Role.MANAGER) {
      if (task.project.teamId !== req.user.teamId) {
        return { error: 'Access denied' };
      }
    }

    return { task };
  }

  /**
   * AIDEV-NOTE: Tasks - Update a task
   */
  @Put(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Update a task' })
  async update(@Param('id') id: string, @Body() updateDto: { name?: string; estimatedHours?: number }, @Request() req: any) {
    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existingTask) {
      return { error: 'Task not found' };
    }

    // Managers can only update tasks in their team's projects
    if (req.user.role === Role.MANAGER) {
      if (!req.user.teamId || existingTask.project.teamId !== req.user.teamId) {
        return { error: 'You can only update tasks in your team\'s projects' };
      }
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        name: updateDto.name || existingTask.name,
        estimatedHours: updateDto.estimatedHours ? String(updateDto.estimatedHours) : existingTask.estimatedHours,
      },
      include: { project: true },
    });

    return { task };
  }

  /**
   * AIDEV-NOTE: Tasks - Delete a task
   */
  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Delete a task' })
  async delete(@Param('id') id: string, @Request() req: any) {
    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existingTask) {
      return { error: 'Task not found' };
    }

    // Managers can only delete tasks in their team's projects
    if (req.user.role === Role.MANAGER) {
      if (!req.user.teamId || existingTask.project.teamId !== req.user.teamId) {
        return { error: 'You can only delete tasks in your team\'s projects' };
      }
    }

    await prisma.task.delete({
      where: { id },
    });

    return { message: 'Task deleted successfully' };
  }
}
