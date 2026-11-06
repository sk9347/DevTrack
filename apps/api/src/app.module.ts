import { Module } from '@nestjs/common';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuthModule } from './auth/auth.controller';
import { ExportModule } from './export/export.module';
import { HabitsModule } from './habits/habits.module';
import { PrismaModule } from './prisma/prisma.service';
import { SessionsModule } from './sessions/sessions.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [PrismaModule, AuthModule, HabitsModule, TasksModule, SessionsModule, AnalyticsModule, ExportModule],
})
export class AppModule {}
