import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class UsersService implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await prisma.$connect();
  }

  async onModuleDestroy() {
    await prisma.$disconnect();
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
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

  async findByTeamId(teamId: string) {
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

  async updateRole(userId: string, role: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  }

  async delete(userId: string) {
    return prisma.user.delete({
      where: { id: userId },
    });
  }

  async create(data: { email: string; passwordHash: string; name: string; role?: string; teamId?: string }) {
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
}
