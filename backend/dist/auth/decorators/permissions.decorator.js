"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequireAnyPermission = exports.RequirePermissions = exports.PERMISSIONS_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.PERMISSIONS_KEY = 'permissions';
const RequirePermissions = (...permissions) => (0, common_1.SetMetadata)(exports.PERMISSIONS_KEY, { mode: 'ALL', permissions });
exports.RequirePermissions = RequirePermissions;
const RequireAnyPermission = (...permissions) => (0, common_1.SetMetadata)(exports.PERMISSIONS_KEY, { mode: 'ANY', permissions });
exports.RequireAnyPermission = RequireAnyPermission;
//# sourceMappingURL=permissions.decorator.js.map