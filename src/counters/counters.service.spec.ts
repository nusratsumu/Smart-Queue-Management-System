import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CountersService } from './counters.service';
import { Counters } from './counters.entity';
import { Users } from '../users/users.entity';
import { Services } from '../services/services.entity';
import { Role } from '../common/enums/role.enum';
import { CounterStatus } from '../common/enums/counter-status.enum';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
});

describe('CountersService', () => {
  let service: CountersService;
  let countersRepo: ReturnType<typeof mockRepository>;
  let usersRepo: ReturnType<typeof mockRepository>;
  let servicesRepo: ReturnType<typeof mockRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CountersService,
        { provide: getRepositoryToken(Counters), useFactory: mockRepository },
        { provide: getRepositoryToken(Users), useFactory: mockRepository },
        { provide: getRepositoryToken(Services), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<CountersService>(CountersService);
    countersRepo = module.get(getRepositoryToken(Counters));
    usersRepo = module.get(getRepositoryToken(Users));
    servicesRepo = module.get(getRepositoryToken(Services));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates a counter with no services when none are given', async () => {
      const entity = { id: 1, name: 'Counter A', services: [] };
      countersRepo.create.mockReturnValue(entity);
      countersRepo.save.mockResolvedValue(entity);

      const result = await service.create({ name: 'Counter A' });

      expect(countersRepo.create).toHaveBeenCalledWith({ name: 'Counter A', services: [] });
      expect(result).toEqual(entity);
    });

    it('throws NotFoundException if any serviceId does not exist', async () => {
      servicesRepo.find.mockResolvedValue([{ id: 1 }]); // only 1 found, 2 requested

      await expect(
        service.create({ name: 'Counter A', serviceIds: [1, 2] }),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates a counter linked to valid services', async () => {
      const foundServices = [{ id: 1 }, { id: 2 }];
      servicesRepo.find.mockResolvedValue(foundServices);
      const entity = { id: 1, name: 'Counter A', services: foundServices };
      countersRepo.create.mockReturnValue(entity);
      countersRepo.save.mockResolvedValue(entity);

      const result = await service.create({ name: 'Counter A', serviceIds: [1, 2] });

      expect(result).toEqual(entity);
    });
  });

  describe('findAll', () => {
    it('returns all counters with staff and services loaded', async () => {
      countersRepo.find.mockResolvedValue([]);
      await service.findAll();
      expect(countersRepo.find).toHaveBeenCalledWith({ relations: ['staff', 'services'] });
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when not found', async () => {
      countersRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignStaff', () => {
    it('throws NotFoundException if the staff user does not exist', async () => {
      countersRepo.findOne.mockResolvedValueOnce({ id: 1, name: 'Counter A' });
      usersRepo.findOne.mockResolvedValue(null);

      await expect(service.assignStaff(1, 999)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException if the user is not a staff member', async () => {
      countersRepo.findOne.mockResolvedValueOnce({ id: 1, name: 'Counter A' });
      usersRepo.findOne.mockResolvedValue({ id: 5, role: Role.CUSTOMER });

      await expect(service.assignStaff(1, 5)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if the staff member is already assigned elsewhere', async () => {
      countersRepo.findOne
        .mockResolvedValueOnce({ id: 1, name: 'Counter A' }) // findOne(id) inside assignStaff
        .mockResolvedValueOnce({ id: 2, name: 'Counter B' }); // existing assignment lookup
      usersRepo.findOne.mockResolvedValue({ id: 5, role: Role.STAFF });

      await expect(service.assignStaff(1, 5)).rejects.toThrow(BadRequestException);
    });

    it('assigns the staff member and saves', async () => {
      const counter = { id: 1, name: 'Counter A' };
      countersRepo.findOne
        .mockResolvedValueOnce(counter)
        .mockResolvedValueOnce(null); // no existing assignment
      const staff = { id: 5, role: Role.STAFF };
      usersRepo.findOne.mockResolvedValue(staff);
      countersRepo.save.mockImplementation((c) => Promise.resolve(c));

      const result = await service.assignStaff(1, 5);

      expect(result.staff).toEqual(staff);
    });
  });

  describe('updateStatus', () => {
    it('updates the status and saves', async () => {
      const counter = { id: 1, status: CounterStatus.CLOSED };
      countersRepo.findOne.mockResolvedValue(counter);
      countersRepo.save.mockImplementation((c) => Promise.resolve(c));

      const result = await service.updateStatus(1, { status: CounterStatus.OPEN });

      expect(result.status).toBe(CounterStatus.OPEN);
    });
  });
});
