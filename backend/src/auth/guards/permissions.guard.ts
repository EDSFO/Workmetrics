import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission, hasPermission, hasAnyPermission, hasAllPermissions } from '../permissions';
import { Role, hasRoleLevel } from '../roles/role.enum';

interface PermissionMeta {
  mode: 'ALL' | 'ANY';
  permissions: Permission[];
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permissionMeta = this.reflector.getAllAndOverride<PermissionMeta | null>(
      'permissions',
      [context.getHandler(), context.getClass()],
    );

    if (!permissionMeta) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    const userRole = user.role as Role;

    // AIDEV-NOTE: Convert legacy USER role to MEMBER
    const effectiveRole = userRole === 'USER' ? 'MEMBER' : userRole;

    // AIDEV-NOTE: First check if user has the required role level
    // This is for backwards compatibility with @Roles decorator
    const rolesMeta = this.reflector.getAllAndOverride<Role[]>(
      'roles',
      [context.getHandler(), context.getClass()],
    );

    if (rolesMeta && rolesMeta.length > 0) {
      // AIDEV-NOTE: Check if user has at least the highest required role
      const highestRequiredRole = rolesMeta.reduce((highest, role) => {
        const roleHierarchy = { OWNER: 100, ADMIN: 80, MANAGER: 60, MEMBER: 40, CLIENT: 20, USER: 40 };
        return roleHierarchy[role] > roleHierarchy[highest] ? role : highest;
      }, rolesMeta[0]);

      if (!hasRoleLevel(effectiveRole as Role, highestRequiredRole as Role)) {
        return false;
      }
    }

    // AIDEV-NOTE: Then check specific permissions if defined
    if (permissionMeta.permissions && permissionMeta.permissions.length > 0) {
      if (permissionMeta.mode === 'ALL') {
        return hasAllPermissions(effectiveRole, permissionMeta.permissions);
      } else {
        return hasAnyPermission(effectiveRole, permissionMeta.permissions);
      }
    }

    return true;
  }
}
