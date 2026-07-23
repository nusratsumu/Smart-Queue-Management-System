// src/auth/auth.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersService } from 'src/users/users.service';
import { RegisterUserDto } from './register-user.dto';
import { LoginDto } from './login.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
  private readonly usersService: UsersService,
  private readonly jwtService: JwtService,
  private readonly configService: ConfigService,
  private readonly mailService: MailService,
) {}

  async register(dto: RegisterUserDto) {
  const existingUser = await this.usersService.getUserByEmail(dto.email);
  if (existingUser) {
    throw new BadRequestException('Email already exists');
  }
  const hashPass = await bcrypt.hash(dto.password, 10);
  const user = await this.usersService.createUser({ ...dto, password: hashPass, role: undefined });
  await this.mailService.sendWelcomeEmail(user.email, user.fullName);
  return user;
}

  async login(dto: LoginDto) {
    const user = await this.usersService.getUserByEmail(dto.email);
    if (!user) throw new BadRequestException('Invalid credentials');

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new BadRequestException('Invalid credentials');

    const payload = { id: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);
    const refresh_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
    });

    return { access_token, refresh_token };
  }

  async refresh(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      const access_token = this.jwtService.sign({
        id: payload.id,
        email: payload.email,
        role: payload.role,
      });
      return { access_token };
    } catch {
      throw new BadRequestException('Invalid or expired refresh token');
    }
  }
  // add to auth.service.ts
async forgotPassword(email: string) {
  const user = await this.usersService.getUserByEmail(email);
  if (!user) return { message: 'If that email exists, a reset link has been sent' };

  const resetToken = this.jwtService.sign(
    { id: user.id, purpose: 'reset' },
    { expiresIn: '15m' },
  );
  await this.mailService.sendPasswordResetEmail(user.email, resetToken);
  return { message: 'If that email exists, a reset link has been sent' };
}

async resetPassword(token: string, newPassword: string) {
  let payload: any;
  try {
    payload = await this.jwtService.verifyAsync(token);
  } catch {
    throw new BadRequestException('Invalid or expired reset token');
  }
  if (payload.purpose !== 'reset') throw new BadRequestException('Invalid token');

  const hashed = await bcrypt.hash(newPassword, 10);
  await this.usersService.updatePassword(payload.id, hashed);
  return { message: 'Password reset successfully' };
}
}