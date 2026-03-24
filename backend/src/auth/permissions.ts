// AIDEV-NOTE: Permission constants for fine-grained access control
// Permissions are grouped by resource and action

export enum Permission {
  // Time Entries
  TIME_ENTRY_CREATE = 'TIME_ENTRY_CREATE',
  TIME_ENTRY_READ_OWN = 'TIME_ENTRY_READ_OWN',
  TIME_ENTRY_READ_TEAM = 'TIME_ENTRY_READ_TEAM',
  TIME_ENTRY_READ_ALL = 'TIME_ENTRY_READ_ALL',
  TIME_ENTRY_UPDATE_OWN = 'TIME_ENTRY_UPDATE_OWN',
  TIME_ENTRY_UPDATE_TEAM = 'TIME_ENTRY_UPDATE_TEAM',
  TIME_ENTRY_UPDATE_ALL = 'TIME_ENTRY_UPDATE_ALL',
  TIME_ENTRY_DELETE_OWN = 'TIME_ENTRY_DELETE_OWN',
  TIME_ENTRY_DELETE_TEAM = 'TIME_ENTRY_DELETE_TEAM',
  TIME_ENTRY_DELETE_ALL = 'TIME_ENTRY_DELETE_ALL',
  TIME_ENTRY_APPROVE = 'TIME_ENTRY_APPROVE',

  // Projects
  PROJECT_CREATE = 'PROJECT_CREATE',
  PROJECT_READ = 'PROJECT_READ',
  PROJECT_UPDATE = 'PROJECT_UPDATE',
  PROJECT_DELETE = 'PROJECT_DELETE',
  PROJECT_ARCHIVE = 'PROJECT_ARCHIVE',

  // Tasks
  TASK_CREATE = 'TASK_CREATE',
  TASK_READ = 'TASK_READ',
  TASK_UPDATE = 'TASK_UPDATE',
  TASK_DELETE = 'TASK_DELETE',

  // Users
  USER_CREATE = 'USER_CREATE',
  USER_READ = 'USER_READ',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',
  USER_MANAGE_ROLES = 'USER_MANAGE_ROLES',

  // Teams
  TEAM_CREATE = 'TEAM_CREATE',
  TEAM_READ = 'TEAM_READ',
  TEAM_UPDATE = 'TEAM_UPDATE',
  TEAM_DELETE = 'TEAM_DELETE',
  TEAM_INVITE = 'TEAM_INVITE',
  TEAM_MANAGE = 'TEAM_MANAGE',

  // Reports
  REPORT_READ_OWN = 'REPORT_READ_OWN',
  REPORT_READ_TEAM = 'REPORT_READ_TEAM',
  REPORT_READ_ALL = 'REPORT_READ_ALL',
  REPORT_EXPORT = 'REPORT_EXPORT',

  // Invoices
  INVOICE_CREATE = 'INVOICE_CREATE',
  INVOICE_READ = 'INVOICE_READ',
  INVOICE_UPDATE = 'INVOICE_UPDATE',
  INVOICE_DELETE = 'INVOICE_DELETE',

  // Time Off
  TIME_OFF_CREATE = 'TIME_OFF_CREATE',
  TIME_OFF_READ_OWN = 'TIME_OFF_READ_OWN',
  TIME_OFF_READ_TEAM = 'TIME_OFF_READ_TEAM',
  TIME_OFF_APPROVE = 'TIME_OFF_APPROVE',

  // Organization
  ORG_SETTINGS_READ = 'ORG_SETTINGS_READ',
  ORG_SETTINGS_UPDATE = 'ORG_SETTINGS_UPDATE',
  ORG_BILLING = 'ORG_BILLING',
  ORG_EXPORT = 'ORG_EXPORT',

  // Integrations
  INTEGRATION_CREATE = 'INTEGRATION_CREATE',
  INTEGRATION_READ = 'INTEGRATION_READ',
  INTEGRATION_DELETE = 'INTEGRATION_DELETE',
  API_KEY_CREATE = 'API_KEY_CREATE',
  API_KEY_READ = 'API_KEY_READ',
  API_KEY_DELETE = 'API_KEY_DELETE',
}

