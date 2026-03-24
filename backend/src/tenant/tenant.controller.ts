import { Controller, Get, Post, Put, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantService } from './tenant.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@ApiTags('tenants')
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new organization with owner user (self-signup)' })
  async register(@Body() registerDto: {
    tenantName: string;
    slug: string;
    email: string;
    name: string;
    password: string;
  }) {
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

  @Get('current')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current organization' })
  async getCurrent(@Request() req: any) {
    const tenant = await this.tenantService.getTenantByUserId(req.user.userId);
    if (!tenant) {
      return { error: 'User not associated with an organization' };
    }
    return tenant;
  }

  @Put('settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update organization settings' })
  async updateSettings(@Request() req: any, @Body() settingsDto: {
    name?: string;
    logo?: string;
    primaryColor?: string;
    customDomain?: string;
    timezone?: string;
  }) {
    const tenant = await this.tenantService.getTenantByUserId(req.user.userId);
    if (!tenant) {
      return { error: 'User not associated with an organization' };
    }
    return this.tenantService.updateTenant(tenant.id, settingsDto);
  }

  @Get('limits')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get organization limits and usage' })
  async getLimits(@Request() req: any) {
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

  @Get('plan')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current plan' })
  async getPlan(@Request() req: any) {
    const tenant = await this.tenantService.getTenantByUserId(req.user.userId);
    if (!tenant) {
      return { error: 'User not associated with an organization' };
    }

    return {
      plan: tenant.plan,
      features: tenant.plan.features,
    };
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get all available plans' })
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
}