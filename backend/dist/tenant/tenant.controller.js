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
exports.TenantController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_service_1 = require("./tenant.service");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
let TenantController = class TenantController {
    constructor(tenantService) {
        this.tenantService = tenantService;
    }
    async register(registerDto) {
        const result = await this.tenantService.createTenant({
            name: registerDto.tenantName,
            slug: registerDto.slug,
            email: registerDto.email,
            userName: registerDto.name,
            password: registerDto.password,
        });
        return {
            message: 'Organization created successfully',
            tenant: {
                id: result.tenant.id,
                name: result.tenant.name,
                slug: result.tenant.slug,
            },
            user: {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
            },
        };
    }
    async getCurrent(req) {
        const tenant = await this.tenantService.getTenantByUserId(req.user.userId);
        if (!tenant) {
            return { error: 'User not associated with an organization' };
        }
        return tenant;
    }
    async updateSettings(req, settingsDto) {
        const tenant = await this.tenantService.getTenantByUserId(req.user.userId);
        if (!tenant) {
            return { error: 'User not associated with an organization' };
        }
        return this.tenantService.updateTenant(tenant.id, settingsDto);
    }
    async getLimits(req) {
        const tenant = await this.tenantService.getTenantByUserId(req.user.userId);
        if (!tenant) {
            return { error: 'User not associated with an organization' };
        }
        const [users, projects] = await Promise.all([
            this.tenantService.checkLimits(tenant.id, 'users'),
            this.tenantService.checkLimits(tenant.id, 'projects'),
        ]);
        return {
            users,
            projects,
            plan: {
                name: tenant.name,
                maxUsers: tenant.plan.maxUsers,
                maxProjects: tenant.plan.maxProjects,
            },
        };
    }
    async getPlan(req) {
        const tenant = await this.tenantService.getTenantByUserId(req.user.userId);
        if (!tenant) {
            return { error: 'User not associated with an organization' };
        }
        return {
            plan: tenant.plan,
            features: tenant.plan.features,
        };
    }
    async getAvailablePlans() {
        return prisma.plan.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            select: {
                id: true,
                name: true,
                monthlyPrice: true,
                maxUsers: true,
                maxProjects: true,
                features: true,
                sortOrder: true,
            },
        });
    }
};
exports.TenantController = TenantController;
__decorate([
    (0, common_1.Post)('register'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new organization with owner user (self-signup)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TenantController.prototype, "register", null);
__decorate([
    (0, common_1.Get)('current'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current organization' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TenantController.prototype, "getCurrent", null);
__decorate([
    (0, common_1.Put)('settings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update organization settings' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TenantController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Get)('limits'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get organization limits and usage' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TenantController.prototype, "getLimits", null);
__decorate([
    (0, common_1.Get)('plan'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current plan' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TenantController.prototype, "getPlan", null);
__decorate([
    (0, common_1.Get)('plans'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all available plans' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TenantController.prototype, "getAvailablePlans", null);
exports.TenantController = TenantController = __decorate([
    (0, swagger_1.ApiTags)('tenants'),
    (0, common_1.Controller)('tenants'),
    __metadata("design:paramtypes", [tenant_service_1.TenantService])
], TenantController);
//# sourceMappingURL=tenant.controller.js.map