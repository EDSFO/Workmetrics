import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { TimeEntriesModule } from './time-entries/time-entries.module';
import { TeamsModule } from './teams/teams.module';
import { ReportsModule } from './reports/reports.module';
import { InvoicesModule } from './invoices/invoices.module';
import { CalendarModule } from './calendar/calendar.module';
// SchedulingModule commented - requires ScheduledEntry model
// import { SchedulingModule } from './scheduling/scheduling.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { TimeOffModule } from './time-off/time-off.module';
// ApiModule commented - requires additional schema fields
// import { ApiModule } from './api/api.module';
// WebhookModule commented - requires additional schema fields
// import { WebhookModule } from './webhooks/webhook.module';
// IntegrationsModule commented - requires additional schema fields
// import { IntegrationsModule } from './integrations/integrations.module';
// SsoModule commented - requires additional schema fields
// import { SsoModule } from './sso/sso.module';
// GdprModule commented - requires additional schema fields
// import { GdprModule } from './gdpr/gdpr.module';
// AuditModule commented - requires additional schema fields
// import { AuditModule } from './audit/audit.module';
// PaymentModule commented - requires stripe package
// import { PaymentModule } from './payment/payment.module';
import { StandardTasksModule } from './standard-tasks/standard-tasks.module';
import { TenantModule } from './tenant/tenant.module';

@Module({
  imports: [
    TenantModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    TasksModule,
    TimeEntriesModule,
    TeamsModule,
    ReportsModule,
    InvoicesModule,
    CalendarModule,
    // SchedulingModule commented - requires ScheduledEntry model
    // SchedulingModule,
    ApprovalsModule,
    TimeOffModule,
    // ApiModule commented - requires additional schema fields
    // WebhookModule commented - requires additional schema fields
    // IntegrationsModule commented - requires additional schema fields
    // SsoModule commented - requires additional schema fields
    // GdprModule commented - requires additional schema fields
    // AuditModule commented - requires additional schema fields
    // PaymentModule commented - requires stripe package
    StandardTasksModule,
  ],
})
export class AppModule {}
