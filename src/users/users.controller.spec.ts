import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Role } from '../common/enums/role.enum';
 
const mockUsersService = () => ({
  getUserById: jest.fn(),
  updateProfile: jest.fn(),
  findAll: jest.fn(),
  updateRole: jest.fn(),
});
 
describe('UsersController', () => {
  let controller: UsersController;
  let service: ReturnType<typeof mockUsersService>;
 
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useFactory: mockUsersService }],
    }).compile();
 
    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);
  });
 
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
 
  it('getMe delegates to usersService.getUserById with the current user id', async () => {
    await controller.getMe(1);
    expect(service.getUserById).toHaveBeenCalledWith(1);
  });
 
  it('updateMe delegates to usersService.updateProfile', async () => {
    const dto = { fullName: 'New Name' };
    await controller.updateMe(1, dto);
    expect(service.updateProfile).toHaveBeenCalledWith(1, dto);
  });
 
  it('findAll delegates to usersService.findAll with the query params', async () => {
    await controller.findAll('john', Role.STAFF, 'ASC');
    expect(service.findAll).toHaveBeenCalledWith('john', Role.STAFF, 'ASC');
  });
 
  it('updateRole delegates to usersService.updateRole', async () => {
    const dto = { role: Role.STAFF };
    await controller.updateRole(1, dto);
    expect(service.updateRole).toHaveBeenCalledWith(1, Role.STAFF);
  });
});