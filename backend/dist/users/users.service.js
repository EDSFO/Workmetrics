"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
let UsersService = class UsersService {
    async onModuleInit() {
        await prisma.$connect();
    }
    async onModuleDestroy() {
        await prisma.$disconnect();
    }
    async findByEmail(email) {
        return prisma.user.findUnique({
            where: { email },
        });
    }
    async findById(id) {
        return prisma.user.findUnique({
            where: { id },
            include: {
                team: {
                    include: {
                        tenant: true,
                    },
                },
            },
        });
    }
    async findAll() {
        return prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                teamId: true,
                hourlyRate: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }
    async findByTeamId(teamId) {
        return prisma.user.findMany({
            where: { teamId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                teamId: true,
                hourlyRate: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }
    async updateRole(userId, role) {
        return prisma.user.update({
            where: { id: userId },
            data: { role },
        });
    }
    async delete(userId) {
        return prisma.user.delete({
            where: { id: userId },
        });
    }
    async create(data) {
        return prisma.user.create({
            data: {
                email: data.email,
                passwordHash: data.passwordHash,
                name: data.name,
                role: data.role || 'USER',
                teamId: data.teamId,
            },
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)()
], UsersService);
//# sourceMappingURL=users.service.js.map