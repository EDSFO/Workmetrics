import { SetMetadata } from '@nestjs/common';
import { Role } from './role.enum';

// AIDEV-NOTE: Custom decorator to specify required roles for endpoints
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
