import { Test, TestingModule } from '@nestjs/testing';
import { QueuesController } from './queues.controller';
import { QueuesService } from './queues.service';
import { QueueStatus } from '../common/enums/queue-status.enum';

const mockQueuesService = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  open: jest.fn(),
  close: jest.fn(),
  remove: jest.fn(),
});

describe('QueuesController', () => {
  let controller: QueuesController;
  let service: ReturnType<typeof mockQueuesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QueuesController],
      providers: [{ provide: QueuesService, useFactory: mockQueuesService }],
    }).compile();

    controller = module.get<QueuesController>(QueuesController);
    service = module.get(QueuesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create delegates to the service', async () => {
    const dto = { name: 'Counter A', location: 'Floor 1', serviceId: 1 };
    await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('findAll delegates to the service with serviceId and status', async () => {
    await controller.findAll(1, QueueStatus.OPEN);
    expect(service.findAll).toHaveBeenCalledWith(1, QueueStatus.OPEN);
  });

  it('findOne delegates to the service', async () => {
    await controller.findOne(1);
    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it('update delegates to the service', async () => {
    const dto = { name: 'New Name' };
    await controller.update(1, dto);
    expect(service.update).toHaveBeenCalledWith(1, dto);
  });

  it('open delegates to the service', async () => {
    await controller.open(1);
    expect(service.open).toHaveBeenCalledWith(1);
  });

  it('close delegates to the service', async () => {
    await controller.close(1);
    expect(service.close).toHaveBeenCalledWith(1);
  });

  it('remove delegates to the service', async () => {
    await controller.remove(1);
    expect(service.remove).toHaveBeenCalledWith(1);
  });
});
