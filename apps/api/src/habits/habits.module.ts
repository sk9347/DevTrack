import {
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
  UseGuards,
} from '@nestjs/common';
import { IsBoolean, IsHexColor, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { AuthGuard, AuthUser, CurrentUser } from '../auth/auth.guard';
import { PrismaService } from '../prisma/prisma.service';

export class CreateHabitDto {
  @IsString()
  @MinLength(1, { message: 'Give the habit a name' })
  @MaxLength(60)
  name: string;

  @IsOptional() @IsInt() @Min(1) @Max(7)
  targetFrequency?: number;

  @IsOptional() @IsInt() @Min(5) @Max(720)
  dailyTargetMinutes?: number;

  @IsOptional() @IsHexColor()
  color?: string;
}

export class UpdateHabitDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(60)
  name?: string;

  @IsOptional() @IsInt() @Min(1) @Max(7)
  targetFrequency?: number;

  @IsOptional() @IsInt() @Min(5) @Max(720)
  dailyTargetMinutes?: number;

  @IsOptional() @IsHexColor()
  color?: string;

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}

@Injectable()
export class HabitsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string, includeArchived = false) {
    return this.prisma.habit.findMany({
      where: { userId, ...(includeArchived ? {} : { isActive: true }) },
      orderBy: { createdAt: 'asc' },
    });
  }

  create(userId: string, dto: CreateHabitDto) {
    return this.prisma.habit.create({ data: { ...dto, userId } });
  }

  async update(userId: string, id: string, dto: UpdateHabitDto) {
    await this.owned(userId, id);
    return this.prisma.habit.update({ where: { id }, data: dto });
  }

  /** Archive, never hard-delete: past study sessions must keep their habit. */
  async archive(userId: string, id: string) {
    await this.owned(userId, id);
    await this.prisma.habit.update({ where: { id }, data: { isActive: false } });
  }

  private async owned(userId: string, id: string) {
    const habit = await this.prisma.habit.findFirst({ where: { id, userId } });
    if (!habit) throw new NotFoundException('Habit not found');
    return habit;
  }
}

@Controller('habits')
@UseGuards(AuthGuard)
export class HabitsController {
  constructor(private readonly habits: HabitsService) {}

  @Get() list(@CurrentUser() u: AuthUser) {
    return this.habits.list(u.id);
  }
  @Post() create(@CurrentUser() u: AuthUser, @Body() dto: CreateHabitDto) {
    return this.habits.create(u.id, dto);
  }
  @Patch(':id') update(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: UpdateHabitDto) {
    return this.habits.update(u.id, id, dto);
  }
  @Delete(':id') @HttpCode(204) archive(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    return this.habits.archive(u.id, id);
  }
}

@Module({ controllers: [HabitsController], providers: [HabitsService] })
export class HabitsModule {}
