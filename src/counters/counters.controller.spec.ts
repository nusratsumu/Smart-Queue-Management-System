import { Test, TestingModule } from '@nestjs/testing';
import { CountersController } from './counters.controller';
import { CountersService } from './counters.service';
import { CounterStatus } from '../common/enums/counter-status.enum';

const mockCountersService = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  assignStaff: jest.fn(),
  updateStatus: jest.fn(),
});

describe('CountersController', () => {
  let controller: CountersController;
  let service: ReturnType<typeof mockCountersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CountersController],
      providers: [{ provide: CountersService, useFactory: mockCountersService }],
    }).compile();

    controller = module.get<CountersController>(CountersController);
    service = module.get(CountersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create delegates to the service', async () => {
    const dto = { name: 'Counter A' };
    await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('findAll delegates to the service', async () => {
    await controller.findAll();
    expect(service.findAll).toHaveBeenCalled();
  });

  it('findOne delegates to the service', async () => {
    await controller.findOne(1);
    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it('assignStaff delegates to the service with id and staffId', async () => {
    await controller.assignStaff(1, { staffId: 5 });
    expect(service.assignStaff).toHaveBeenCalledWith(1, 5);
  });

  it('updateStatus delegates to the service', async () => {
    const dto = { status: CounterStatus.OPEN };
    await controller.updateStatus(1, dto);
    expect(service.updateStatus).toHaveBeenCalledWith(1, dto);
  });
});
