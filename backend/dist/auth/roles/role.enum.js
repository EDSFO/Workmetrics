"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEGACY_ROLE_MAPPING = exports.ROLE_HIERARCHY = exports.Role = void 0;
exports.hasRoleLevel = hasRoleLevel;
var Role;
(function (Role) {
    Role["OWNER"] = "OWNER";
    Role["ADMIN"] = "ADMIN";
    Role["MANAGER"] = "MANAGER";
    Role["MEMBER"] = "MEMBER";
    Role["CLIENT"] = "CLIENT";
    Role["USER"] = "USER";
})(Role || (exports.Role = Role = {}));
exports.ROLE_HIERARCHY = {
    [Role.OWNER]: 100,
    [Role.ADMIN]: 80,
    [Role.MANAGER]: 60,
    [Role.MEMBER]: 40,
    [Role.CLIENT]: 20,
    [Role.USER]: 40,
};
function hasRoleLevel(userRole, requiredRole) {
    return exports.ROLE_HIERARCHY[userRole] >= exports.ROLE_HIERARCHY[requiredRole];
}
exports.LEGACY_ROLE_MAPPING = {
    'ADMIN': Role.ADMIN,
    'MANAGER': Role.MANAGER,
    'USER': Role.MEMBER,
};
//# sourceMappingURL=role.enum.js.map