import { Controller, Get, Delete, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { Role } from '../auth/roles/role.enum';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all users (Admin only)' })
  async findAll(@Request() req: any) {
    // Additional check: only admin can list all users
    if (req.user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can list all users');
    }
    const users = await this.usersService.findAll();
    return { users };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async me(@Request() req: any) {
    return {
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        teamId: req.user.teamId,
      },
    };
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a user (Admin only)' })
  async delete(@Param('id') id: string, @Request() req: any) {
    // Additional check: only admin can delete users
    if (req.user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can delete users');
    }
    // Prevent admin from deleting themselves
    if (req.user.id === id) {
      throw new ForbiddenException('Cannot delete your own account');
    }
    await this.usersService.delete(id);
    return { message: 'User deleted successfully' };
  }
}
