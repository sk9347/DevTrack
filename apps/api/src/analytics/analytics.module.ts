import { BadRequestException, Controller, Get, Injectable, Module, Query, UseGuards } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { AuthGuard, AuthUser, CurrentUser } from '../auth/auth.guard';
import { addDays, startOfWeek, toLocalDate, YMD } from '../common/dates';
import { PrismaService } from '../prisma/prisma.service';
import { taskView } from '../tasks/tasks.module';
import { buildDaily, calcStreaks, habitSummary, heatLevel } from './calc';

const asDate = (ymd: string) => new Date(`${ymd}T00:00:00Z`);
const utcBounds = (from: string, to: string) => ({
  gte: new Date(`${addDays(from, -1)}T00:00:00Z`),
  lt: new Date(`${addDays(to, 2)}T00:00:00Z`),
});

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private async sessionsBetween(user: AuthUser, from: string, to: string) {
    const rows = await this.prisma.studySession.findMany({
      where: { userId: user.id, startedAt: utcBounds(from, to) },
      orderBy: { startedAt: 'asc' },
    });
    return rows.filter((s) => {
      const d = toLocalDate(s.startedAt, user.timezone);
      return d >= from && d <= to;
    });
  }

  private async activeDates(user: AuthUser) {
    const rows = await this.prisma.studySession.findMany({
      where: { userId: user.id },
      select: { startedAt: true },
    });
    return rows.map((r) => toLocalDate(r.startedAt, user.timezone));
  }

  async overview(user: AuthUser, period: 'week' | 'month') {
    const today = toLocalDate(new Date(), user.timezone);
    const from = period === 'week' ? startOfWeek(today) : addDays(today, -29);
    const to = period === 'week' ? addDays(from, 6) : today;

    const [sessions, habits, tasks, active] = await Promise.all([
      this.sessionsBetween(user, from, to),
      this.prisma.habit.findMany({ where: { userId: user.id, isActive: true }, orderBy: { createdAt: 'asc' } }),
      this.prisma.task.findMany({ where: { userId: user.id, dueDate: { gte: asDate(from), lte: asDate(to) } } }),
      this.activeDates(user),
    ]);

    const daily = buildDaily(sessions, user.timezone, from, to);
    const doneByDay = new Map<string, number>();
    for (const t of tasks) {
      if (t.status === TaskStatus.DONE) {
        const d = t.dueDate.toISOString().slice(0, 10);
        doneByDay.set(d, (doneByDay.get(d) ?? 0) + 1);
      }
    }
    const totalMinutes = daily.reduce((sum, d) => sum + d.minutes, 0);
    const habitRows = habits.map((h) => habitSummary(h, sessions, user.timezone, from, to));

    return {
      period,
      from,
      to,
      today,
      totalMinutes,
      studyHours: Math.round((totalMinutes / 60) * 10) / 10,
      activeDays: daily.filter((d) => d.minutes > 0).length,
      tasks: { total: tasks.length, done: tasks.filter((t) => t.status === TaskStatus.DONE).length },
      habitCompletion: habitRows.length
        ? habitRows.reduce((sum, h) => sum + h.completion, 0) / habitRows.length
        : 0,
      streak: calcStreaks(active, today),
      daily: daily.map((d) => ({ ...d, tasksDone: doneByDay.get(d.date) ?? 0 })),
      habits: habitRows,
    };
  }

  /** The daily track: everything that happened (or is planned) on one local day. */
  async day(user: AuthUser, date: string) {
    const [sessions, habits, tasks] = await Promise.all([
      this.prisma.studySession.findMany({
        where: { userId: user.id, startedAt: utcBounds(date, date) },
        include: { habit: true, task: true },
        orderBy: { startedAt: 'asc' },
      }),
      this.prisma.habit.findMany({ where: { userId: user.id, isActive: true }, orderBy: { createdAt: 'asc' } }),
      this.prisma.task.findMany({
        where: { userId: user.id, dueDate: asDate(date) },
        include: { sessions: { select: { durationMinutes: true } } },
        orderBy: { createdAt: 'asc' },
      }),
    ]);
    const todays = sessions.filter((s) => toLocalDate(s.startedAt, user.timezone) === date);
    const minutesByHabit = new Map<string, number>();
    for (const s of todays) minutesByHabit.set(s.habitId, (minutesByHabit.get(s.habitId) ?? 0) + s.durationMinutes);

    return {
      date,
      totalMinutes: todays.reduce((sum, s) => sum + s.durationMinutes, 0),
      habits: habits.map((h) => {
        const minutes = minutesByHabit.get(h.id) ?? 0;
        return {
          id: h.id,
          name: h.name,
          color: h.color,
          dailyTargetMinutes: h.dailyTargetMinutes,
          minutes,
          met: minutes >= h.dailyTargetMinutes,
        };
      }),
      tasks: tasks.map(taskView),
      sessions: todays.map((s) => ({
        id: s.id,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        durationMinutes: s.durationMinutes,
        habitId: s.habitId,
        habitName: s.habit.name,
        habitColor: s.habit.color,
        taskTitle: s.task?.title ?? null,
      })),
    };
  }

  async heatmap(user: AuthUser, weeks: number) {
    const today = toLocalDate(new Date(), user.timezone);
    const from = addDays(startOfWeek(today), -(weeks - 1) * 7);
    const sessions = await this.sessionsBetween(user, from, today);
    const days = buildDaily(sessions, user.timezone, from, today).map((d) => ({
      date: d.date,
      minutes: d.minutes,
      level: heatLevel(d.minutes),
    }));
    return { from, to: today, days, streak: calcStreaks(await this.activeDates(user), today) };
  }
}

@Controller('analytics')
@UseGuards(AuthGuard)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('overview') overview(@CurrentUser() u: AuthUser, @Query('period') period = 'week') {
    if (period !== 'week' && period !== 'month') throw new BadRequestException('period must be week or month');
    return this.analytics.overview(u, period);
  }

  @Get('day') day(@CurrentUser() u: AuthUser, @Query('date') date?: string) {
    const d = date ?? toLocalDate(new Date(), u.timezone);
    if (!YMD.test(d)) throw new BadRequestException('Date must be YYYY-MM-DD');
    return this.analytics.day(u, d);
  }

  @Get('heatmap') heatmap(@CurrentUser() u: AuthUser, @Query('weeks') weeks = '26') {
    const n = Number(weeks);
    if (!Number.isInteger(n) || n < 1 || n > 53) throw new BadRequestException('weeks must be 1-53');
    return this.analytics.heatmap(u, n);
  }
}

@Module({ controllers: [AnalyticsController], providers: [AnalyticsService] })
export class AnalyticsModule {}
