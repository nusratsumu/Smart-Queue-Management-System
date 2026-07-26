import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

 const mockNotificationsService = () => ({
  findMyNotifications: jest.fn(),
 });

 describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: ReturnType<typeof mockNotificationsService>;

 beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [{ provide: NotificationsService, useFactory: mockNotificationsService }],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get(NotificationsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getMyNotifications delegates to the service with the current user id', async () => {
    await controller.getMyNotifications(5);

    expect(service.findMyNotifications).toHaveBeenCalledWith(5);
    });
  });