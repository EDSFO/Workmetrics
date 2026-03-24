import { Permission } from '../permissions';
export declare const PERMISSIONS_KEY = "permissions";
export declare const RequirePermissions: (...permissions: Permission[]) => import("@nestjs/common").CustomDecorator<string>;
export declare const RequireAnyPermission: (...permissions: Permission[]) => import("@nestjs/common").CustomDecorator<string>;
