import { Test, TestingModule } from '@nestjs/testing';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { Role } from '../common/enums/role.enum';
import { TicketStatus } from '../common/enums/ticket-status.enum';

const mockTicketsService = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  call: jest.fn(),
  complete: jest.fn(),
  cancel: jest.fn(),
});

const customer = { id: 1, email: 'cust@test.com', role: Role.CUSTOMER };

describe('TicketsController', () => {
  let controller: TicketsController;
  let service: ReturnType<typeof mockTicketsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketsController],
      providers: [{ provide: TicketsService, useFactory: mockTicketsService }],
    }).compile();

    controller = module.get<TicketsController>(TicketsController);
    service = module.get(TicketsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create delegates to the service with dto and current user', async () => {
    const dto = { serviceId: 1 };
    await controller.create(dto, customer);
    expect(service.create).toHaveBeenCalledWith(dto, customer);
  });

  it('findAll delegates to the service with user, status, and queueId', async () => {
    await controller.findAll(customer, TicketStatus.WAITING, 7);
    expect(service.findAll).toHaveBeenCalledWith(customer, TicketStatus.WAITING, 7);
  });

  it('findOne delegates to the service', async () => {
    await controller.findOne(1, customer);
    expect(service.findOne).toHaveBeenCalledWith(1, customer);
  });

  it('call delegates to the service', async () => {
    await controller.call(1, customer);
    expect(service.call).toHaveBeenCalledWith(1, customer);
  });

  it('complete delegates to the service', async () => {
    await controller.complete(1);
    expect(service.complete).toHaveBeenCalledWith(1);
  });

  it('cancel delegates to the service', async () => {
    await controller.cancel(1, customer);
    expect(service.cancel).toHaveBeenCalledWith(1, customer);
  });
});