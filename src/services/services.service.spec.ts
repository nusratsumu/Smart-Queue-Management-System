import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ServicesService } from './services.service';
import { Services } from './services.entity';

 const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
   remove: jest.fn(),
 });

 describe('ServicesService', ()) => {
  let service: ServicesService;
  let repo: ReturnType<typeof mockRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        { provide: getRepositoryToken(Services), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
    repo = module.get(getRepositoryToken(Services));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates and saves a new service', async () => {
      const dto = { name: 'Passport Renewal', estimatedTime: 15, department: 'Immigration' };
      const entity = { id: 1, isActive: true, ...dto };
      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);

      const result = await service.create(dto as any);

      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(repo.save).toHaveBeenCalledWith(entity);
      expect(result).toEqual(entity);
    });
  });

  describe('findAll', () => {
    it('returns only active services by default', async () => {
      repo.find.mockResolvedValue([]);
      await service.findAll();
      expect(repo.find).toHaveBeenCalledWith({ where: { isActive: true } });
    });

    it('returns all services when includeInactive is true', async () => {
      repo.find.mockResolvedValue([]);
      await service.findAll(true);
      expect(repo.find).toHaveBeenCalledWith();
    });
  });

  describe('findOne', () => {
    it('returns the service when found', async () => {
      const entity = { id: 1, name: 'Passport Renewal' };
      repo.findOne.mockResolvedValue(entity);

      const result = await service.findOne(1);

      expect(result).toEqual(entity);
    });

    it('throws NotFoundException when not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('merges the dto into the existing service and saves it', async () => {
      const existing = { id: 1, name: 'Old Name', isActive: true };
      repo.findOne.mockResolvedValue(existing);
      repo.save.mockImplementation((s) => Promise.resolve(s));

      const result = await service.update(1, { name: 'New Name' });

      expect(result.name).toBe('New Name');
    });
  });

  describe('deactivate', () => {
    it('sets isActive to false and saves', async () => {
      const existing = { id: 1, name: 'Test', isActive: true };
      repo.findOne.mockResolvedValue(existing);
      repo.save.mockImplementation((s) => Promise.resolve(s));

      const result = await service.deactivate(1);

      expect(result.isActive).toBe(false);
    });
  });

  describe('remove', () => {
    it('removes the service when found', async () => {
      const existing = { id: 1, name: 'Test' };
      repo.findOne.mockResolvedValue(existing);

      await service.remove(1);

      expect(repo.remove).toHaveBeenCalledWith(existing);
    });
  });
});
