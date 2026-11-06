import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsDateString, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';
import { AuthGuard, AuthUser, CurrentUser } from '../auth/auth.guard';
import { addDays, toLocalDate, YMD } from '../common/dates';
import { PrismaService } from '../prisma/prisma.service';

export class CreateSessionDto {
  @IsString()
  habitId: string;

  @IsOptional() @IsString()
  taskId?: string;

  /** ISO-8601 instant (UTC) when studying started. */
  @IsDateString()
  startedAt: string;

  @IsInt() @Min(1, { message: 'Log at least 1 minute' }) @Max(720, { message: 'A single session is capped at 12 hours' })
  durationMinutes: number;
}

export class SessionQuery {
  @IsOptional() @Matches(YMD) from?: string;
  @IsOptional() @Matches(YMD) to?: string;
}

const view = (s: any) => ({
  id: s.id,
  startedAt: s.startedAt,
  endedAt: s.endedAt,
  durationMinutes: s.durationMinutes,
  habitId: s.habitId,
  habitName: s.habit?.name,
  habitColor: s.habit?.color,
  taskId: s.taskId,
  taskTitle: s.task?.title ?? null,
});

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthUser, dto: CreateSessionDto) {
    const startedAt = new Date(dto.startedAt);
    if (startedAt.getTime() > Date.now() + 5 * 60_000) {
      throw new BadRequestException('Sessions cannot start in the future');
    }
    const habit = await this.prisma.habit.findFirst({ where: { id: dto.habitId, userId: user.id } });
    if (!habit) throw new NotFoundException('Habit not found');
    if (dto.taskId) {
      const task = await this.prisma.task.findFirst({ where: { id: dto.taskId, userId: user.id } });
      if (!task) throw new NotFoundException('Task not found');
    }
    const s = await this.prisma.studySession.create({
      data: {
        userId: user.id,
        habitId: dto.habitId,
        taskId: dto.taskId ?? null,
        startedAt,
        endedAt: new Date(startedAt.getTime() + dto.durationMinutes * 60_000),
        durationMinutes: dto.durationMinutes,
      },
      include: { habit: true, task: true },
    });
    return view(s);
  }

  /** Sessions whose start falls on a local day within [from, to] in the user's timezone. */
  async list(user: AuthUser, from?: string, to?: string) {
    const rows = await this.prisma.studySession.findMany({
      where: {
        userId: user.id,
        ...(from || to
          ? {
              startedAt: {
                ...(from && { gte: new Date(`${addDays(from, -1)}T00:00:00Z`) }),
                ...(to && { lt: new Date(`${addDays(to, 2)}T00:00:00Z`) }),
              },
            }
          : {}),
      },
      include: { habit: true, task: true },
      orderBy: { startedAt: 'asc' },
    });
    return rows
      .filter((s) => {
        const d = toLocalDate(s.startedAt, user.timezone);
        return (!from || d >= from) && (!to || d <= to);
      })
      .map(view);
  }

  async remove(userId: string, id: string) {
    const res = await this.prisma.studySession.deleteMany({ where: { id, userId } });
    if (res.count === 0) throw new NotFoundException('Session not found');
  }
}

@Controller('sessions')
@UseGuards(AuthGuard)
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}

  @Post() create(@CurrentUser() u: AuthUser, @Body() dto: CreateSessionDto) {
    return this.sessions.create(u, dto);
  }
  @Get() list(@CurrentUser() u: AuthUser, @Query() q: SessionQuery) {
    return this.sessions.list(u, q.from, q.to);
  }
  @Delete(':id') @HttpCode(204) remove(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.sessions.remove(u.id, id);
  }
}

@Module({ controllers: [SessionsController], providers: [SessionsService] })
export class SessionsModule {}
