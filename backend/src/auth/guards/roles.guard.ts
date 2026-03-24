import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, hasRoleLevel } from '../roles/role.enum';
import { ROLES_KEY } from '../roles/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    const userRole = user.role as Role;

    // AIDEV-NOTE: Convert legacy USER role to MEMBER for hierarchy checks
    const effectiveRole = userRole === 'USER' ? Role.MEMBER : userRole;

    // AIDEV-NOTE: Check if user has equal or higher role than any of the required roles
    // Using 'any' logic - user just needs ONE of the specified roles
    return requiredRoles.some(requiredRole => hasRoleLevel(effectiveRole, requiredRole));
  }
}
