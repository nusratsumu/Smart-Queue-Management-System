import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { Notifications } from './notifications.entity';
import { NotificationType } from '../common/enums/notification-type.enum';
import { NotificationStatus } from '../common/enums/notification-status.enum';


const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
});

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repo: ReturnType<typeof mockRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(Notifications), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    repo = module.get(getRepositoryToken(Notifications));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates a notification linked to the user, defaulting status to SENT', async () => {
      const entity = {
        id: 1,
        user: { id: 5 },
        type: NotificationType.TICKET_ISSUED,
        message: 'Your ticket is ready',
        status: NotificationStatus.SENT,
      };

      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);

      const result = await service.create(5, NotificationType.TICKET_ISSUED, 'Your ticket is ready');

      expect(repo.create).toHaveBeenCalledWith({
        user: { id: 5 },
        type: NotificationType.TICKET_ISSUED,
        message: 'Your ticket is ready',
        status: NotificationStatus.SENT,
      });
      expect(result).toEqual(entity);
    });

    it('respects an explicit status override (e.g. FAILED)', async () => {
      const entity = { id: 2, status: NotificationStatus.FAILED };
      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);

      await service.create(5, NotificationType.REGISTRATION, 'Welcome email failed', NotificationStatus.FAILED);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: NotificationStatus.FAILED }),
      );
    });
  });

  describe('findMyNotifications', () => {
    it('returns notifications for the given user, newest first', async () => {
      repo.find.mockResolvedValue([]);

      await service.findMyNotifications(5);

      expect(repo.find).toHaveBeenCalledWith({
        where: { user: { id: 5 } },
        order: { sentAt: 'DESC' },
      });
    });
  });
});
