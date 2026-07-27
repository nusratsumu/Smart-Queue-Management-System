import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { MailService } from 'src/mail/mail.service';
import { Role } from '../common/enums/role.enum';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: { getUserByEmail: jest.Mock; createUser: jest.Mock; updatePassword: jest.Mock };
  let jwtService: { sign: jest.Mock; verifyAsync: jest.Mock };
  let configService: { getOrThrow: jest.Mock; get: jest.Mock };
  let mailService: { sendWelcomeEmail: jest.Mock; sendPasswordResetEmail: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            getUserByEmail: jest.fn(),
            createUser: jest.fn(),
            updatePassword: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn(),
            get: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendWelcomeEmail: jest.fn(),
            sendPasswordResetEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    mailService = module.get(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('throws BadRequestException if the email is already taken', async () => {
      usersService.getUserByEmail.mockResolvedValue({ id: 1, email: 'taken@test.com' });

      await expect(
        service.register({ email: 'taken@test.com', password: 'pw', fullName: 'Test' } as any),
      ).rejects.toThrow(BadRequestException);

      expect(usersService.createUser).not.toHaveBeenCalled();
    });

    it('hashes the password, creates the user, and sends a welcome email', async () => {
      usersService.getUserByEmail.mockResolvedValue(null);
      const createdUser = { id: 1, email: 'new@test.com', fullName: 'New User' };
      usersService.createUser.mockResolvedValue(createdUser);

      const result = await service.register({
        email: 'new@test.com',
        password: 'plainPassword',
        fullName: 'New User',
      } as any);

      const createUserArg = usersService.createUser.mock.calls[0][0];
      expect(createUserArg.password).not.toBe('plainPassword');
      const matches = await bcrypt.compare('plainPassword', createUserArg.password);
      expect(matches).toBe(true);

      expect(mailService.sendWelcomeEmail).toHaveBeenCalledWith(
        createdUser.email,
        createdUser.fullName,
      );
      expect(result).toEqual(createdUser);
    });

    it('passes the requested role through to createUser (per spec: register with role)', async () => {
      usersService.getUserByEmail.mockResolvedValue(null);
      usersService.createUser.mockResolvedValue({ id: 1, email: 'staff@test.com', role: Role.STAFF });

      await service.register({
        email: 'staff@test.com',
        password: 'plainPassword',
        fullName: 'Staff User',
        role: Role.STAFF,
      } as any);

      const createUserArg = usersService.createUser.mock.calls[0][0];
      expect(createUserArg.role).toBe(Role.STAFF);
    });

    it('leaves role undefined (defaults to CUSTOMER at the entity level) when not provided', async () => {
      usersService.getUserByEmail.mockResolvedValue(null);
      usersService.createUser.mockResolvedValue({ id: 1, email: 'cust@test.com' });

      await service.register({
        email: 'cust@test.com',
        password: 'plainPassword',
        fullName: 'Customer User',
      } as any);

      const createUserArg = usersService.createUser.mock.calls[0][0];
      expect(createUserArg.role).toBeUndefined();
    });
  });

  describe('login', () => {
    it('throws BadRequestException if the user does not exist', async () => {
      usersService.getUserByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nope@test.com', password: 'pw' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if the password does not match', async () => {
      const hashed = await bcrypt.hash('correctPassword', 10);
      usersService.getUserByEmail.mockResolvedValue({ id: 1, email: 'a@test.com', password: hashed });

      await expect(
        service.login({ email: 'a@test.com', password: 'wrongPassword' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('returns access and refresh tokens on valid credentials', async () => {
      const hashed = await bcrypt.hash('correctPassword', 10);
      usersService.getUserByEmail.mockResolvedValue({
        id: 1,
        email: 'a@test.com',
        password: hashed,
        role: 'customer',
      });
      configService.getOrThrow.mockImplementation((key: string) =>
        key === 'JWT_REFRESH_SECRET' ? 'refresh-secret' : '7d',
      );
      jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await service.login({ email: 'a@test.com', password: 'correctPassword' } as any);

      expect(result).toEqual({ access_token: 'access-token', refresh_token: 'refresh-token' });
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });
  });

  describe('refresh', () => {
    it('returns a new access token for a valid refresh token', async () => {
      jwtService.verifyAsync.mockResolvedValue({ id: 1, email: 'a@test.com', role: 'customer' });
      jwtService.sign.mockReturnValue('new-access-token');

      const result = await service.refresh('valid-refresh-token');

      expect(result).toEqual({ access_token: 'new-access-token' });
    });

    it('throws BadRequestException for an invalid or expired token', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

      await expect(service.refresh('bad-token')).rejects.toThrow(BadRequestException);
    });
  });

  describe('forgotPassword', () => {
    it('returns a generic message and does nothing else if the email does not exist', async () => {
      usersService.getUserByEmail.mockResolvedValue(null);

      const result = await service.forgotPassword('ghost@test.com');

      expect(result).toEqual({ message: 'If that email exists, a reset link has been sent' });
      expect(mailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('signs a reset token and emails it when the user exists', async () => {
      usersService.getUserByEmail.mockResolvedValue({ id: 1, email: 'a@test.com' });
      jwtService.sign.mockReturnValue('reset-token');

      const result = await service.forgotPassword('a@test.com');

      expect(jwtService.sign).toHaveBeenCalledWith(
        { id: 1, purpose: 'reset' },
        { expiresIn: '15m' },
      );
      expect(mailService.sendPasswordResetEmail).toHaveBeenCalledWith('a@test.com', 'reset-token');
      expect(result).toEqual({ message: 'If that email exists, a reset link has been sent' });
    });
  });

  describe('resetPassword', () => {
    it('throws BadRequestException for an invalid or expired token', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

      await expect(service.resetPassword('bad-token', 'newPass')).rejects.toThrow(BadRequestException);
    });

    it("throws BadRequestException if the token's purpose is not 'reset'", async () => {
      jwtService.verifyAsync.mockResolvedValue({ id: 1, purpose: 'access' });

      await expect(service.resetPassword('token', 'newPass')).rejects.toThrow(BadRequestException);
    });

    it('hashes and updates the password for a valid reset token', async () => {
      jwtService.verifyAsync.mockResolvedValue({ id: 1, purpose: 'reset' });

      const result = await service.resetPassword('valid-token', 'newPlainPassword');

      const updateArgs = usersService.updatePassword.mock.calls[0];
      expect(updateArgs[0]).toBe(1);
      const matches = await bcrypt.compare('newPlainPassword', updateArgs[1]);
      expect(matches).toBe(true);
      expect(result).toEqual({ message: 'Password reset successfully' });
    });
  });
});