// AIDEV-NOTE: Role to permissions mapping
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  OWNER: Object.values(Permission), // All permissions

  ADMIN: [
    // Time Entries
    Permission.TIME_ENTRY_CREATE,
    Permission.TIME_ENTRY_READ_ALL,
    Permission.TIME_ENTRY_UPDATE_ALL,
    Permission.TIME_ENTRY_DELETE_ALL,
    Permission.TIME_ENTRY_APPROVE,

    // Projects
    Permission.PROJECT_CREATE,
    Permission.PROJECT_READ,
    Permission.PROJECT_UPDATE,
    Permission.PROJECT_DELETE,
    Permission.PROJECT_ARCHIVE,

    // Tasks
    Permission.TASK_CREATE,
    Permission.TASK_READ,
    Permission.TASK_UPDATE,
    Permission.TASK_DELETE,

    // Users
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.USER_MANAGE_ROLES,

    // Teams
    Permission.TEAM_CREATE,
    Permission.TEAM_READ,
    Permission.TEAM_UPDATE,
    Permission.TEAM_DELETE,
    Permission.TEAM_INVITE,
    Permission.TEAM_MANAGE,

    // Reports
    Permission.REPORT_READ_ALL,
    Permission.REPORT_EXPORT,

    // Invoices
    Permission.INVOICE_CREATE,
    Permission.INVOICE_READ,
    Permission.INVOICE_UPDATE,
    Permission.INVOICE_DELETE,

    // Time Off
    Permission.TIME_OFF_READ_TEAM,
    Permission.TIME_OFF_APPROVE,

    // Organization
    Permission.ORG_SETTINGS_READ,
    Permission.ORG_SETTINGS_UPDATE,

    // Integrations
    Permission.INTEGRATION_CREATE,
    Permission.INTEGRATION_READ,
    Permission.INTEGRATION_DELETE,
    Permission.API_KEY_CREATE,
    Permission.API_KEY_READ,
    Permission.API_KEY_DELETE,
  ],

  MANAGER: [
    // Time Entries
    Permission.TIME_ENTRY_CREATE,
    Permission.TIME_ENTRY_READ_TEAM,
    Permission.TIME_ENTRY_UPDATE_TEAM,
    Permission.TIME_ENTRY_DELETE_TEAM,
    Permission.TIME_ENTRY_APPROVE,

    // Projects
    Permission.PROJECT_CREATE,
    Permission.PROJECT_READ,
    Permission.PROJECT_UPDATE,
    Permission.PROJECT_ARCHIVE,

    // Tasks
    Permission.TASK_CREATE,
    Permission.TASK_READ,
    Permission.TASK_UPDATE,
    Permission.TASK_DELETE,

    // Users
    Permission.USER_READ,

    // Teams
    Permission.TEAM_READ,
    Permission.TEAM_INVITE,

    // Reports
    Permission.REPORT_READ_TEAM,
    Permission.REPORT_EXPORT,

    // Invoices
    Permission.INVOICE_CREATE,
    Permission.INVOICE_READ,
    Permission.INVOICE_UPDATE,

    // Time Off
    Permission.TIME_OFF_READ_TEAM,
    Permission.TIME_OFF_APPROVE,

    // Organization
    Permission.ORG_SETTINGS_READ,
  ],

  MEMBER: [
    // Time Entries
    Permission.TIME_ENTRY_CREATE,
    Permission.TIME_ENTRY_READ_OWN,
    Permission.TIME_ENTRY_UPDATE_OWN,
    Permission.TIME_ENTRY_DELETE_OWN,

    // Projects
    Permission.PROJECT_READ,

    // Tasks
    Permission.TASK_READ,

    // Teams
    Permission.TEAM_READ,

    // Reports
    Permission.REPORT_READ_OWN,

    // Time Off
    Permission.TIME_OFF_CREATE,
    Permission.TIME_OFF_READ_OWN,

    // Organization
    Permission.ORG_SETTINGS_READ,
  ],

  CLIENT: [
    // Projects
    Permission.PROJECT_READ,

    // Tasks
    Permission.TASK_READ,

    // Reports
    Permission.REPORT_READ_OWN,
  ],
};

// AIDEV-NOTE: Check if a role has a specific permission
export function hasPermission(role: string, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

// AIDEV-NOTE: Check if a role has any of the specified permissions
export function hasAnyPermission(role: string, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

// AIDEV-NOTE: Check if a role has all of the specified permissions
export function hasAllPermissions(role: string, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}
