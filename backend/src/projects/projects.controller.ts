import { Controller, Get, Post, Put, Delete, UseGuards, Request, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { Role } from '../auth/roles/role.enum';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@ApiTags('projects')
@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProjectsController {
  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'List all projects (own team for Manager/User, all for Admin)' })
  async findAll(@Request() req: any) {
    // Admin can see all projects
    if (req.user.role === Role.ADMIN) {
      const projects = await prisma.project.findMany({
        include: { team: true },
      });
      return { projects };
    }

    // Manager and User see only their team's projects
    if (req.user.teamId) {
      const projects = await prisma.project.findMany({
        where: { teamId: req.user.teamId },
        include: { team: true },
      });
      return { projects };
    }

    return { projects: [] };
  }

  /**
   * AIDEV-NOTE: Timer - Get tasks for a specific project
   */
  @Get(':id/tasks')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Get tasks for a specific project' })
  async getTasksByProject(@Param('id') projectId: string, @Request() req: any) {
    // Verify user has access to this project
    if (req.user.role !== Role.ADMIN && req.user.role !== Role.MANAGER) {
      // Regular users can only see tasks from their team's projects
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });
      if (!project || project.teamId !== req.user.teamId) {
        return { tasks: [] };
      }
    }

    const tasks = await prisma.task.findMany({
      where: { projectId },
    });
    return { tasks };
  }

  /**
   * AIDEV-NOTE: Projects - Create a new project
   */
  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Create a new project' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: { name: string; description?: string; teamId?: string; budgetHours?: number; budgetAmount?: number }, @Request() req: any) {
    // Determine team ID
    let teamId = createDto.teamId;

    // Managers can only create projects for their team
    if (req.user.role === Role.MANAGER) {
      if (!req.user.teamId) {
        return { error: 'You must be part of a team to create projects' };
      }
      teamId = req.user.teamId;
    }

    // Admin must provide teamId
    if (req.user.role === Role.ADMIN && !teamId) {
      return { error: 'teamId is required for admin users' };
    }

    if (!teamId) {
      return { error: 'teamId is required' };
    }

    // Verify team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return { error: 'Team not found' };
    }

    // Managers can only create projects for their team
    if (req.user.role === Role.MANAGER && req.user.teamId !== teamId) {
      return { error: 'You can only create projects for your own team' };
    }

    const project = await prisma.project.create({
      data: {
        name: createDto.name,
        description: createDto.description || null,
        teamId,
        budgetHours: createDto.budgetHours ? String(createDto.budgetHours) : null,
        budgetAmount: createDto.budgetAmount ? String(createDto.budgetAmount) : null,
      },
      include: { team: true },
    });

    return { project };
  }

  /**
   * AIDEV-NOTE: Projects - Get a specific project
   */
  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Get a specific project by ID' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: { team: true },
    });

    if (!project) {
      return { error: 'Project not found' };
    }

    // Check access
    if (req.user.role !== Role.ADMIN && req.user.role !== Role.MANAGER) {
      if (project.teamId !== req.user.teamId) {
        return { error: 'Access denied' };
      }
    }

    return { project };
  }

  /**
   * AIDEV-NOTE: Projects - Update a project
   */
  @Put(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Update a project' })
  async update(@Param('id') id: string, @Body() updateDto: { name?: string; description?: string; budgetHours?: number; budgetAmount?: number }, @Request() req: any) {
    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return { error: 'Project not found' };
    }

    // Managers can only update their team's projects
    if (req.user.role === Role.MANAGER) {
      if (!req.user.teamId || existingProject.teamId !== req.user.teamId) {
        return { error: 'You can only update projects in your team' };
      }
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        name: updateDto.name || existingProject.name,
        description: updateDto.description !== undefined ? updateDto.description : existingProject.description,
        budgetHours: updateDto.budgetHours ? String(updateDto.budgetHours) : existingProject.budgetHours,
        budgetAmount: updateDto.budgetAmount ? String(updateDto.budgetAmount) : existingProject.budgetAmount,
      },
      include: { team: true },
    });

    return { project };
  }

  /**
   * AIDEV-NOTE: Projects - Archive a project
   */
  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Archive a project' })
  async archive(@Param('id') id: string, @Request() req: any) {
    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return { error: 'Project not found' };
    }

    // Managers can only archive their team's projects
    if (req.user.role === Role.MANAGER) {
      if (!req.user.teamId || existingProject.teamId !== req.user.teamId) {
        return { error: 'You can only archive projects in your team' };
      }
    }

    const project = await prisma.project.update({
      where: { id },
      data: { archived: true },
      include: { team: true },
    });

    return { project, message: 'Project archived successfully' };
  }
}
