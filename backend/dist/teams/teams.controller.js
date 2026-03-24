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
exports.TeamsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const users_service_1 = require("../users/users.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/roles/roles.decorator");
const role_enum_1 = require("../auth/roles/role.enum");
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new client_1.PrismaClient();
let TeamsController = class TeamsController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    async getMembers(req) {
        if (req.user.role === role_enum_1.Role.ADMIN) {
            const users = await this.usersService.findAll();
            return { users };
        }
        if (req.user.teamId) {
            const users = await this.usersService.findByTeamId(req.user.teamId);
            return { users };
        }
        return { users: [] };
    }
    async getAllTeams(req) {
        const teams = await prisma.team.findMany({
            include: {
                users: { select: { id: true, name: true, email: true } },
            },
        });
        return { teams };
    }
    async createTeam(createDto, req) {
        const existingTeam = await prisma.team.findFirst({
            where: { name: createDto.name },
        });
        if (existingTeam) {
            return { error: 'A team with this name already exists' };
        }
        const ownerId = req.user.id;
        const team = await prisma.team.create({
            data: {
                name: createDto.name,
                ownerId: ownerId,
            },
        });
        await prisma.user.update({
            where: { id: ownerId },
            data: { teamId: team.id },
        });
        return { team };
    }
    async inviteMember(inviteDto, req) {
        const existingUser = await prisma.user.findUnique({
            where: { email: inviteDto.email },
        });
        if (existingUser) {
            return { error: 'User with this email already exists' };
        }
        let teamId = req.user.teamId;
        if (req.user.role === role_enum_1.Role.ADMIN) {
            if (!teamId) {
                return { error: 'You must be part of a team to invite members' };
            }
        }
        if (req.user.role === role_enum_1.Role.MANAGER && !teamId) {
            return { error: 'You must be part of a team to invite members' };
        }
        const token = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        const invitation = await prisma.teamInvitation.create({
            data: {
                teamId,
                email: inviteDto.email,
                token,
                expiresAt,
                status: 'PENDING',
            },
        });
        return {
            invitation: {
                id: invitation.id,
                email: invitation.email,
                token: invitation.token,
                expiresAt: invitation.expiresAt,
            },
            message: 'Invitation created. Share the token with the user.',
        };
    }
    async acceptInvitation(acceptDto) {
        const invitation = await prisma.teamInvitation.findUnique({
            where: { token: acceptDto.token },
        });
        if (!invitation) {
            return { error: 'Invalid invitation token' };
        }
        if (invitation.status !== 'PENDING') {
            return { error: 'Invitation already used or expired' };
        }
        if (new Date() > invitation.expiresAt) {
            return { error: 'Invitation has expired' };
        }
        const existingUser = await prisma.user.findUnique({
            where: { email: invitation.email },
        });
        if (existingUser) {
            return { error: 'User with this email already exists' };
        }
        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(acceptDto.password, salt);
        const user = await prisma.user.create({
            data: {
                email: invitation.email,
                passwordHash,
                name: acceptDto.name,
                role: 'USER',
                teamId: invitation.teamId,
            },
        });
        await prisma.teamInvitation.update({
            where: { id: invitation.id },
            data: { status: 'ACCEPTED' },
        });
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            message: 'Account created successfully',
        };
    }
    async changeRole(userId, updateDto, req) {
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (!targetUser) {
            return { error: 'User not found' };
        }
        if (req.user.role === role_enum_1.Role.MANAGER) {
            if (!req.user.teamId || targetUser.teamId !== req.user.teamId) {
                return { error: 'You can only change roles for members in your team' };
            }
            if (updateDto.role === role_enum_1.Role.ADMIN) {
                return { error: 'Only admins can assign ADMIN role' };
            }
        }
        if (req.user.role === role_enum_1.Role.ADMIN && targetUser.id === req.user.id && updateDto.role !== role_enum_1.Role.ADMIN) {
            return { error: 'Cannot remove your own admin role' };
        }
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { role: updateDto.role },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                teamId: true,
            },
        });
        return { user: updatedUser, message: 'Role updated successfully' };
    }
    async removeMember(userId, req) {
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (!targetUser) {
            return { error: 'User not found' };
        }
        if (targetUser.id === req.user.id) {
            return { error: 'Cannot remove yourself from the team' };
        }
        if (req.user.role === role_enum_1.Role.MANAGER) {
            if (!req.user.teamId || targetUser.teamId !== req.user.teamId) {
                return { error: 'You can only remove members from your team' };
            }
        }
        await prisma.user.update({
            where: { id: userId },
            data: { teamId: null },
        });
        return { message: 'User removed from team successfully' };
    }
};
exports.TeamsController = TeamsController;
__decorate([
    (0, common_1.Get)('members'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'List team members (Admin + Manager)' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "getMembers", null);
__decorate([
    (0, common_1.Get)('all'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'List all teams (Admin only)' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "getAllTeams", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new team (Admin only)' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "createTeam", null);
__decorate([
    (0, common_1.Post)('invite'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Invite a new team member by email' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "inviteMember", null);
__decorate([
    (0, common_1.Post)('accept'),
    (0, swagger_1.ApiOperation)({ summary: 'Accept invitation and create account' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "acceptInvitation", null);
__decorate([
    (0, common_1.Put)('members/:id/role'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Change user role in team' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "changeRole", null);
__decorate([
    (0, common_1.Delete)('members/:id'),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Remove user from team' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "removeMember", null);
exports.TeamsController = TeamsController = __decorate([
    (0, swagger_1.ApiTags)('team'),
    (0, common_1.Controller)('team'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], TeamsController);
//# sourceMappingURL=teams.controller.js.map