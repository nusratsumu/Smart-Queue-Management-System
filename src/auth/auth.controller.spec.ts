import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
 
describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    register: jest.Mock;
    login: jest.Mock;
    refresh: jest.Mock;
    forgotPassword: jest.Mock;
    resetPassword: jest.Mock;
  };
 
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            refresh: jest.fn(),
            forgotPassword: jest.fn(),
            resetPassword: jest.fn(),
          },
        },
      ],
    }).compile();
 
    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });
 
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
 
  it('register delegates to authService.register with the dto', async () => {
    const dto = { fullName: 'Test', email: 'a@test.com', password: 'secret123' };
    await controller.register(dto as any);
    expect(authService.register).toHaveBeenCalledWith(dto);
  });
 
  it('login delegates to authService.login with the dto', async () => {
    const dto = { email: 'a@test.com', password: 'secret123' };
    await controller.login(dto as any);
    expect(authService.login).toHaveBeenCalledWith(dto);
  });
 
  it('refresh delegates to authService.refresh with the token from the body', async () => {
    await controller.refresh('some-refresh-token');
    expect(authService.refresh).toHaveBeenCalledWith('some-refresh-token');
  });
 
  it('forgotPassword delegates to authService.forgotPassword with the email', async () => {
    await controller.forgotPassword('a@test.com');
    expect(authService.forgotPassword).toHaveBeenCalledWith('a@test.com');
  });
 
  it('resetPassword delegates to authService.resetPassword with token and newPassword', async () => {
    await controller.resetPassword('reset-token', 'newSecret123');
    expect(authService.resetPassword).toHaveBeenCalledWith('reset-token', 'newSecret123');
  });
});