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
exports.TasksController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/roles/roles.decorator");
const role_enum_1 = require("../auth/roles/role.enum");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
let TasksController = class TasksController {
    async findByProject(projectId, req) {
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
            orderBy: { createdAt: 'desc' },
        });
        return { tasks };
    }
    async create(projectId, createDto, req) {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });
        if (!project) {
            return { error: 'Project not found' };
        }
        if (req.user.role === role_enum_1.Role.MANAGER) {
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
    async findOne(id, req) {
        const task = await prisma.task.findUnique({
            where: { id },
            include: { project: true },
        });
        if (!task) {
            return { error: 'Task not found' };
        }
        if (req.user.role !== role_enum_1.Role.ADMIN && req.user.role !== role_enum_1.Role.MANAGER) {
            if (task.project.teamId !== req.user.teamId) {
                return { error: 'Access denied' };
            }
        }
        return { task };
    }
    async update(id, updateDto, req) {
        const existingTask = await prisma.task.findUnique({
            where: { id },
            include: { project: true },
        });
        if (!existingTask) {
            return { error: 'Task not found' };
        }
        if (req.user.role === role_enum_1.Role.MANAGER) {
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
    async delete(id, req) {
        const existingTask = await prisma.task.findUnique({
            where: { id },
            include: { project: true },
        });
        if (!existingTask) {
            return { error: 'Task not found' };
        }
        if (req.user.role === role_enum_1.Role.MANAGER) {
            if (!req.user.teamId || existingTask.project.teamId !== req.user.teamId) {
                return { error: 'You can only delete tasks in your team\'s projects' };
            }
        }
        await prisma.task.delete({
            where: { id },
        });
        return { message: 'Task deleted successfully' };
    }
};
exports.TasksController = TasksController;
__decorate([
    (0, common_1.Get)('project/:projectId'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Get tasks for a specific project' }),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "findByProject", null);
__decorate([
    (0, common_1.Post)('project/:projectId'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new task in a project' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Param)('projectId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER, role_enum_1.Role.USER),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific task by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Update a task' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a task' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "delete", null);
exports.TasksController = TasksController = __decorate([
    (0, swagger_1.ApiTags)('tasks'),
    (0, common_1.Controller)('tasks'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)()
], TasksController);
//# sourceMappingURL=tasks.controller.js.map