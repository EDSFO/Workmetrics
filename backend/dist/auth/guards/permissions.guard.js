"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionsGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const permissions_1 = require("../permissions");
const role_enum_1 = require("../roles/role.enum");
let PermissionsGuard = class PermissionsGuard {
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const permissionMeta = this.reflector.getAllAndOverride('permissions', [context.getHandler(), context.getClass()]);
        if (!permissionMeta) {
            return true;
        }
        const { user } = context.switchToHttp().getRequest();
        const userRole = user.role;
        const effectiveRole = userRole === 'USER' ? 'MEMBER' : userRole;
        const rolesMeta = this.reflector.getAllAndOverride('roles', [context.getHandler(), context.getClass()]);
        if (rolesMeta && rolesMeta.length > 0) {
            const highestRequiredRole = rolesMeta.reduce((highest, role) => {
                const roleHierarchy = { OWNER: 100, ADMIN: 80, MANAGER: 60, MEMBER: 40, CLIENT: 20, USER: 40 };
                return roleHierarchy[role] > roleHierarchy[highest] ? role : highest;
            }, rolesMeta[0]);
            if (!(0, role_enum_1.hasRoleLevel)(effectiveRole, highestRequiredRole)) {
                return false;
            }
        }
        if (permissionMeta.permissions && permissionMeta.permissions.length > 0) {
            if (permissionMeta.mode === 'ALL') {
                return (0, permissions_1.hasAllPermissions)(effectiveRole, permissionMeta.permissions);
            }
            else {
                return (0, permissions_1.hasAnyPermission)(effectiveRole, permissionMeta.permissions);
            }
        }
        return true;
    }
};
exports.PermissionsGuard = PermissionsGuard;
exports.PermissionsGuard = PermissionsGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], PermissionsGuard);
//# sourceMappingURL=permissions.guard.js.map