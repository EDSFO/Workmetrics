import { Controller, Get, Post, Put, Delete, UseGuards, Request, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { Role } from '../auth/roles/role.enum';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

@ApiTags('team')
@Controller('team')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TeamsController {
  constructor(private usersService: UsersService) {}

  @Get('members')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'List team members (Admin + Manager)' })
  async getMembers(@Request() req: any) {
    // Admin can see all users, Manager sees their team
    if (req.user.role === Role.ADMIN) {
      const users = await this.usersService.findAll();
      return { users };
    }

    // Manager sees only their team
    if (req.user.teamId) {
      const users = await this.usersService.findByTeamId(req.user.teamId);
      return { users };
    }

    return { users: [] };
  }

  @Get('all')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all teams (Admin only)' })
  async getAllTeams(@Request() req: any) {
    const teams = await prisma.team.findMany({
      include: {
        users: { select: { id: true, name: true, email: true } },
      },
    });
    return { teams };
  }

  /**
   * AIDEV-NOTE: Team - Create new team
   */
  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new team (Admin only)' })
  @HttpCode(HttpStatus.CREATED)
  async createTeam(@Body() createDto: { name: string }, @Request() req: any) {
    // Check if team name already exists
    const existingTeam = await prisma.team.findFirst({
      where: { name: createDto.name },
    });

    if (existingTeam) {
      return { error: 'A team with this name already exists' };
    }

    // Get the current user's ID as the owner
    const ownerId = req.user.id;

    // Create the team with the current user as owner
    const team = await prisma.team.create({
      data: {
        name: createDto.name,
        ownerId: ownerId,
      },
    });

    // Also assign the user to the team
    await prisma.user.update({
      where: { id: ownerId },
      data: { teamId: team.id },
    });

    return { team };
  }

  /**
   * AIDEV-NOTE: Team - Invite new member by email
   */
  @Post('invite')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Invite a new team member by email' })
  @HttpCode(HttpStatus.CREATED)
  async inviteMember(@Body() inviteDto: { email: string; role?: string }, @Request() req: any) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: inviteDto.email },
    });

    if (existingUser) {
      return { error: 'User with this email already exists' };
    }

    // Determine team ID
    let teamId = req.user.teamId;
    if (req.user.role === Role.ADMIN) {
      // Admin needs to be part of a team to invite
      if (!teamId) {
        return { error: 'You must be part of a team to invite members' };
      }
    }

    // Managers can only invite to their team
    if (req.user.role === Role.MANAGER && !teamId) {
      return { error: 'You must be part of a team to invite members' };
    }

    // Generate invitation token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Create invitation
    const invitation = await prisma.teamInvitation.create({
      data: {
        teamId,
        email: inviteDto.email,
        token,
        expiresAt,
        status: 'PENDING',
      },
    });

    // In production, send email with invitation link
    // For MVP, return the token directly
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

  /**
   * AIDEV-NOTE: Team - Accept invitation and create account
   */
  @Post('accept')
  @ApiOperation({ summary: 'Accept invitation and create account' })
  @HttpCode(HttpStatus.CREATED)
  async acceptInvitation(@Body() acceptDto: { token: string; name: string; password: string }) {
    // Find invitation
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

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      return { error: 'User with this email already exists' };
    }

    // Hash password
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(acceptDto.password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: invitation.email,
        passwordHash,
        name: acceptDto.name,
        role: 'USER',
        teamId: invitation.teamId,
      },
    });

    // Update invitation status
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

  /**
   * AIDEV-NOTE: Team - Change user role
   */
  @Put('members/:id/role')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Change user role in team' })
  async changeRole(@Param('id') userId: string, @Body() updateDto: { role: string }, @Request() req: any) {
    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return { error: 'User not found' };
    }

    // Managers can only change roles within their team
    if (req.user.role === Role.MANAGER) {
      if (!req.user.teamId || targetUser.teamId !== req.user.teamId) {
        return { error: 'You can only change roles for members in your team' };
      }

      // Managers cannot assign ADMIN role
      if (updateDto.role === Role.ADMIN) {
        return { error: 'Only admins can assign ADMIN role' };
      }
    }

    // Prevent removing own admin role
    if (req.user.role === Role.ADMIN && targetUser.id === req.user.id && updateDto.role !== Role.ADMIN) {
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

  /**
   * AIDEV-NOTE: Team - Remove user from team
   */
  @Delete('members/:id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Remove user from team' })
  async removeMember(@Param('id') userId: string, @Request() req: any) {
    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return { error: 'User not found' };
    }

    // Cannot remove yourself
    if (targetUser.id === req.user.id) {
      return { error: 'Cannot remove yourself from the team' };
    }

    // Managers can only remove members from their team
    if (req.user.role === Role.MANAGER) {
      if (!req.user.teamId || targetUser.teamId !== req.user.teamId) {
        return { error: 'You can only remove members from your team' };
      }
    }

    // Remove user's team association (don't delete the user)
    await prisma.user.update({
      where: { id: userId },
      data: { teamId: null },
    });

    return { message: 'User removed from team successfully' };
  }
}
