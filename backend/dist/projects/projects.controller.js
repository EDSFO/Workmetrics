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
exports.ProjectsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/roles/roles.decorator");
const role_enum_1 = require("../auth/roles/role.enum");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
let ProjectsController = class ProjectsController {
    async findAll(req) {
        if (req.user.role === role_enum_1.Role.ADMIN) {
            const projects = await prisma.project.findMany({
                include: { team: true },
            });
            return { projects };
        }
        if (req.user.teamId) {
            const projects = await prisma.project.findMany({
                where: { teamId: req.user.teamId },
                include: { team: true },
            });
            return { projects };
        }
        return { projects: [] };
    }
    async getTasksByProject(projectId, req) {
        if (req.user.role !== role_enum_1.Role.ADMIN && req.user.role !== role_enum_1.Role.MANAGER) {
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
    async create(createDto, req) {
        let teamId = createDto.teamId;
        if (req.user.role === role_enum_1.Role.MANAGER) {
            if (!req.user.teamId) {
                return { error: 'You must be part of a team to create projects' };
            }
            teamId = req.user.teamId;
        }
        if (req.user.role === role_enum_1.Role.ADMIN && !teamId) {
            return { error: 'teamId is required for admin users' };
        }
        if (!teamId) {
            return { error: 'teamId is required' };
        }
        const team = await prisma.team.findUnique({
            where: { id: teamId },
        });
        if (!team) {
            return { error: 'Team not found' };
        }
        if (req.user.role === role_enum_1.Role.MANAGER && req.user.teamId !== teamId) {
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
    async findOne(id, req) {
        const project = await prisma.project.findUnique({
            where: { id },
            include: { team: true },
        });
        if (!project) {
            return { error: 'Project not found' };
        }
        if (req.user.role !== role_enum_1.Role.ADMIN && req.user.role !== role_enum_1.Role.MANAGER) {
            if (project.teamId !== req.user.teamId) {
                return { error: 'Access denied' };
            }
        }
        return { project };
    }
    async update(id, updateDto, req) {
        const existingProject = await prisma.project.findUnique({
            where: { id },
        });
        if (!existingProject) {
            return { error: 'Project not found' };
        }
        if (req.user.role === role_enum_1.Role.MANAGER) {
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
    async archive(id, req) {
        const existingProject = await prisma.project.findUnique({
            where: { id },
        });
        if (!existingProject) {
            return { error: 'Project not found' };
        }
        if (req.user.role === role_enum_1.Role.MANAGER) {
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
};
exports.ProjectsController = ProjectsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.USER),
    (0, swagger_1.ApiOperation)({ summary: 'List all projects (own team for Manager/User, all for Admin)' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id/tasks'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Get tasks for a specific project' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "getTasksByProject", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new project' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific project by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Update a project' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Archive a project' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "archive", null);
exports.ProjectsController = ProjectsController = __decorate([
    (0, swagger_1.ApiTags)('projects'),
    (0, common_1.Controller)('projects'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)()
], ProjectsController);
//# sourceMappingURL=projects.controller.js.map