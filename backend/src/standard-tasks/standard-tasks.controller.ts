import { Controller, Get, Post, Put, Delete, UseGuards, Request, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { Role } from '../auth/roles/role.enum';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@ApiTags('standard-tasks')
@Controller('standard-tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StandardTasksController {
  /**
   * AIDEV-NOTE: Standard Tasks - List all standard tasks
   */
  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all standard tasks (admin only)' })
  async findAll() {
    const tasks = await prisma.standardTask.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return { standardTasks: tasks };
  }

  /**
   * AIDEV-NOTE: Standard Tasks - Create a new standard task
   */
  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new standard task (admin only)' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: {
    name: string;
    description?: string;
    estimatedHours?: number;
    color?: string;
    icon?: string;
  }) {
    const task = await prisma.standardTask.create({
      data: {
        name: createDto.name,
        description: createDto.description || null,
        estimatedHours: createDto.estimatedHours ? String(createDto.estimatedHours) : null,
        color: createDto.color || '#3B82F6',
        icon: createDto.icon || '📋',
      },
    });

    return { standardTask: task };
  }

  /**
   * AIDEV-NOTE: Standard Tasks - Get a specific standard task
   */
  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get a specific standard task by ID' })
  async findOne(@Param('id') id: string) {
    const task = await prisma.standardTask.findUnique({
      where: { id },
    });

    if (!task) {
      return { error: 'Standard task not found' };
    }

    return { standardTask: task };
  }

  /**
   * AIDEV-NOTE: Standard Tasks - Update a standard task
   */
  @Put(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a standard task' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: {
      name?: string;
      description?: string;
      estimatedHours?: number;
      color?: string;
      icon?: string;
      isActive?: boolean;
    },
  ) {
    const existingTask = await prisma.standardTask.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return { error: 'Standard task not found' };
    }

    const task = await prisma.standardTask.update({
      where: { id },
      data: {
        name: updateDto.name || existingTask.name,
        description: updateDto.description !== undefined ? updateDto.description : existingTask.description,
        estimatedHours: updateDto.estimatedHours !== undefined
          ? (updateDto.estimatedHours ? String(updateDto.estimatedHours) : null)
          : existingTask.estimatedHours,
        color: updateDto.color || existingTask.color,
        icon: updateDto.icon || existingTask.icon,
        isActive: updateDto.isActive !== undefined ? updateDto.isActive : existingTask.isActive,
      },
    });

    return { standardTask: task };
  }

  /**
   * AIDEV-NOTE: Standard Tasks - Delete a standard task (soft delete)
   */
  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a standard task (soft delete)' })
  async delete(@Param('id') id: string) {
    const existingTask = await prisma.standardTask.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return { error: 'Standard task not found' };
    }

    await prisma.standardTask.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Standard task deleted successfully' };
  }

  /**
   * AIDEV-NOTE: Standard Tasks - Apply standard task to a project
   */
  @Post(':id/apply-to-project/:projectId')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Apply a standard task to a project' })
  @HttpCode(HttpStatus.CREATED)
  async applyToProject(@Param('id') id: string, @Param('projectId') projectId: string, @Request() req: any) {
    // Check if standard task exists
    const standardTask = await prisma.standardTask.findUnique({
      where: { id },
    });

    if (!standardTask) {
      return { error: 'Standard task not found' };
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return { error: 'Project not found' };
    }

    // Managers can only apply to their team's projects
    if (req.user.role === Role.MANAGER) {
      if (!req.user.teamId || project.teamId !== req.user.teamId) {
        return { error: 'You can only apply tasks to your team\'s projects' };
      }
    }

    // Check if task with same name already exists in project
    const existingTask = await prisma.task.findFirst({
      where: {
        projectId,
        name: standardTask.name,
      },
    });

    if (existingTask) {
      return { error: 'A task with this name already exists in the project' };
    }

    // Create task in project
    const task = await prisma.task.create({
      data: {
        name: standardTask.name,
        projectId,
        estimatedHours: standardTask.estimatedHours,
      },
      include: { project: true },
    });

    return { task, message: 'Standard task applied to project successfully' };
  }
}
