"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const projects_module_1 = require("./projects/projects.module");
const tasks_module_1 = require("./tasks/tasks.module");
const time_entries_module_1 = require("./time-entries/time-entries.module");
const teams_module_1 = require("./teams/teams.module");
const reports_module_1 = require("./reports/reports.module");
const invoices_module_1 = require("./invoices/invoices.module");
const calendar_module_1 = require("./calendar/calendar.module");
const scheduling_module_1 = require("./scheduling/scheduling.module");
const approvals_module_1 = require("./approvals/approvals.module");
const time_off_module_1 = require("./time-off/time-off.module");
const api_module_1 = require("./api/api.module");
const webhook_module_1 = require("./webhooks/webhook.module");
const integrations_module_1 = require("./integrations/integrations.module");
const sso_module_1 = require("./sso/sso.module");
const gdpr_module_1 = require("./gdpr/gdpr.module");
const audit_module_1 = require("./audit/audit.module");
const standard_tasks_module_1 = require("./standard-tasks/standard-tasks.module");
const tenant_module_1 = require("./tenant/tenant.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            tenant_module_1.TenantModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            projects_module_1.ProjectsModule,
            tasks_module_1.TasksModule,
            time_entries_module_1.TimeEntriesModule,
            teams_module_1.TeamsModule,
            reports_module_1.ReportsModule,
            invoices_module_1.InvoicesModule,
            calendar_module_1.CalendarModule,
            scheduling_module_1.SchedulingModule,
            approvals_module_1.ApprovalsModule,
            time_off_module_1.TimeOffModule,
            api_module_1.ApiModule,
            webhook_module_1.WebhookModule,
            integrations_module_1.IntegrationsModule,
            sso_module_1.SsoModule,
            gdpr_module_1.GdprModule,
            audit_module_1.AuditModule,
            standard_tasks_module_1.StandardTasksModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map