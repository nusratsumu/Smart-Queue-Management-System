import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueuesService } from './queues.service';
import { Queues } from './queues.entity';
import { Services } from '../services/services.entity';
import { QueueStatus } from '../common/enums/queue-status.enum';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

describe('QueuesService', () => {
  let service: QueuesService;
  let queuesRepo: ReturnType<typeof mockRepository>;
  let servicesRepo: ReturnType<typeof mockRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueuesService,
        { provide: getRepositoryToken(Queues), useFactory: mockRepository },
        { provide: getRepositoryToken(Services), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<QueuesService>(QueuesService);
    queuesRepo = module.get(getRepositoryToken(Queues));
    servicesRepo = module.get(getRepositoryToken(Services));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('throws NotFoundException if the service does not exist', async () => {
      servicesRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({ name: 'Counter A', location: 'Floor 1', serviceId: 999 }),
      ).rejects.toThrow(NotFoundException);

      expect(queuesRepo.create).not.toHaveBeenCalled();
    });

    it('creates and saves a queue linked to the service', async () => {
      const foundService = { id: 1, name: 'Passport Renewal' };
      servicesRepo.findOne.mockResolvedValue(foundService);
      const entity = { id: 1, name: 'Counter A', location: 'Floor 1', service: foundService };
      queuesRepo.create.mockReturnValue(entity);
      queuesRepo.save.mockResolvedValue(entity);

      const result = await service.create({ name: 'Counter A', location: 'Floor 1', serviceId: 1 });

      expect(queuesRepo.create).toHaveBeenCalledWith({
        name: 'Counter A',
        location: 'Floor 1',
        service: foundService,
      });
      expect(result).toEqual(entity);
    });
  });

  describe('findAll', () => {
    it('queries with no filters when none are given', async () => {
      queuesRepo.find.mockResolvedValue([]);
      await service.findAll();
      expect(queuesRepo.find).toHaveBeenCalledWith({ where: {}, relations: ['service'] });
    });

    it('filters by serviceId and status when given', async () => {
      queuesRepo.find.mockResolvedValue([]);
      await service.findAll(1, QueueStatus.OPEN);
      expect(queuesRepo.find).toHaveBeenCalledWith({
        where: { service: { id: 1 }, status: QueueStatus.OPEN },
        relations: ['service'],
      });
    });
  });

  describe('findOne', () => {
    it('returns the queue with relations when found', async () => {
      const queue = { id: 1, name: 'Counter A' };
      queuesRepo.findOne.mockResolvedValue(queue);

      const result = await service.findOne(1);

      expect(queuesRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['service', 'tickets'],
      });
      expect(result).toEqual(queue);
    });

    it('throws NotFoundException when not found', async () => {
      queuesRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('merges the dto and saves', async () => {
      const existing = { id: 1, name: 'Old Name', location: 'Old Loc' };
      queuesRepo.findOne.mockResolvedValue(existing);
      queuesRepo.save.mockImplementation((q) => Promise.resolve(q));

      const result = await service.update(1, { name: 'New Name' });

      expect(result.name).toBe('New Name');
    });
  });

  describe('open', () => {
    it('sets status to OPEN and saves', async () => {
      const existing = { id: 1, status: QueueStatus.CLOSED };
      queuesRepo.findOne.mockResolvedValue(existing);
      queuesRepo.save.mockImplementation((q) => Promise.resolve(q));

      const result = await service.open(1);

      expect(result.status).toBe(QueueStatus.OPEN);
    });
  });

  describe('close', () => {
    it('sets status to CLOSED and saves', async () => {
      const existing = { id: 1, status: QueueStatus.OPEN };
      queuesRepo.findOne.mockResolvedValue(existing);
      queuesRepo.save.mockImplementation((q) => Promise.resolve(q));

      const result = await service.close(1);

      expect(result.status).toBe(QueueStatus.CLOSED);
    });
  });

  describe('remove', () => {
    it('removes the queue when found', async () => {
      const existing = { id: 1, name: 'Counter A' };
      queuesRepo.findOne.mockResolvedValue(existing);

      await service.remove(1);

      expect(queuesRepo.remove).toHaveBeenCalledWith(existing);
    });
  });
});
