"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoicesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/roles/roles.decorator");
const role_enum_1 = require("../auth/roles/role.enum");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
let InvoicesController = class InvoicesController {
    async createInvoice(createDto, req) {
        const periodStart = new Date(createDto.periodStart);
        const periodEnd = new Date(createDto.periodEnd);
        const dueDate = createDto.dueDate ? new Date(createDto.dueDate) : null;
        let entries;
        if (createDto.entryIds && createDto.entryIds.length > 0) {
            entries = await prisma.timeEntry.findMany({
                where: {
                    id: { in: createDto.entryIds },
                    status: 'APPROVED',
                    userId: req.user.id,
                },
            });
        }
        else {
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
        const totalSeconds = entries.reduce((sum, e) => sum + (e.duration || 0), 0);
        const totalHours = totalSeconds / 3600;
        const hourlyRate = createDto.hourlyRate || Number(req.user.hourlyRate) || 0;
        if (hourlyRate === 0) {
            return { error: 'Defina uma taxa horária' };
        }
        const totalAmount = totalHours * hourlyRate;
        const count = await prisma.invoice.count();
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
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
    async findAll(req) {
        const where = {};
        if (req.user.role === role_enum_1.Role.USER) {
            where.userId = req.user.id;
        }
        else if (req.user.role === role_enum_1.Role.MANAGER && req.user.teamId) {
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
    async findOne(id, req) {
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
        const entryIds = invoice.entries.map(e => e.entryId);
        const timeEntries = await prisma.timeEntry.findMany({
            where: { id: { in: entryIds } },
            include: { project: true, task: true },
        });
        return { invoice, timeEntries };
    }
    async updateStatus(id, updateDto, req) {
        const validStatuses = ['DRAFT', 'SENT', 'PAID', 'CANCELLED'];
        if (!validStatuses.includes(updateDto.status)) {
            return { error: 'Status inválido' };
        }
        const invoice = await prisma.invoice.findUnique({ where: { id } });
        if (!invoice) {
            return { error: 'Fatura não encontrada' };
        }
        const updateData = { status: updateDto.status };
        if (updateDto.status === 'PAID') {
            updateData.paidAt = new Date();
        }
        const updated = await prisma.invoice.update({
            where: { id },
            data: updateData,
        });
        return { invoice: updated, message: `Fatura atualizada para ${updateDto.status}` };
    }
    async delete(id, req) {
        const invoice = await prisma.invoice.findUnique({ where: { id } });
        if (!invoice) {
            return { error: 'Fatura não encontrada' };
        }
        await prisma.invoiceEntry.deleteMany({ where: { invoiceId: id } });
        await prisma.invoice.delete({ where: { id } });
        return { message: 'Fatura cancelada' };
    }
};
exports.InvoicesController = InvoicesController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Criar fatura a partir de entries aprovadas' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], InvoicesController.prototype, "createInvoice", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Listar faturas' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InvoicesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Ver detalhes de uma fatura' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InvoicesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/status'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar status da fatura' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], InvoicesController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Cancelar fatura' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InvoicesController.prototype, "delete", null);
exports.InvoicesController = InvoicesController = __decorate([
    (0, swagger_1.ApiTags)('invoices'),
    (0, common_1.Controller)('invoices'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)()
], InvoicesController);
//# sourceMappingURL=invoices.controller.js.map