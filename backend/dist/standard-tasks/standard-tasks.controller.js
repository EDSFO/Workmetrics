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
exports.StandardTasksController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/roles/roles.decorator");
const role_enum_1 = require("../auth/roles/role.enum");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
let StandardTasksController = class StandardTasksController {
    async findAll() {
        const tasks = await prisma.standardTask.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
        });
        return { standardTasks: tasks };
    }
    async create(createDto) {
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
    async findOne(id) {
        const task = await prisma.standardTask.findUnique({
            where: { id },
        });
        if (!task) {
            return { error: 'Standard task not found' };
        }
        return { standardTask: task };
    }
    async update(id, updateDto) {
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
    async delete(id) {
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
    async applyToProject(id, projectId, req) {
        const standardTask = await prisma.standardTask.findUnique({
            where: { id },
        });
        if (!standardTask) {
            return { error: 'Standard task not found' };
        }
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });
        if (!project) {
            return { error: 'Project not found' };
        }
        if (req.user.role === role_enum_1.Role.MANAGER) {
            if (!req.user.teamId || project.teamId !== req.user.teamId) {
                return { error: 'You can only apply tasks to your team\'s projects' };
            }
        }
        const existingTask = await prisma.task.findFirst({
            where: {
                projectId,
                name: standardTask.name,
            },
        });
        if (existingTask) {
            return { error: 'A task with this name already exists in the project' };
        }
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
};
exports.StandardTasksController = StandardTasksController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'List all standard tasks (admin only)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StandardTasksController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new standard task (admin only)' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StandardTasksController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific standard task by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StandardTasksController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update a standard task' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], StandardTasksController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a standard task (soft delete)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StandardTasksController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/apply-to-project/:projectId'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Apply a standard task to a project' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('projectId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], StandardTasksController.prototype, "applyToProject", null);
exports.StandardTasksController = StandardTasksController = __decorate([
    (0, swagger_1.ApiTags)('standard-tasks'),
    (0, common_1.Controller)('standard-tasks'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)()
], StandardTasksController);
//# sourceMappingURL=standard-tasks.controller.js.map