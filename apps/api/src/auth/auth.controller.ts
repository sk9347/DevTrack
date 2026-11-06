import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Injectable,
  Module,
  Patch,
  Post,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { Response } from 'express';
import { isValidTimeZone } from '../common/dates';
import { PrismaService } from '../prisma/prisma.service';
import { AuthGuard, AuthUser, COOKIE_NAME, CurrentUser } from './auth.guard';
import { ChangePasswordDto, DeleteAccountDto, LoginDto, RegisterDto, UpdateProfileDto } from './auth.dto';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  async register(dto: RegisterDto) {
    const timezone = dto.timezone ?? 'Asia/Kolkata';
    if (!isValidTimeZone(timezone)) throw new BadRequestException('Unknown timezone');
    const email = dto.email.toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw new ConflictException('An account with this email already exists');
    }
    const user = await this.prisma.user.create({
      data: { email, timezone, passwordHash: await bcrypt.hash(dto.password, 10) },
    });
    return this.session(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Incorrect email or password');
    }
    return this.session(user);
  }

  async updateTimezone(user: AuthUser, timezone: string) {
    if (!isValidTimeZone(timezone)) throw new BadRequestException('Unknown timezone');
    const updated = await this.prisma.user.update({ where: { id: user.id }, data: { timezone } });
    return { id: updated.id, email: updated.email, timezone: updated.timezone };
  }

  /**
   * A wrong password here is a 400, never a 401: the web client treats any 401 as "your session ended"
   * and signs the user out.
   */
  private async requirePassword(userId: string, password: string, message: string) {
    const row = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!row || !(await bcrypt.compare(password, row.passwordHash))) throw new BadRequestException(message);
    return row;
  }

  async changePassword(user: AuthUser, dto: ChangePasswordDto) {
    await this.requirePassword(user.id, dto.currentPassword, 'Current password is incorrect');
    if (dto.newPassword === dto.currentPassword) {
      throw new BadRequestException('New password must be different from the current one');
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(dto.newPassword, 10) },
    });
  }

  /** Deletes the user; habits, tasks and sessions go with them through the schema's cascades. */
  async deleteAccount(user: AuthUser, password: string) {
    await this.requirePassword(user.id, password, 'Password is incorrect');
    await this.prisma.user.delete({ where: { id: user.id } });
  }

  private async session(user: { id: string; email: string; timezone: string }) {
    const token = await this.jwt.signAsync({ sub: user.id });
    return { token, user: { id: user.id, email: user.email, timezone: user.timezone } };
  }
}

function setCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: WEEK_MS,
    path: '/',
  });
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { token, user } = await this.auth.register(dto);
    setCookie(res, token);
    return { user };
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { token, user } = await this.auth.login(dto);
    setCookie(res, token);
    return { user };
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(COOKIE_NAME, { path: '/' });
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return { user };
  }

  @Patch('me')
  @UseGuards(AuthGuard)
  async updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return { user: await this.auth.updateTimezone(user, dto.timezone) };
  }

  @Post('password')
  @UseGuards(AuthGuard)
  @HttpCode(204)
  changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(user, dto);
  }

  @Delete('me')
  @UseGuards(AuthGuard)
  @HttpCode(204)
  async deleteMe(
    @CurrentUser() user: AuthUser,
    @Body() dto: DeleteAccountDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.deleteAccount(user, dto.password);
    res.clearCookie(COOKIE_NAME, { path: '/' });
  }
}

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      useFactory: () => ({
        secret: process.env.JWT_SECRET ?? 'dev-only-secret-change-me',
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthGuard],
})
export class AuthModule {}
