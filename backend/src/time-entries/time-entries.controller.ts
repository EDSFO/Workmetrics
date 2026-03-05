import { Controller, Get, Post, Body, UseGuards, Request, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { Role } from '../auth/roles/role.enum';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@ApiTags('time-entries')
@Controller('time-entries')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TimeEntriesController {
  /**
   * AIDEV-NOTE: Timer - Start a new time entry (timer start)
   */
  @Post('start')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Start a new time entry (timer start)' })
  @HttpCode(HttpStatus.CREATED)
  async start(@Body() startDto: { projectId?: string; taskId?: string; description?: string }, @Request() req: any) {
    // Check for existing active time entry
    const existingEntry = await prisma.timeEntry.findFirst({
      where: {
        userId: req.user.id,
        endTime: null,
      },
    });

    if (existingEntry) {
      // Return existing active entry instead of creating new one
      const entry = await prisma.timeEntry.findUnique({
        where: { id: existingEntry.id },
        include: { project: true, task: true },
      });
      return {
        timeEntry: entry,
        expiresIn: null,
        message: 'Already have an active timer',
      };
    }

    // Create new time entry
    const entry = await prisma.timeEntry.create({
      data: {
        userId: req.user.id,
        projectId: startDto.projectId || null,
        taskId: startDto.taskId || null,
        startTime: new Date(),
        endTime: null,
        duration: null,
        description: startDto.description || null,
        billable: true,
      },
      include: { project: true, task: true },
    });

    return { timeEntry: entry, expiresIn: null };
  }

  /**
   * AIDEV-NOTE: Timer - Stop an active time entry
   */
  @Post('stop')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Stop an active time entry (timer stop)' })
  async stop(@Body() stopDto: { id: string }, @Request() req: any) {
    // Find the time entry
    const existingEntry = await prisma.timeEntry.findUnique({
      where: { id: stopDto.id },
    });

    if (!existingEntry) {
      return { error: 'Time entry not found' };
    }

    // Verify ownership
    if (existingEntry.userId !== req.user.id) {
      return { error: 'Not authorized to stop this time entry' };
    }

    // Calculate duration
    const endTime = new Date();
    const startTime = new Date(existingEntry.startTime);
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    // Update time entry
    const entry = await prisma.timeEntry.update({
      where: { id: stopDto.id },
      data: {
        endTime,
        duration,
      },
      include: { project: true, task: true },
    });

    return { timeEntry: entry };
  }

  /**
   * AIDEV-NOTE: Timer - Get active time entry
   */
  @Get('active')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Get active time entry (running timer)' })
  async getActive(@Request() req: any) {
    const entry = await prisma.timeEntry.findFirst({
      where: {
        userId: req.user.id,
        endTime: null,
      },
      include: { project: true, task: true },
    });

    return { timeEntry: entry };
  }

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'List time entries (own entries for User, team entries for Manager, all for Admin)' })
  async findAll(@Request() req: any) {
    // Admin can see all time entries
    if (req.user.role === Role.ADMIN) {
      const entries = await prisma.timeEntry.findMany({
        include: { user: { select: { id: true, name: true, email: true } }, project: true, task: true },
      });
      return { timeEntries: entries };
    }

    // Manager sees their team's time entries
    if (req.user.role === Role.MANAGER && req.user.teamId) {
      const teamUserIds = await prisma.user.findMany({
        where: { teamId: req.user.teamId },
        select: { id: true },
      });
      const userIds = teamUserIds.map(u => u.id);

      const entries = await prisma.timeEntry.findMany({
        where: { userId: { in: userIds } },
        include: { user: { select: { id: true, name: true, email: true } }, project: true, task: true },
      });
      return { timeEntries: entries };
    }

    // User sees only their own entries
    const entries = await prisma.timeEntry.findMany({
      where: { userId: req.user.id },
      include: { project: true, task: true },
    });
    return { timeEntries: entries };
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Create a new time entry (manual entry)' })
  async create(@Body() createDto: any, @Request() req: any) {
    // Validate that startTime and endTime are provided
    if (!createDto.startTime || !createDto.endTime) {
      return { error: 'Both startTime and endTime are required for manual entry' };
    }

    const startTime = new Date(createDto.startTime);
    const endTime = new Date(createDto.endTime);

    // Validate endTime is after startTime
    if (endTime <= startTime) {
      return { error: 'endTime must be after startTime' };
    }

    // Calculate duration in seconds
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    // Check for overlapping entries
    const overlappingEntries = await prisma.timeEntry.findMany({
      where: {
        userId: req.user.id,
        OR: [
          // New entry starts during an existing entry
          {
            startTime: { lte: startTime },
            endTime: { gte: startTime },
          },
          // New entry ends during an existing entry
          {
            startTime: { lte: endTime },
            endTime: { gte: endTime },
          },
          // New entry completely contains an existing entry
          {
            startTime: { gte: startTime },
            endTime: { lte: endTime },
          },
        ],
      },
    });

    if (overlappingEntries.length > 0) {
      return { error: 'Time entry overlaps with an existing entry' };
    }

    const entry = await prisma.timeEntry.create({
      data: {
        userId: req.user.id,
        projectId: createDto.projectId || null,
        taskId: createDto.taskId || null,
        startTime,
        endTime,
        duration,
        description: createDto.description || null,
        billable: createDto.billable !== false,
      },
      include: { project: true, task: true },
    });
    return { timeEntry: entry };
  }

  // ============================================
  // KIOSK / PONTO ELETRONICO ENDPOINTS
  // ============================================

  /**
   * AIDEV-NOTE: Kiosk - Clock In (registrar entrada)
   */
  @Post('kiosk/clock-in')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Kiosk: Registrar entrada (clock in)' })
  async clockIn(@Request() req: any) {
    // Check for existing active entry
    const existingEntry = await prisma.timeEntry.findFirst({
      where: {
        userId: req.user.id,
        endTime: null,
      },
    });

    if (existingEntry) {
      return { error: 'Já existe um registro ativo. Faça clock-out primeiro.' };
    }

    const entry = await prisma.timeEntry.create({
      data: {
        userId: req.user.id,
        startTime: new Date(),
        endTime: null,
        duration: null,
        type: 'CLOCK_IN',
        description: 'Registro de entrada',
        billable: false,
      },
    });

    return { timeEntry: entry, message: 'Entrada registrada com sucesso!' };
  }

  /**
   * AIDEV-NOTE: Kiosk - Clock Out (registrar saída)
   */
  @Post('kiosk/clock-out')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Kiosk: Registrar saída (clock out)' })
  async clockOut(@Request() req: any) {
    // Find active entry
    const existingEntry = await prisma.timeEntry.findFirst({
      where: {
        userId: req.user.id,
        endTime: null,
      },
    });

    if (!existingEntry) {
      return { error: 'Não há registro ativo. Faça clock-in primeiro.' };
    }

    const endTime = new Date();
    const startTime = new Date(existingEntry.startTime);
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    const entry = await prisma.timeEntry.update({
      where: { id: existingEntry.id },
      data: {
        endTime,
        duration,
        type: 'CLOCK_OUT',
      },
    });

    return { timeEntry: entry, message: 'Saída registrada com sucesso!' };
  }

  /**
   * AIDEV-NOTE: Kiosk - Start Pause (iniciar pausa)
   */
  @Post('kiosk/pause')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Kiosk: Iniciar pausa (intervalo)' })
  async startPause(@Request() req: any) {
    // Find active entry
    const existingEntry = await prisma.timeEntry.findFirst({
      where: {
        userId: req.user.id,
        endTime: null,
        type: 'CLOCK_IN',
      },
    });

    if (!existingEntry) {
      return { error: 'Não há registro de entrada ativo.' };
    }

    // Check if already on pause
    const onPause = await prisma.timeEntry.findFirst({
      where: {
        userId: req.user.id,
        endTime: null,
        type: 'PAUSE',
      },
    });

    if (onPause) {
      return { error: 'Você já está em pausa.' };
    }

    const entry = await prisma.timeEntry.create({
      data: {
        userId: req.user.id,
        startTime: new Date(),
        endTime: null,
        duration: null,
        type: 'PAUSE',
        description: 'Início de pausa',
        billable: false,
      },
    });

    return { timeEntry: entry, message: 'Pausa iniciada!' };
  }

  /**
   * AIDEV-NOTE: Kiosk - End Pause (retornar de pausa)
   */
  @Post('kiosk/resume')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Kiosk: Retomar trabalho (fim de pausa)' })
  async endPause(@Request() req: any) {
    // Find active pause entry
    const pauseEntry = await prisma.timeEntry.findFirst({
      where: {
        userId: req.user.id,
        endTime: null,
        type: 'PAUSE',
      },
    });

    if (!pauseEntry) {
      return { error: 'Você não está em pausa.' };
    }

    const endTime = new Date();
    const startTime = new Date(pauseEntry.startTime);
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    // End the pause
    await prisma.timeEntry.update({
      where: { id: pauseEntry.id },
      data: {
        endTime,
        duration,
        type: 'RESUME',
      },
    });

    return { message: 'Pausa finalizada. Bom trabalho!' };
  }

  /**
   * AIDEV-NOTE: Kiosk - Get today's entries
   */
  @Get('kiosk/today')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Kiosk: Listar registros de hoje' })
  async getTodayEntries(@Request() req: any) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const entries = await prisma.timeEntry.findMany({
      where: {
        userId: req.user.id,
        startTime: {
          gte: today,
          lt: tomorrow,
        },
        type: {
          in: ['CLOCK_IN', 'CLOCK_OUT', 'PAUSE', 'RESUME'],
        },
      },
      orderBy: { startTime: 'asc' },
    });

    // Calculate total work time
    let totalWorkTime = 0;
    let isWorking = false;
    let currentEntry = null;

    for (const entry of entries) {
      if (entry.type === 'CLOCK_IN') {
        isWorking = true;
      } else if (entry.type === 'CLOCK_OUT') {
        isWorking = false;
        totalWorkTime += entry.duration || 0;
      } else if (entry.type === 'PAUSE') {
        isWorking = false;
      } else if (entry.type === 'RESUME' && entry.duration) {
        // Subtract pause time from work time
        totalWorkTime -= entry.duration;
      }

      if (entry.endTime === null) {
        currentEntry = entry;
      }
    }

    return {
      entries,
      totalWorkTime,
      isWorking,
      currentEntry,
    };
  }

  /**
   * AIDEV-NOTE: Kiosk - Get status
   */
  @Get('kiosk/status')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Kiosk: Verificar status atual' })
  async getKioskStatus(@Request() req: any) {
    const activeEntry = await prisma.timeEntry.findFirst({
      where: {
        userId: req.user.id,
        endTime: null,
      },
      orderBy: { startTime: 'desc' },
    });

    if (!activeEntry) {
      return { status: 'OFF', message: 'Fora do trabalho' };
    }

    if (activeEntry.type === 'PAUSE') {
      return { status: 'PAUSE', message: 'Em pausa', entry: activeEntry };
    }

    return { status: 'WORKING', message: 'Em trabalho', entry: activeEntry };
  }

  // ============================================
  // END KIOSK ENDPOINTS
  // ============================================

  // ============================================
  // AUTO TRACKER ENDPOINTS
  // ============================================

  /**
   * AIDEV-NOTE: Auto Tracker - Start auto tracking
   */
  @Post('auto/start')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Auto Tracker: Iniciar rastreamento automático' })
  async startAutoTrack(@Body() startDto: { projectId?: string; taskId?: string; description?: string }, @Request() req: any) {
    // Check for existing active time entry
    const existingEntry = await prisma.timeEntry.findFirst({
      where: {
        userId: req.user.id,
        endTime: null,
        type: 'AUTO',
      },
    });

    if (existingEntry) {
      const entry = await prisma.timeEntry.findUnique({
        where: { id: existingEntry.id },
        include: { project: true, task: true },
      });
      return { timeEntry: entry, message: 'Auto tracking já está ativo', isActive: true };
    }

    // Create new auto-tracking entry
    const entry = await prisma.timeEntry.create({
      data: {
        userId: req.user.id,
        projectId: startDto.projectId || null,
        taskId: startDto.taskId || null,
        startTime: new Date(),
        endTime: null,
        duration: null,
        type: 'AUTO',
        description: startDto.description || 'Auto tracking ativo',
        billable: true,
      },
      include: { project: true, task: true },
    });

    return { timeEntry: entry, message: 'Auto tracking iniciado!', isActive: true };
  }

  /**
   * AIDEV-NOTE: Auto Tracker - Stop auto tracking
   */
  @Post('auto/stop')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Auto Tracker: Parar rastreamento automático' })
  async stopAutoTrack(@Request() req: any) {
    const existingEntry = await prisma.timeEntry.findFirst({
      where: {
        userId: req.user.id,
        endTime: null,
        type: 'AUTO',
      },
    });

    if (!existingEntry) {
      return { error: 'Nenhum auto tracking ativo' };
    }

    const endTime = new Date();
    const startTime = new Date(existingEntry.startTime);
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    const entry = await prisma.timeEntry.update({
      where: { id: existingEntry.id },
      data: {
        endTime,
        duration,
      },
      include: { project: true, task: true },
    });

    return { timeEntry: entry, message: 'Auto tracking parado!', isActive: false };
  }

  /**
   * AIDEV-NOTE: Auto Tracker - Heartbeat (update activity)
   */
  @Post('auto/heartbeat')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Auto Tracker: Enviar heartbeat (atividade)' })
  async heartbeat(@Body() heartbeatDto: { activity?: string }, @Request() req: any) {
    const existingEntry = await prisma.timeEntry.findFirst({
      where: {
        userId: req.user.id,
        endTime: null,
        type: 'AUTO',
      },
    });

    if (!existingEntry) {
      return { error: 'Nenhum auto tracking ativo', isActive: false };
    }

    // Update the entry's description with latest activity
    const entry = await prisma.timeEntry.update({
      where: { id: existingEntry.id },
      data: {
        description: heartbeatDto.activity || 'Ativo',
      },
    });

    return {
      timeEntry: entry,
      message: 'Heartbeat recebido',
      isActive: true,
      lastActivity: heartbeatDto.activity
    };
  }

  /**
   * AIDEV-NOTE: Auto Tracker - Get status
   */
  @Get('auto/status')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Auto Tracker: Verificar status' })
  async getAutoTrackStatus(@Request() req: any) {
    const activeEntry = await prisma.timeEntry.findFirst({
      where: {
        userId: req.user.id,
        endTime: null,
        type: 'AUTO',
      },
      include: { project: true, task: true },
    });

    if (!activeEntry) {
      return { isActive: false, message: 'Auto tracking inativo' };
    }

    // Calculate elapsed time
    const elapsed = Math.floor((new Date().getTime() - new Date(activeEntry.startTime).getTime()) / 1000);

    return {
      isActive: true,
      timeEntry: activeEntry,
      elapsedSeconds: elapsed,
      message: 'Auto tracking ativo'
    };
  }

  /**
   * AIDEV-NOTE: Auto Tracker - Get idle time (time without activity)
   */
  @Get('auto/idle')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Auto Tracker: Verificar tempo ocioso' })
  async getIdleTime(@Request() req: any) {
    // This would typically check last heartbeat timestamp
    // For now, return a placeholder
    return {
      isIdle: false,
      idleTimeSeconds: 0,
      message: 'Monitorando atividade'
    };
  }

  // ============================================
  // END AUTO TRACKER ENDPOINTS
  // ============================================

  // ============================================
  // APPROVAL WORKFLOW ENDPOINTS
  // ============================================

  /**
   * AIDEV-NOTE: Approval - List pending entries (for team managers/admins)
   */
  @Get('approvals/pending')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Approval: Listar entries pendentes de aprovação' })
  async getPendingApprovals(@Request() req: any) {
    let userIds: string[];

    // Admin sees all pending entries
    if (req.user.role === Role.ADMIN) {
      const allUsers = await prisma.user.findMany({ select: { id: true } });
      userIds = allUsers.map(u => u.id);
    }
    // Manager sees their team's pending entries
    else if (req.user.teamId) {
      const teamUsers = await prisma.user.findMany({
        where: { teamId: req.user.teamId },
        select: { id: true },
      });
      userIds = teamUsers.map(u => u.id);
    }
    else {
      return { entries: [], message: 'Você não pertence a uma equipe' };
    }

    const entries = await prisma.timeEntry.findMany({
      where: {
        userId: { in: userIds },
        status: 'PENDING',
        endTime: { not: null }, // Only completed entries
        type: { in: ['TIME', 'AUTO'] }, // Only time entries (not kiosk)
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        project: true,
        task: true,
      },
      orderBy: { startTime: 'desc' },
    });

    return { entries, count: entries.length };
  }

  /**
   * AIDEV-NOTE: Approval - Approve a time entry
   */
  @Post('approvals/:id/approve')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Approval: Aprovar entry de tempo' })
  async approveEntry(@Request() req: any) {
    const entryId = req.params.id;

    // Find the entry
    const entry = await prisma.timeEntry.findUnique({
      where: { id: entryId },
      include: { user: true },
    });

    if (!entry) {
      return { error: 'Entry não encontrada' };
    }

    // Check if entry belongs to user's team (for managers)
    if (req.user.role === Role.MANAGER && req.user.teamId) {
      if (entry.user.teamId !== req.user.teamId) {
        return { error: 'Você não pode aprovar entries de outros times' };
      }
    }

    // Update status to APPROVED
    const updated = await prisma.timeEntry.update({
      where: { id: entryId },
      data: { status: 'APPROVED' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        project: true,
      },
    });

    return { timeEntry: updated, message: 'Entry aprovada com sucesso!' };
  }

  /**
   * AIDEV-NOTE: Approval - Reject a time entry
   */
  @Post('approvals/:id/reject')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Approval: Reprovar entry de tempo' })
  async rejectEntry(@Request() req: any) {
    const entryId = req.params.id;
    const { reason } = req.body || {};

    // Find the entry
    const entry = await prisma.timeEntry.findUnique({
      where: { id: entryId },
      include: { user: true },
    });

    if (!entry) {
      return { error: 'Entry não encontrada' };
    }

    // Check if entry belongs to user's team (for managers)
    if (req.user.role === Role.MANAGER && req.user.teamId) {
      if (entry.user.teamId !== req.user.teamId) {
        return { error: 'Você não pode reprovar entries de outros times' };
      }
    }

    // Update status to REJECTED with reason
    const updated = await prisma.timeEntry.update({
      where: { id: entryId },
      data: {
        status: 'REJECTED',
        description: entry.description ? `${entry.description}\n\nMotivo: ${reason || 'Não especificado'}` : `Motivo: ${reason || 'Não especificado'}`,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        project: true,
      },
    });

    return { timeEntry: updated, message: 'Entry reprovada' };
  }

  /**
   * AIDEV-NOTE: Approval - Get user's entries with approval status
   */
  @Get('my-entries')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Approval: Listar minhas entries com status' })
  async getMyEntriesWithStatus(@Request() req: any) {
    const entries = await prisma.timeEntry.findMany({
      where: {
        userId: req.user.id,
        endTime: { not: null },
        type: { in: ['TIME', 'AUTO'] },
      },
      include: {
        project: true,
        task: true,
      },
      orderBy: { startTime: 'desc' },
    });

    // Group by status
    const pending = entries.filter(e => e.status === 'PENDING');
    const approved = entries.filter(e => e.status === 'APPROVED');
    const rejected = entries.filter(e => e.status === 'REJECTED');

    return {
      entries,
      summary: {
        total: entries.length,
        pending: pending.length,
        approved: approved.length,
        rejected: rejected.length,
      },
    };
  }

  // ============================================
  // END APPROVAL WORKFLOW ENDPOINTS
  // ============================================

  /**
   * AIDEV-NOTE: Get time entries for a specific week
   */
  @Get('week')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Get time entries for a specific week' })
  async getWeekEntries(@Query('startDate') startDate: string, @Request() req: any) {
    // Parse the start date (should be Monday of the week)
    const weekStart = startDate ? new Date(startDate) : new Date();

    // Ensure we start from Monday
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);

    // Calculate week end (Sunday 23:59:59)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Determine which user IDs to fetch based on role
    let userIds: string[];

    if (req.user.role === Role.ADMIN) {
      // Admin sees all users
      const allUsers = await prisma.user.findMany({ select: { id: true } });
      userIds = allUsers.map(u => u.id);
    } else if (req.user.role === Role.MANAGER && req.user.teamId) {
      // Manager sees their team's users
      const teamUsers = await prisma.user.findMany({
        where: { teamId: req.user.teamId },
        select: { id: true },
      });
      userIds = teamUsers.map(u => u.id);
    } else {
      // User sees only their own entries
      userIds = [req.user.id];
    }

    // Fetch entries for the week
    const entries = await prisma.timeEntry.findMany({
      where: {
        userId: { in: userIds },
        OR: [
          // Entries that started during the week
          {
            startTime: {
              gte: weekStart,
              lte: weekEnd,
            },
          },
          // Entries that ended during the week
          {
            endTime: {
              gte: weekStart,
              lte: weekEnd,
            },
          },
          // Entries that span the entire week
          {
            startTime: { lte: weekStart },
            endTime: { gte: weekEnd },
          },
          // Active entries (no endTime) that started before week end
          {
            startTime: { lte: weekEnd },
            endTime: null,
          },
        ],
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        project: true,
        task: true,
      },
      orderBy: { startTime: 'asc' },
    });

    // Calculate week total (sum of all durations)
    const weekTotal = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0);

    return { entries, weekTotal, weekStart: weekStart.toISOString(), weekEnd: weekEnd.toISOString() };
  }
}
