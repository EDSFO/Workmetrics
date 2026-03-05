import { Controller, Get, Post, Delete, Body, UseGuards, Request, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { Role } from '../auth/roles/role.enum';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@ApiTags('invoices')
@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InvoicesController {
  /**
   * AIDEV-NOTE: Invoice - Create invoice from approved entries
   */
  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Criar fatura a partir de entries aprovadas' })
  async createInvoice(
    @Body() createDto: {
      clientName: string;
      clientEmail?: string;
      periodStart: string;
      periodEnd: string;
      entryIds?: string[];
      hourlyRate?: number;
      notes?: string;
      dueDate?: string;
    },
    @Request() req: any
  ) {
    const periodStart = new Date(createDto.periodStart);
    const periodEnd = new Date(createDto.periodEnd);
    const dueDate = createDto.dueDate ? new Date(createDto.dueDate) : null;

    // Get entries to include
    let entries;
    if (createDto.entryIds && createDto.entryIds.length > 0) {
      entries = await prisma.timeEntry.findMany({
        where: {
          id: { in: createDto.entryIds },
          status: 'APPROVED',
          userId: req.user.id,
        },
      });
    } else {
      // Get all approved entries for the period
      entries = await prisma.timeEntry.findMany({
        where: {
          userId: req.user.id,
          status: 'APPROVED',
          billable: true,
          startTime: { gte: periodStart },
          endTime: { lte: periodEnd },
          type: { in: ['TIME', 'AUTO'] },
        },
      });
    }

    if (entries.length === 0) {
      return { error: 'Nenhuma entry aprovada encontrada para o período' };
    }

    // Calculate total hours
    const totalSeconds = entries.reduce((sum, e) => sum + (e.duration || 0), 0);
    const totalHours = totalSeconds / 3600;

    // Get hourly rate
    const hourlyRate = createDto.hourlyRate || Number(req.user.hourlyRate) || 0;
    if (hourlyRate === 0) {
      return { error: 'Defina uma taxa horária' };
    }

    const totalAmount = totalHours * hourlyRate;

    // Generate invoice number
    const count = await prisma.invoice.count();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        number: invoiceNumber,
        userId: req.user.id,
        clientName: createDto.clientName,
        clientEmail: createDto.clientEmail || null,
        periodStart,
        periodEnd,
        totalHours,
        hourlyRate,
        totalAmount,
        notes: createDto.notes || null,
        dueDate,
        status: 'DRAFT',
      },
    });

    // Link entries to invoice
    for (const entry of entries) {
      await prisma.invoiceEntry.create({
        data: {
          invoiceId: invoice.id,
          entryId: entry.id,
        },
      });
    }

    return { invoice, entriesCount: entries.length, totalHours: totalHours.toFixed(2) };
  }

  /**
   * AIDEV-NOTE: Invoice - List all invoices
   */
  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Listar faturas' })
  async findAll(@Request() req: any) {
    const where: any = {};

    // Regular users see only their own invoices
    if (req.user.role === Role.USER) {
      where.userId = req.user.id;
    }
    // Managers see their team's invoices
    else if (req.user.role === Role.MANAGER && req.user.teamId) {
      const teamUsers = await prisma.user.findMany({
        where: { teamId: req.user.teamId },
        select: { id: true },
      });
      where.userId = { in: teamUsers.map(u => u.id) };
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { entries: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { invoices };
  }

  /**
   * AIDEV-NOTE: Invoice - Get single invoice
   */
  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @ApiOperation({ summary: 'Ver detalhes de uma fatura' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        entries: {
          include: {
            invoice: false,
          },
        },
      },
    });

    if (!invoice) {
      return { error: 'Fatura não encontrada' };
    }

    // Get the actual time entries
    const entryIds = invoice.entries.map(e => e.entryId);
    const timeEntries = await prisma.timeEntry.findMany({
      where: { id: { in: entryIds } },
      include: { project: true, task: true },
    });

    return { invoice, timeEntries };
  }

  /**
   * AIDEV-NOTE: Invoice - Update status
   */
  @Post(':id/status')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Atualizar status da fatura' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateDto: { status: string },
    @Request() req: any
  ) {
    const validStatuses = ['DRAFT', 'SENT', 'PAID', 'CANCELLED'];
    if (!validStatuses.includes(updateDto.status)) {
      return { error: 'Status inválido' };
    }

    const invoice = await prisma.invoice.findUnique({ where: { id } });

    if (!invoice) {
      return { error: 'Fatura não encontrada' };
    }

    const updateData: any = { status: updateDto.status };

    // Set paidAt when status is PAID
    if (updateDto.status === 'PAID') {
      updateData.paidAt = new Date();
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: updateData,
    });

    return { invoice: updated, message: `Fatura atualizada para ${updateDto.status}` };
  }

  /**
   * AIDEV-NOTE: Invoice - Delete (cancel) invoice
   */
  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Cancelar fatura' })
  async delete(@Param('id') id: string, @Request() req: any) {
    const invoice = await prisma.invoice.findUnique({ where: { id } });

    if (!invoice) {
      return { error: 'Fatura não encontrada' };
    }

    // Delete invoice entries first
    await prisma.invoiceEntry.deleteMany({ where: { invoiceId: id } });

    // Delete invoice
    await prisma.invoice.delete({ where: { id } });

    return { message: 'Fatura cancelada' };
  }
}
