"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeyService = exports.ApiKeyGuard = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const crypto = require("crypto");
const prisma = new client_1.PrismaClient();
let ApiKeyGuard = class ApiKeyGuard {
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const apiKey = request.headers['x-api-key'] || request.headers['authorization']?.replace('Bearer ', '');
        if (!apiKey) {
            return false;
        }
        const potentialKeys = await prisma.apiKey.findMany({
            where: {
                active: true,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } },
                ],
            },
        });
        for (const keyRecord of potentialKeys) {
            if (this.verifyKey(apiKey, keyRecord.key)) {
                await prisma.apiKey.update({
                    where: { id: keyRecord.id },
                    data: { lastUsedAt: new Date() },
                });
                request.apiKey = {
                    id: keyRecord.id,
                    teamId: keyRecord.teamId,
                    permissions: keyRecord.permissions,
                };
                return true;
            }
        }
        return false;
    }
    verifyKey(provided, stored) {
        return provided === stored;
    }
};
exports.ApiKeyGuard = ApiKeyGuard;
exports.ApiKeyGuard = ApiKeyGuard = __decorate([
    (0, common_1.Injectable)()
], ApiKeyGuard);
let ApiKeyService = class ApiKeyService {
    async createApiKey(teamId, name, permissions = [], expiresInDays) {
        const key = crypto.randomBytes(32).toString('hex');
        const keyPrefix = key.substring(0, 8);
        const keyHash = key;
        const keyRecord = await prisma.apiKey.create({
            data: {
                teamId,
                name,
                key: keyHash,
                keyPrefix,
                permissions,
                expiresAt: expiresInDays
                    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
                    : null,
                active: true,
            },
        });
        return { key, keyRecord };
    }
    async revokeApiKey(keyId) {
        try {
            await prisma.apiKey.update({
                where: { id: keyId },
                data: { active: false },
            });
            return true;
        }
        catch {
            return false;
        }
    }
    async listApiKeys(teamId) {
        const keys = await prisma.apiKey.findMany({
            where: { teamId, active: true },
            select: {
                id: true,
                name: true,
                keyPrefix: true,
                permissions: true,
                expiresAt: true,
                lastUsedAt: true,
                createdAt: true,
            },
        });
        return keys;
    }
};
exports.ApiKeyService = ApiKeyService;
exports.ApiKeyService = ApiKeyService = __decorate([
    (0, common_1.Injectable)()
], ApiKeyService);
//# sourceMappingURL=api-auth.guard.js.map