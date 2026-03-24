export declare enum Role {
    OWNER = "OWNER",
    ADMIN = "ADMIN",
    MANAGER = "MANAGER",
    MEMBER = "MEMBER",
    CLIENT = "CLIENT",
    USER = "USER"
}
export declare const ROLE_HIERARCHY: Record<Role, number>;
export declare function hasRoleLevel(userRole: Role, requiredRole: Role): boolean;
export declare const LEGACY_ROLE_MAPPING: Record<string, Role>;
