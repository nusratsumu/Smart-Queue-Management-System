import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { Users } from './users.entity';
import { Role } from 'src/common/enums/role.enum';
 
const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  createQueryBuilder: jest.fn(),
});
 
describe('UsersService', () => {
  let service: UsersService;
  let repo: ReturnType<typeof mockRepository>;
 
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(Users), useFactory: mockRepository },
      ],
    }).compile();
 
    service = module.get<UsersService>(UsersService);
    repo = module.get(getRepositoryToken(Users));
  });
 
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
 
  describe('createUser', () => {
    it('creates and saves a user', async () => {
      const data = { email: 'a@test.com', password: 'hashed', fullName: 'Test' };
      const entity = { id: 1, ...data };
      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);
 
      const result = await service.createUser(data);
 
      expect(repo.create).toHaveBeenCalledWith(data);
      expect(repo.save).toHaveBeenCalledWith(entity);
      expect(result).toEqual(entity);
    });
  });
 
  describe('getUserByEmail', () => {
    it('returns the user when found', async () => {
      const user = { id: 1, email: 'a@test.com' };
      repo.findOne.mockResolvedValue(user);
 
      const result = await service.getUserByEmail('a@test.com');
 
      expect(repo.findOne).toHaveBeenCalledWith({ where: { email: 'a@test.com' } });
      expect(result).toEqual(user);
    });
 
    it('returns null when not found (used by Auth to check duplicates)', async () => {
      repo.findOne.mockResolvedValue(null);
      const result = await service.getUserByEmail('nope@test.com');
      expect(result).toBeNull();
    });
  });
 
  describe('getUserById', () => {
    it('returns the user when found', async () => {
      const user = { id: 1, email: 'a@test.com' };
      repo.findOne.mockResolvedValue(user);
 
      const result = await service.getUserById(1);
 
      expect(result).toEqual(user);
    });
 
    it('throws NotFoundException when not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.getUserById(999)).rejects.toThrow(NotFoundException);
    });
  });
 
  describe('updateProfile', () => {
    it('updates and returns the fresh user', async () => {
      const user = { id: 1, fullName: 'Old Name' };
      const updatedUser = { id: 1, fullName: 'New Name' };
      repo.findOne
        .mockResolvedValueOnce(user)         // getUserById check before update
        .mockResolvedValueOnce(updatedUser);  // getUserById after update
      repo.update.mockResolvedValue(undefined);
 
      const result = await service.updateProfile(1, { fullName: 'New Name' });
 
      expect(repo.update).toHaveBeenCalledWith(1, { fullName: 'New Name' });
      expect(result).toEqual(updatedUser);
    });
 
    it('throws NotFoundException if the user does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.updateProfile(999, { fullName: 'X' })).rejects.toThrow(NotFoundException);
    });
  });
 
  describe('updatePassword', () => {
    it('updates the password field', async () => {
      repo.update.mockResolvedValue(undefined);
      await service.updatePassword(1, 'newHashedPassword');
      expect(repo.update).toHaveBeenCalledWith(1, { password: 'newHashedPassword' });
    });
  });
 
  describe('updateRole', () => {
    it('updates the role and returns the fresh user', async () => {
      const user = { id: 1, role: Role.CUSTOMER };
      const updatedUser = { id: 1, role: Role.STAFF };
      repo.findOne
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(updatedUser);
      repo.update.mockResolvedValue(undefined);
 
      const result = await service.updateRole(1, Role.STAFF);
 
      expect(repo.update).toHaveBeenCalledWith(1, { role: Role.STAFF });
      expect(result).toEqual(updatedUser);
    });
 
    it('throws NotFoundException if the user does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.updateRole(999, Role.STAFF)).rejects.toThrow(NotFoundException);
    });
  });
 
  describe('findAll', () => {
    it('builds a query with search, role filter, and sort', async () => {
      const qb = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      repo.createQueryBuilder.mockReturnValue(qb);
 
      await service.findAll('john', Role.STAFF, 'ASC');
 
      expect(qb.andWhere).toHaveBeenCalledWith(
        '(user.fullName ILIKE :s OR user.email ILIKE :s)',
        { s: '%john%' },
      );
      expect(qb.andWhere).toHaveBeenCalledWith('user.role = :role', { role: Role.STAFF });
      expect(qb.orderBy).toHaveBeenCalledWith('user.createDate', 'ASC');
    });
 
    it('defaults to DESC sort when no sort is given', async () => {
      const qb = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      repo.createQueryBuilder.mockReturnValue(qb);
 
      await service.findAll();
 
      expect(qb.orderBy).toHaveBeenCalledWith('user.createDate', 'DESC');
    });
  });
});