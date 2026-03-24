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
exports.GdprController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const gdpr_service_1 = require("./gdpr.service");
let GdprController = class GdprController {
    constructor(gdprService) {
        this.gdprService = gdprService;
    }
    async requestExport(req) {
        return this.gdprService.requestExport(req.user.id);
    }
    async getExportStatus(exportId, req) {
        return this.gdprService.getExportStatus(exportId, req.user.id);
    }
    async downloadExport(exportId, req) {
        const exportData = await this.gdprService.exportUserData(req.user.id);
        if (!exportData.success) {
            return { success: false, error: exportData.error };
        }
        return {
            success: true,
            data: exportData.data,
            message: 'Data export retrieved successfully',
        };
    }
    async deleteAccount(req, body) {
        if (!body.confirmDeletion) {
            return { success: false, error: 'Deletion must be confirmed' };
        }
        return this.gdprService.deleteUserData(req.user.id, body.anonymizeInstead ?? false);
    }
    async recordConsent(req, body) {
        return this.gdprService.recordConsent(req.user.id, body.consentType, body.granted);
    }
    async getConsents(req) {
        const consents = await this.gdprService.getUserConsents(req.user.id);
        return { consents };
    }
    async getRetentionPolicy(req) {
        if (!req.user.teamId) {
            return { success: false, error: 'User is not part of a team' };
        }
        return this.gdprService.getRetentionPolicy(req.user.teamId);
    }
};
exports.GdprController = GdprController;
__decorate([
    (0, common_1.Post)('export'),
    (0, swagger_1.ApiOperation)({ summary: 'Request data export (GDPR Article 20)' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GdprController.prototype, "requestExport", null);
__decorate([
    (0, common_1.Get)('export/:exportId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get data export status' }),
    __param(0, (0, common_1.Param)('exportId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], GdprController.prototype, "getExportStatus", null);
__decorate([
    (0, common_1.Get)('export/:exportId/download'),
    (0, swagger_1.ApiOperation)({ summary: 'Download exported data' }),
    __param(0, (0, common_1.Param)('exportId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], GdprController.prototype, "downloadExport", null);
__decorate([
    (0, common_1.Delete)('account'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete account and all user data (GDPR Article 17)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GdprController.prototype, "deleteAccount", null);
__decorate([
    (0, common_1.Post)('consent'),
    (0, swagger_1.ApiOperation)({ summary: 'Record user consent' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GdprController.prototype, "recordConsent", null);
__decorate([
    (0, common_1.Get)('consent'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user consents' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GdprController.prototype, "getConsents", null);
__decorate([
    (0, common_1.Get)('retention'),
    (0, swagger_1.ApiOperation)({ summary: 'Get data retention policy' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GdprController.prototype, "getRetentionPolicy", null);
exports.GdprController = GdprController = __decorate([
    (0, swagger_1.ApiTags)('gdpr'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('gdpr'),
    __metadata("design:paramtypes", [gdpr_service_1.GdprService])
], GdprController);
//# sourceMappingURL=gdpr.controller.js.map