// AIDEV-NOTE: Extended roles enum for RBAC system
// Hierarchy: OWNER > ADMIN > MANAGER > MEMBER > CLIENT
export enum Role {
  OWNER = 'OWNER',   // Full org access, billing, settings
  ADMIN = 'ADMIN',   // User management, all projects
  MANAGER = 'MANAGER', // Team and project management
  MEMBER = 'MEMBER', // Basic time tracking
  CLIENT = 'CLIENT', // View-only access to assigned projects
  USER = 'USER',     // Legacy alias for MEMBER (for backwards compatibility)
}

// AIDEV-NOTE: Role hierarchy - higher roles inherit permissions from lower roles
export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.OWNER]: 100,
  [Role.ADMIN]: 80,
  [Role.MANAGER]: 60,
  [Role.MEMBER]: 40,
  [Role.CLIENT]: 20,
  [Role.USER]: 40, // USER is alias for MEMBER
};

// AIDEV-NOTE: Check if a role has equal or higher privilege than another
export function hasRoleLevel(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// AIDEV-NOTE: Legacy role mapping for backwards compatibility
export const LEGACY_ROLE_MAPPING: Record<string, Role> = {
  'ADMIN': Role.ADMIN,
  'MANAGER': Role.MANAGER,
  'USER': Role.MEMBER,
};
