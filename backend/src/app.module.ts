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
import { SchedulingModule } from './scheduling/scheduling.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { TimeOffModule } from './time-off/time-off.module';
import { ApiModule } from './api/api.module';
import { WebhookModule } from './webhooks/webhook.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { SsoModule } from './sso/sso.module';
import { GdprModule } from './gdpr/gdpr.module';
import { AuditModule } from './audit/audit.module';
import { StandardTasksModule } from './standard-tasks/standard-tasks.module';
import { TenantModule } from './tenant/tenant.module';
import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [
    TenantModule,
    PaymentModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    TasksModule,
    TimeEntriesModule,
    TeamsModule,
    ReportsModule,
    InvoicesModule,
    CalendarModule,
    SchedulingModule,
    ApprovalsModule,
    TimeOffModule,
    ApiModule,
    WebhookModule,
    IntegrationsModule,
    SsoModule,
    GdprModule,
    AuditModule,
    StandardTasksModule,
  ],
})
export class AppModule {}
