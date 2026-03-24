"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_PERMISSIONS = exports.Permission = void 0;
exports.hasPermission = hasPermission;
exports.hasAnyPermission = hasAnyPermission;
exports.hasAllPermissions = hasAllPermissions;
var Permission;
(function (Permission) {
    Permission["TIME_ENTRY_CREATE"] = "TIME_ENTRY_CREATE";
    Permission["TIME_ENTRY_READ_OWN"] = "TIME_ENTRY_READ_OWN";
    Permission["TIME_ENTRY_READ_TEAM"] = "TIME_ENTRY_READ_TEAM";
    Permission["TIME_ENTRY_READ_ALL"] = "TIME_ENTRY_READ_ALL";
    Permission["TIME_ENTRY_UPDATE_OWN"] = "TIME_ENTRY_UPDATE_OWN";
    Permission["TIME_ENTRY_UPDATE_TEAM"] = "TIME_ENTRY_UPDATE_TEAM";
    Permission["TIME_ENTRY_UPDATE_ALL"] = "TIME_ENTRY_UPDATE_ALL";
    Permission["TIME_ENTRY_DELETE_OWN"] = "TIME_ENTRY_DELETE_OWN";
    Permission["TIME_ENTRY_DELETE_TEAM"] = "TIME_ENTRY_DELETE_TEAM";
    Permission["TIME_ENTRY_DELETE_ALL"] = "TIME_ENTRY_DELETE_ALL";
    Permission["TIME_ENTRY_APPROVE"] = "TIME_ENTRY_APPROVE";
    Permission["PROJECT_CREATE"] = "PROJECT_CREATE";
    Permission["PROJECT_READ"] = "PROJECT_READ";
    Permission["PROJECT_UPDATE"] = "PROJECT_UPDATE";
    Permission["PROJECT_DELETE"] = "PROJECT_DELETE";
    Permission["PROJECT_ARCHIVE"] = "PROJECT_ARCHIVE";
    Permission["TASK_CREATE"] = "TASK_CREATE";
    Permission["TASK_READ"] = "TASK_READ";
    Permission["TASK_UPDATE"] = "TASK_UPDATE";
    Permission["TASK_DELETE"] = "TASK_DELETE";
    Permission["USER_CREATE"] = "USER_CREATE";
    Permission["USER_READ"] = "USER_READ";
    Permission["USER_UPDATE"] = "USER_UPDATE";
    Permission["USER_DELETE"] = "USER_DELETE";
    Permission["USER_MANAGE_ROLES"] = "USER_MANAGE_ROLES";
    Permission["TEAM_CREATE"] = "TEAM_CREATE";
    Permission["TEAM_READ"] = "TEAM_READ";
    Permission["TEAM_UPDATE"] = "TEAM_UPDATE";
    Permission["TEAM_DELETE"] = "TEAM_DELETE";
    Permission["TEAM_INVITE"] = "TEAM_INVITE";
    Permission["TEAM_MANAGE"] = "TEAM_MANAGE";
    Permission["REPORT_READ_OWN"] = "REPORT_READ_OWN";
    Permission["REPORT_READ_TEAM"] = "REPORT_READ_TEAM";
    Permission["REPORT_READ_ALL"] = "REPORT_READ_ALL";
    Permission["REPORT_EXPORT"] = "REPORT_EXPORT";
    Permission["INVOICE_CREATE"] = "INVOICE_CREATE";
    Permission["INVOICE_READ"] = "INVOICE_READ";
    Permission["INVOICE_UPDATE"] = "INVOICE_UPDATE";
    Permission["INVOICE_DELETE"] = "INVOICE_DELETE";
    Permission["TIME_OFF_CREATE"] = "TIME_OFF_CREATE";
    Permission["TIME_OFF_READ_OWN"] = "TIME_OFF_READ_OWN";
    Permission["TIME_OFF_READ_TEAM"] = "TIME_OFF_READ_TEAM";
    Permission["TIME_OFF_APPROVE"] = "TIME_OFF_APPROVE";
    Permission["ORG_SETTINGS_READ"] = "ORG_SETTINGS_READ";
    Permission["ORG_SETTINGS_UPDATE"] = "ORG_SETTINGS_UPDATE";
    Permission["ORG_BILLING"] = "ORG_BILLING";
    Permission["ORG_EXPORT"] = "ORG_EXPORT";
    Permission["INTEGRATION_CREATE"] = "INTEGRATION_CREATE";
    Permission["INTEGRATION_READ"] = "INTEGRATION_READ";
    Permission["INTEGRATION_DELETE"] = "INTEGRATION_DELETE";
    Permission["API_KEY_CREATE"] = "API_KEY_CREATE";
    Permission["API_KEY_READ"] = "API_KEY_READ";
    Permission["API_KEY_DELETE"] = "API_KEY_DELETE";
})(Permission || (exports.Permission = Permission = {}));
exports.ROLE_PERMISSIONS = {
    OWNER: Object.values(Permission),
    ADMIN: [
        Permission.TIME_ENTRY_CREATE,
        Permission.TIME_ENTRY_READ_ALL,
        Permission.TIME_ENTRY_UPDATE_ALL,
        Permission.TIME_ENTRY_DELETE_ALL,
        Permission.TIME_ENTRY_APPROVE,
        Permission.PROJECT_CREATE,
        Permission.PROJECT_READ,
        Permission.PROJECT_UPDATE,
        Permission.PROJECT_DELETE,
        Permission.PROJECT_ARCHIVE,
        Permission.TASK_CREATE,
        Permission.TASK_READ,
        Permission.TASK_UPDATE,
        Permission.TASK_DELETE,
        Permission.USER_CREATE,
        Permission.USER_READ,
        Permission.USER_UPDATE,
        Permission.USER_DELETE,
        Permission.USER_MANAGE_ROLES,
        Permission.TEAM_CREATE,
        Permission.TEAM_READ,
        Permission.TEAM_UPDATE,
        Permission.TEAM_DELETE,
        Permission.TEAM_INVITE,
        Permission.TEAM_MANAGE,
        Permission.REPORT_READ_ALL,
        Permission.REPORT_EXPORT,
        Permission.INVOICE_CREATE,
        Permission.INVOICE_READ,
        Permission.INVOICE_UPDATE,
        Permission.INVOICE_DELETE,
        Permission.TIME_OFF_READ_TEAM,
        Permission.TIME_OFF_APPROVE,
        Permission.ORG_SETTINGS_READ,
        Permission.ORG_SETTINGS_UPDATE,
        Permission.INTEGRATION_CREATE,
        Permission.INTEGRATION_READ,
        Permission.INTEGRATION_DELETE,
        Permission.API_KEY_CREATE,
        Permission.API_KEY_READ,
        Permission.API_KEY_DELETE,
    ],
    MANAGER: [
        Permission.TIME_ENTRY_CREATE,
        Permission.TIME_ENTRY_READ_TEAM,
        Permission.TIME_ENTRY_UPDATE_TEAM,
        Permission.TIME_ENTRY_DELETE_TEAM,
        Permission.TIME_ENTRY_APPROVE,
        Permission.PROJECT_CREATE,
        Permission.PROJECT_READ,
        Permission.PROJECT_UPDATE,
        Permission.PROJECT_ARCHIVE,
        Permission.TASK_CREATE,
        Permission.TASK_READ,
        Permission.TASK_UPDATE,
        Permission.TASK_DELETE,
        Permission.USER_READ,
        Permission.TEAM_READ,
        Permission.TEAM_INVITE,
        Permission.REPORT_READ_TEAM,
        Permission.REPORT_EXPORT,
        Permission.INVOICE_CREATE,
        Permission.INVOICE_READ,
        Permission.INVOICE_UPDATE,
        Permission.TIME_OFF_READ_TEAM,
        Permission.TIME_OFF_APPROVE,
        Permission.ORG_SETTINGS_READ,
    ],
    MEMBER: [
        Permission.TIME_ENTRY_CREATE,
        Permission.TIME_ENTRY_READ_OWN,
        Permission.TIME_ENTRY_UPDATE_OWN,
        Permission.TIME_ENTRY_DELETE_OWN,
        Permission.PROJECT_READ,
        Permission.TASK_READ,
        Permission.TEAM_READ,
        Permission.REPORT_READ_OWN,
        Permission.TIME_OFF_CREATE,
        Permission.TIME_OFF_READ_OWN,
        Permission.ORG_SETTINGS_READ,
    ],
    CLIENT: [
        Permission.PROJECT_READ,
        Permission.TASK_READ,
        Permission.REPORT_READ_OWN,
    ],
};
function hasPermission(role, permission) {
    const permissions = exports.ROLE_PERMISSIONS[role];
    if (!permissions)
        return false;
    return permissions.includes(permission);
}
function hasAnyPermission(role, permissions) {
    return permissions.some(permission => hasPermission(role, permission));
}
function hasAllPermissions(role, permissions) {
    return permissions.every(permission => hasPermission(role, permission));
}
//# sourceMappingURL=permissions.js.map