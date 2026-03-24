import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

@Injectable()
export class TenantService {
  async createTenant(data: {
    name: string;
    slug: string;
    email: string;
    userName: string;
    password: string;
  }) {
    // Validate slug format
    const slugRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
    if (!slugRegex.test(data.slug) || data.slug.length < 3 || data.slug.length > 50) {
      throw new BadRequestException('Slug must be 3-50 characters, lowercase letters, numbers and hyphens only');
    }

    // Check if slug is available
    const existing = await prisma.tenant.findUnique({
      where: { slug: data.slug },
    });
    if (existing) {
      throw new ConflictException('This company URL is already in use');
    }

    // Check if email is available
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    // Get Free plan
    const freePlan = await prisma.plan.findFirst({
      where: { name: 'Free' },
    });
    if (!freePlan) {
      throw new NotFoundException('Free plan not found. Please contact support.');
    }

    // Create tenant with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: data.name,
          slug: data.slug,
          planId: freePlan.id,
        },
      });

      // Hash password
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.pbkdf2Sync(data.password, salt, 1000, 64, 'sha512').toString('hex');

      // Create owner user
      const user = await tx.user.create({
        data: {
          email: data.email,
          name: data.userName,
          passwordHash: salt + ':' + hash,
          role: 'OWNER',
        },
      });

      // Create default team
      const team = await tx.team.create({
        data: {
          name: 'Default Team',
          tenantId: tenant.id,
          ownerId: user.id,
        },
      });

      // Link user to team
      await tx.user.update({
        where: { id: user.id },
        data: { teamId: team.id },
      });

      return { tenant, user, team };
    });

    return result;
  }

  async getTenant(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { plan: true },
    });
    if (!tenant) {
      throw new NotFoundException('Organization not found');
    }
    return tenant;
  }

  async getTenantBySlug(slug: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      include: { plan: true },
    });
    if (!tenant) {
      throw new NotFoundException('Organization not found');
    }
    return tenant;
  }

  async updateTenant(tenantId: string, data: {
    name?: string;
    logo?: string;
    primaryColor?: string;
    customDomain?: string;
    timezone?: string;
  }) {
    return prisma.tenant.update({
      where: { id: tenantId },
      data,
      include: { plan: true },
    });
  }

  async checkLimits(tenantId: string, resource: 'users' | 'projects') {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { plan: true },
    });

    if (!tenant) {
      throw new NotFoundException('Organization not found');
    }

    let current: number;
    if (resource === 'users') {
      // Count users in teams belonging to this tenant
      const teams = await prisma.team.findMany({
        where: { tenantId },
        select: { id: true },
      });
      const teamIds = teams.map(t => t.id);

      current = await prisma.user.count({
        where: { teamId: { in: teamIds } },
      });
    } else {
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

  async getTenantByUserId(userId: string) {
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
}