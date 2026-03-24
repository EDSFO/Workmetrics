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

@Module({
  imports: [
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
  ],
})
export class AppModule {}
