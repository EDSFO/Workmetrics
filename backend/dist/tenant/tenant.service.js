"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const crypto = require("crypto");
const prisma = new client_1.PrismaClient();
let TenantService = class TenantService {
    async createTenant(data) {
        const slugRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
        if (!slugRegex.test(data.slug) || data.slug.length < 3 || data.slug.length > 50) {
            throw new common_1.BadRequestException('Slug must be 3-50 characters, lowercase letters, numbers and hyphens only');
        }
        const existing = await prisma.tenant.findUnique({
            where: { slug: data.slug },
        });
        if (existing) {
            throw new common_1.ConflictException('This company URL is already in use');
        }
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('An account with this email already exists');
        }
        const freePlan = await prisma.plan.findFirst({
            where: { name: 'Free' },
        });
        if (!freePlan) {
            throw new common_1.NotFoundException('Free plan not found. Please contact support.');
        }
        const result = await prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: {
                    name: data.name,
                    slug: data.slug,
                    planId: freePlan.id,
                },
            });
            const salt = crypto.randomBytes(16).toString('hex');
            const hash = crypto.pbkdf2Sync(data.password, salt, 1000, 64, 'sha512').toString('hex');
            const user = await tx.user.create({
                data: {
                    email: data.email,
                    name: data.userName,
                    passwordHash: salt + ':' + hash,
                    role: 'OWNER',
                },
            });
            const team = await tx.team.create({
                data: {
                    name: 'Default Team',
                    tenantId: tenant.id,
                    ownerId: user.id,
                },
            });
            await tx.user.update({
                where: { id: user.id },
                data: { teamId: team.id },
            });
            return { tenant, user, team };
        });
        return result;
    }
    async getTenant(tenantId) {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { plan: true },
        });
        if (!tenant) {
            throw new common_1.NotFoundException('Organization not found');
        }
        return tenant;
    }
    async getTenantBySlug(slug) {
        const tenant = await prisma.tenant.findUnique({
            where: { slug },
            include: { plan: true },
        });
        if (!tenant) {
            throw new common_1.NotFoundException('Organization not found');
        }
        return tenant;
    }
    async updateTenant(tenantId, data) {
        return prisma.tenant.update({
            where: { id: tenantId },
            data,
            include: { plan: true },
        });
    }
    async checkLimits(tenantId, resource) {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { plan: true },
        });
        if (!tenant) {
            throw new common_1.NotFoundException('Organization not found');
        }
        let current;
        if (resource === 'users') {
            const teams = await prisma.team.findMany({
                where: { tenantId },
                select: { id: true },
            });
            const teamIds = teams.map(t => t.id);
            current = await prisma.user.count({
                where: { teamId: { in: teamIds } },
            });
        }
        else {
            current = await prisma.project.count({
                where: { tenantId },
            });
        }
        const max = resource === 'users' ? Number(tenant.plan.maxUsers) : Number(tenant.plan.maxProjects);
        const canAdd = max === -1 || current < max;
        return {
            current,
            max,
            canAdd,
            remaining: max === -1 ? -1 : Math.max(0, max - current),
        };
    }
    async getTenantByUserId(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                team: {
                    include: {
                        tenant: {
                            include: { plan: true },
                        },
                    },
                },
            },
        });
        if (!user?.team?.tenant) {
            return null;
        }
        return {
            ...user.team.tenant,
            userRole: user.role,
        };
    }
};
exports.TenantService = TenantService;
exports.TenantService = TenantService = __decorate([
    (0, common_1.Injectable)()
], TenantService);
//# sourceMappingURL=tenant.service.js.map