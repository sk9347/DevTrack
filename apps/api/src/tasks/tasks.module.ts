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
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { AuthGuard, AuthUser, CurrentUser } from '../auth/auth.guard';
import { YMD } from '../common/dates';
import { PrismaService } from '../prisma/prisma.service';

const DATE_MSG = 'Date must be YYYY-MM-DD';

export class CreateTaskDto {
  @IsString() @MinLength(1, { message: 'Give the task a title' }) @MaxLength(200)
  title: string;

  @Matches(YMD, { message: DATE_MSG })
  dueDate: string;
}

export class UpdateTaskDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(200)
  title?: string;

  @IsOptional() @Matches(YMD, { message: DATE_MSG })
  dueDate?: string;

  @IsOptional() @IsEnum(TaskStatus)
  status?: TaskStatus;
}

export const taskView = (t: {
  id: string; title: string; dueDate: Date; status: TaskStatus; doneAt: Date | null;
  sessions?: { durationMinutes: number }[];
}) => ({
  id: t.id,
  title: t.title,
  dueDate: t.dueDate.toISOString().slice(0, 10),
  status: t.status,
  doneAt: t.doneAt,
  loggedMinutes: (t.sessions ?? []).reduce((sum, s) => sum + s.durationMinutes, 0),
});

const withMinutes = { sessions: { select: { durationMinutes: true } } } as const;
const asDate = (ymd: string) => new Date(`${ymd}T00:00:00Z`);

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, date?: string) {
    const tasks = await this.prisma.task.findMany({
      where: { userId, ...(date ? { dueDate: asDate(date) } : {}) },
      include: withMinutes,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
    });
    return tasks.map(taskView);
  }

  async create(userId: string, dto: CreateTaskDto) {
    const t = await this.prisma.task.create({
      data: { userId, title: dto.title, dueDate: asDate(dto.dueDate) },
      include: withMinutes,
    });
    return taskView(t);
  }

  async update(userId: string, id: string, dto: UpdateTaskDto) {
    const existing = await this.prisma.task.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Task not found');
    const t = await this.prisma.task.update({
      where: { id },
      include: withMinutes,
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.dueDate !== undefined && { dueDate: asDate(dto.dueDate) }),
        ...(dto.status !== undefined && {
          status: dto.status,
          doneAt: dto.status === TaskStatus.DONE ? new Date() : null,
        }),
      },
    });
    return taskView(t);
  }

  async remove(userId: string, id: string) {
    const res = await this.prisma.task.deleteMany({ where: { id, userId } });
    if (res.count === 0) throw new NotFoundException('Task not found');
  }
}

@Controller('tasks')
@UseGuards(AuthGuard)
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get() list(@CurrentUser() u: AuthUser, @Query('date') date?: string) {
    if (date && !YMD.test(date)) throw new BadRequestException(DATE_MSG);
    return this.tasks.list(u.id, date);
  }
  @Post() create(@CurrentUser() u: AuthUser, @Body() dto: CreateTaskDto) {
    return this.tasks.create(u.id, dto);
  }
  @Patch(':id') update(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasks.update(u.id, id, dto);
  }
  @Delete(':id') @HttpCode(204) remove(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.tasks.remove(u.id, id);
  }
}

@Module({ controllers: [TasksController], providers: [TasksService] })
export class TasksModule {}
