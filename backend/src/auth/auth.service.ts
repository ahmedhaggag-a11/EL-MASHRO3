import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../config/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_DAYS = 30;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        roles: { create: [{ role: dto.initialRole }] },
        ...(dto.initialRole === 'STUDENT' ? { studentProfile: { create: {} } } : {}),
      },
      include: { roles: true },
    });

    return this.issueTokens(user.id, user.email, user.roles.map((r) => r.role));
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { roles: true },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.issueTokens(user.id, user.email, user.roles.map((r) => r.role));
  }

  async refresh(rawRefreshToken: string) {
    const tokenHash = this.hashToken(rawRefreshToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token invalid or expired');
    }

    // Rotate: revoke the used token and issue a brand new pair.
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: stored.userId },
      include: { roles: true },
    });

    return this.issueTokens(user.id, user.email, user.roles.map((r) => r.role));
  }

  private async issueTokens(userId: string, email: string, roles: string[]) {
    const accessToken = this.jwt.sign(
      { sub: userId, email, roles },
      { secret: process.env.JWT_ACCESS_SECRET, expiresIn: ACCESS_TOKEN_TTL },
    );

    const rawRefreshToken = crypto.randomBytes(48).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    return { accessToken, refreshToken: rawRefreshToken, roles };
  }

  private hashToken(token: string) {
    // Refresh tokens are stored hashed (never plaintext), same principle as passwords.
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
