import { SetMetadata } from '@nestjs/common';
import { Permission } from '../permissions';

// AIDEV-NOTE: Custom decorator to specify required permissions for endpoints
export const PERMISSIONS_KEY = 'permissions';

// AIDEV-NOTE: Require all specified permissions (AND logic)
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, { mode: 'ALL', permissions });

// AIDEV-NOTE: Require any of the specified permissions (OR logic)
export const RequireAnyPermission = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, { mode: 'ANY', permissions });
