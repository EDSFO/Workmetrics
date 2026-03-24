"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SsoService = exports.SSO_PROVIDER_TYPES = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const crypto = require("crypto");
const prisma = new client_1.PrismaClient();
exports.SSO_PROVIDER_TYPES = {
    SAML: 'saml',
    OIDC: 'oidc',
    LDAP: 'ldap',
};
let SsoService = class SsoService {
    async createProvider(teamId, type, name, config, defaultRole = 'MEMBER') {
        try {
            if (type === exports.SSO_PROVIDER_TYPES.SAML) {
                if (!config.entityId || !config.ssoUrl || !config.certificate) {
                    return { success: false, error: 'SAML requires entityId, ssoUrl, and certificate' };
                }
            }
            else if (type === exports.SSO_PROVIDER_TYPES.OIDC) {
                if (!config.issuer || !config.clientId || !config.clientSecret) {
                    return { success: false, error: 'OIDC requires issuer, clientId, and clientSecret' };
                }
            }
            else if (type === exports.SSO_PROVIDER_TYPES.LDAP) {
                if (!config.server || !config.bindDn || !config.searchBase) {
                    return { success: false, error: 'LDAP requires server, bindDn, and searchBase' };
                }
            }
            const provider = await prisma.ssoProvider.create({
                data: {
                    teamId,
                    type,
                    name,
                    config,
                    defaultRole,
                    enabled: true,
                },
            });
            return { success: true, provider };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async getProviders(teamId) {
        return prisma.ssoProvider.findMany({
            where: { teamId },
            select: {
                id: true,
                type: true,
                name: true,
                enabled: true,
                defaultRole: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }
    async updateProvider(providerId, teamId, updates) {
        try {
            const existing = await prisma.ssoProvider.findFirst({
                where: { id: providerId, teamId },
            });
            if (!existing) {
                return { success: false, error: 'Provider not found' };
            }
            await prisma.ssoProvider.update({
                where: { id: providerId },
                data: {
                    enabled: updates.enabled ?? existing.enabled,
                    config: updates.config ?? existing.config,
                    defaultRole: updates.defaultRole ?? existing.defaultRole,
                },
            });
            return { success: true };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async deleteProvider(providerId, teamId) {
        try {
            await prisma.ssoProvider.delete({
                where: { id: providerId, teamId },
            });
            return true;
        }
        catch {
            return false;
        }
    }
    generateSamlRequest(providerId) {
        return {
            success: true,
            redirectUrl: `/sso/saml/${providerId}/login`,
        };
    }
    async handleSamlCallback(providerId, samlResponse, requestId) {
        try {
            const provider = await prisma.ssoProvider.findUnique({
                where: { id: providerId },
            });
            if (!provider || !provider.enabled) {
                return { success: false, error: 'Provider not found or disabled' };
            }
            const userData = this.parseSamlResponse(samlResponse, provider.config);
            if (!userData) {
                return { success: false, error: 'Invalid SAML response' };
            }
            const { user, isNewUser } = await this.findOrCreateSsoUser(provider.teamId, provider.type, userData, provider.defaultRole);
            return { success: true, user, isNewUser };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    parseSamlResponse(response, config) {
        try {
            return {
                email: 'user@example.com',
                name: 'SAML User',
                firstName: 'SAML',
                lastName: 'User',
                groups: [],
            };
        }
        catch {
            return null;
        }
    }
    async getOidcAuthUrl(providerId, redirectUri) {
        try {
            const provider = await prisma.ssoProvider.findUnique({
                where: { id: providerId },
            });
            if (!provider || !provider.enabled || provider.type !== exports.SSO_PROVIDER_TYPES.OIDC) {
                return { success: false, error: 'OIDC provider not found' };
            }
            const state = crypto.randomBytes(16).toString('hex');
            const config = provider.config;
            const authUrl = new URL(`${config.issuer}/authorize`);
            authUrl.searchParams.set('client_id', config.clientId);
            authUrl.searchParams.set('redirect_uri', redirectUri);
            authUrl.searchParams.set('response_type', 'code');
            authUrl.searchParams.set('scope', 'openid profile email');
            authUrl.searchParams.set('state', state);
            return { success: true, url: authUrl.toString(), state };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async handleOidcCallback(providerId, code, redirectUri) {
        try {
            const provider = await prisma.ssoProvider.findUnique({
                where: { id: providerId },
            });
            if (!provider || !provider.enabled || provider.type !== exports.SSO_PROVIDER_TYPES.OIDC) {
                return { success: false, error: 'OIDC provider not found' };
            }
            const config = provider.config;
            const tokenResponse = await fetch(`${config.issuer}/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    client_id: config.clientId,
                    client_secret: config.clientSecret,
                    code,
                    redirect_uri: redirectUri,
                }),
            });
            if (!tokenResponse.ok) {
                return { success: false, error: 'Failed to exchange code for tokens' };
            }
            const tokens = await tokenResponse.json();
            const userInfoResponse = await fetch(`${config.issuer}/userinfo`, {
                headers: { Authorization: `Bearer ${tokens.access_token}` },
            });
            if (!userInfoResponse.ok) {
                return { success: false, error: 'Failed to get user info' };
            }
            const userData = await userInfoResponse.json();
            const { user, isNewUser } = await this.findOrCreateSsoUser(provider.teamId, provider.type, {
                email: userData.email,
                name: userData.name || `${userData.given_name} ${userData.family_name}`,
                firstName: userData.given_name,
                lastName: userData.family_name,
                groups: userData.groups || [],
            }, provider.defaultRole);
            return { success: true, user, isNewUser };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async authenticateLdap(providerId, username, password) {
        try {
            const provider = await prisma.ssoProvider.findUnique({
                where: { id: providerId },
            });
            if (!provider || !provider.enabled || provider.type !== exports.SSO_PROVIDER_TYPES.LDAP) {
                return { success: false, error: 'LDAP provider not found' };
            }
            const config = provider.config;
            const ldapConnected = await this.simulateLdapBind(config, username, password);
            if (!ldapConnected) {
                return { success: false, error: 'Invalid LDAP credentials' };
            }
            const userData = await this.getLdapUserAttributes(config, username);
            if (!userData) {
                return { success: false, error: 'Failed to get LDAP user attributes' };
            }
            const { user, isNewUser } = await this.findOrCreateSsoUser(provider.teamId, provider.type, userData, provider.defaultRole);
            return { success: true, user, isNewUser };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async simulateLdapBind(config, username, password) {
        return password.length > 0;
    }
    async getLdapUserAttributes(config, username) {
        return {
            email: `${username}@${config.domain || 'company.com'}`,
            name: username,
            firstName: username.split('.')[0],
            lastName: username.split('.')[1] || '',
            groups: ['users'],
        };
    }
    async findOrCreateSsoUser(teamId, providerType, userData, defaultRole) {
        let user = await prisma.user.findFirst({
            where: { email: userData.email },
        });
        if (user) {
            await prisma.user.update({
                where: { id: user.id },
                data: { updatedAt: new Date() },
            });
            return { user, isNewUser: false };
        }
        const { hash } = await this.hashPassword(crypto.randomBytes(16).toString('hex'));
        user = await prisma.user.create({
            data: {
                email: userData.email,
                name: userData.name,
                passwordHash: hash,
                role: defaultRole,
                teamId,
            },
        });
        return { user, isNewUser: true };
    }
    async hashPassword(password) {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
        return { hash: `${salt}:${hash}`, salt };
    }
};
exports.SsoService = SsoService;
exports.SsoService = SsoService = __decorate([
    (0, common_1.Injectable)()
], SsoService);
//# sourceMappingURL=sso.service.js.map