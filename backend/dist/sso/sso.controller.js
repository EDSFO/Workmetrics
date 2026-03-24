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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SsoController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/roles/roles.decorator");
const role_enum_1 = require("../auth/roles/role.enum");
const sso_service_1 = require("./sso.service");
let SsoController = class SsoController {
    constructor(ssoService) {
        this.ssoService = ssoService;
    }
    async createProvider(req, body) {
        if (!req.user.teamId) {
            return { success: false, error: 'User is not part of a team' };
        }
        return this.ssoService.createProvider(req.user.teamId, body.type, body.name, body.config, body.defaultRole);
    }
    async listProviders(req) {
        if (!req.user.teamId) {
            return { providers: [] };
        }
        const providers = await this.ssoService.getProviders(req.user.teamId);
        return { providers };
    }
    async updateProvider(id, req, body) {
        if (!req.user.teamId) {
            return { success: false, error: 'User is not part of a team' };
        }
        return this.ssoService.updateProvider(id, req.user.teamId, body);
    }
    async deleteProvider(id, req) {
        if (!req.user.teamId) {
            return { success: false };
        }
        const success = await this.ssoService.deleteProvider(id, req.user.teamId);
        return { success };
    }
    async samlLogin(providerId, res) {
        const result = this.ssoService.generateSamlRequest(providerId);
        if (!result.success || !result.redirectUrl) {
            return res.status(400).json({ error: result.error });
        }
        return res.redirect(result.redirectUrl);
    }
    async samlCallback(providerId, body, res) {
        const result = await this.ssoService.handleSamlCallback(providerId, body.SAMLResponse, body.RelayState);
        if (!result.success) {
            return res.status(401).json({ error: result.error });
        }
        return res.json({
            success: true,
            user: {
                id: result.user?.id,
                email: result.user?.email,
                name: result.user?.name,
                role: result.user?.role,
            },
            isNewUser: result.isNewUser,
            message: 'SSO authentication successful',
        });
    }
    async oidcLogin(providerId, redirectUri, res) {
        const callbackUri = `${process.env.API_URL}/sso/oidc/${providerId}/callback`;
        const result = await this.ssoService.getOidcAuthUrl(providerId, callbackUri || redirectUri);
        if (!result.success || !result.url) {
            return res.status(400).json({ error: result.error });
        }
        return res.redirect(result.url);
    }
    async oidcCallback(providerId, code, state, res) {
        const callbackUri = `${process.env.API_URL}/sso/oidc/${providerId}/callback`;
        const result = await this.ssoService.handleOidcCallback(providerId, code, callbackUri);
        if (!result.success) {
            return res.status(401).json({ error: result.error });
        }
        return res.json({
            success: true,
            user: {
                id: result.user?.id,
                email: result.user?.email,
                name: result.user?.name,
                role: result.user?.role,
            },
            isNewUser: result.isNewUser,
            message: 'SSO authentication successful',
        });
    }
    async ldapLogin(providerId, body, res) {
        const result = await this.ssoService.authenticateLdap(providerId, body.username, body.password);
        if (!result.success) {
            return res.status(401).json({ error: result.error });
        }
        return res.json({
            success: true,
            user: {
                id: result.user?.id,
                email: result.user?.email,
                name: result.user?.name,
                role: result.user?.role,
            },
            isNewUser: result.isNewUser,
            message: 'LDAP authentication successful',
        });
    }
};
exports.SsoController = SsoController;
__decorate([
    (0, common_1.Post)('providers'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.OWNER),
    (0, swagger_1.ApiOperation)({ summary: 'Create SSO provider configuration' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SsoController.prototype, "createProvider", null);
__decorate([
    (0, common_1.Get)('providers'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.OWNER),
    (0, swagger_1.ApiOperation)({ summary: 'List SSO providers for team' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SsoController.prototype, "listProviders", null);
__decorate([
    (0, common_1.Put)('providers/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.OWNER),
    (0, swagger_1.ApiOperation)({ summary: 'Update SSO provider' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SsoController.prototype, "updateProvider", null);
__decorate([
    (0, common_1.Delete)('providers/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.OWNER),
    (0, swagger_1.ApiOperation)({ summary: 'Delete SSO provider' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SsoController.prototype, "deleteProvider", null);
__decorate([
    (0, common_1.Get)('saml/:providerId/login'),
    (0, swagger_1.ApiOperation)({ summary: 'Initiate SAML login' }),
    __param(0, (0, common_1.Param)('providerId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SsoController.prototype, "samlLogin", null);
__decorate([
    (0, common_1.Post)('saml/:providerId/acs'),
    (0, swagger_1.ApiOperation)({ summary: 'SAML Assertion Consumer Service' }),
    __param(0, (0, common_1.Param)('providerId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SsoController.prototype, "samlCallback", null);
__decorate([
    (0, common_1.Get)('oidc/:providerId/login'),
    (0, swagger_1.ApiOperation)({ summary: 'Initiate OIDC login' }),
    __param(0, (0, common_1.Param)('providerId')),
    __param(1, (0, common_1.Query)('redirect_uri')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], SsoController.prototype, "oidcLogin", null);
__decorate([
    (0, common_1.Get)('oidc/:providerId/callback'),
    (0, swagger_1.ApiOperation)({ summary: 'OIDC callback' }),
    __param(0, (0, common_1.Param)('providerId')),
    __param(1, (0, common_1.Query)('code')),
    __param(2, (0, common_1.Query)('state')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], SsoController.prototype, "oidcCallback", null);
__decorate([
    (0, common_1.Post)('ldap/:providerId/login'),
    (0, swagger_1.ApiOperation)({ summary: 'Authenticate via LDAP' }),
    __param(0, (0, common_1.Param)('providerId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SsoController.prototype, "ldapLogin", null);
exports.SsoController = SsoController = __decorate([
    (0, swagger_1.ApiTags)('sso'),
    (0, common_1.Controller)('sso'),
    __metadata("design:paramtypes", [sso_service_1.SsoService])
], SsoController);
//# sourceMappingURL=sso.controller.js.map