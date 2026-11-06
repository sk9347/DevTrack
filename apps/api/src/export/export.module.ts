import { Controller, Get, Injectable, Module, NotFoundException, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard, AuthUser, CurrentUser } from '../auth/auth.guard';
import { toLocalDate } from '../common/dates';
import { PrismaService } from '../prisma/prisma.service';
import { Cell, toCsv } from './csv';

const FILES = ['habits.csv', 'tasks.csv', 'sessions.csv'] as const;
type FileName = (typeof FILES)[number];

const ymd = (d: Date) => d.toISOString().slice(0, 10);

@Injectable()
export class ExportService {
  constructor(private readonly prisma: PrismaService) {}

  async build(user: AuthUser, file: FileName): Promise<string> {
    if (file === 'habits.csv') {
      const habits = await this.prisma.habit.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'asc' } });
      return toCsv(
        ['name', 'daily_target_minutes', 'days_per_week', 'color', 'active', 'created_at'],
        habits.map((h) => [h.name, h.dailyTargetMinutes, h.targetFrequency, h.color, h.isActive, h.createdAt]),
      );
    }

    if (file === 'tasks.csv') {
      const [tasks, logged] = await Promise.all([
        this.prisma.task.findMany({ where: { userId: user.id }, orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }] }),
        this.prisma.studySession.groupBy({
          by: ['taskId'],
          where: { userId: user.id, taskId: { not: null } },
          _sum: { durationMinutes: true },
        }),
      ]);
      const minutes = new Map(logged.map((g) => [g.taskId, g._sum.durationMinutes ?? 0]));
      return toCsv(
        ['due_date', 'title', 'status', 'done_at', 'minutes_logged'],
        tasks.map((t): Cell[] => [ymd(t.dueDate), t.title, t.status, t.doneAt, minutes.get(t.id) ?? 0]),
      );
    }

    const sessions = await this.prisma.studySession.findMany({
      where: { userId: user.id },
      include: { habit: true, task: true },
      orderBy: { startedAt: 'asc' },
    });
    return toCsv(
      ['date', 'habit', 'minutes', 'started_at', 'ended_at', 'task'],
      sessions.map((s): Cell[] => [
        toLocalDate(s.startedAt, user.timezone),
        s.habit.name,
        s.durationMinutes,
        s.startedAt,
        s.endedAt,
        s.task?.title,
      ]),
    );
  }
}

@Controller('export')
@UseGuards(AuthGuard)
export class ExportController {
  constructor(private readonly exporter: ExportService) {}

  @Get(':file')
  async download(@CurrentUser() user: AuthUser, @Param('file') file: string, @Res() res: Response) {
    if (!(FILES as readonly string[]).includes(file)) throw new NotFoundException('Unknown export');
    const body = await this.exporter.build(user, file as FileName);
    res
      .status(200)
      .set({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="devtrack-${file}"`,
        'Cache-Control': 'no-store',
      })
      .send(body);
  }
}

@Module({ controllers: [ExportController], providers: [ExportService] })
export class ExportModule {}
