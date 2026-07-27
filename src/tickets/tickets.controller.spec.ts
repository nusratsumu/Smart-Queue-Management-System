import { Test, TestingModule } from '@nestjs/testing';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { Role } from '../common/enums/role.enum';
import { TicketStatus } from '../common/enums/ticket-status.enum';

const mockTicketsService = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findMyTickets: jest.fn(),
  findOne: jest.fn(),
  callNext: jest.fn(),
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
    const dto = { serviceId: 1, queueId: 7 };
    await controller.create(dto, customer);
    expect(service.create).toHaveBeenCalledWith(dto, customer);
  });

  it('getMyTickets delegates to the service with the current user id', async () => {
    await controller.getMyTickets(1);
    expect(service.findMyTickets).toHaveBeenCalledWith(1);
  });

  it('findAll delegates to the service with user, status, queueId, and sort', async () => {
    await controller.findAll(customer, TicketStatus.WAITING, 7, 'ASC');
    expect(service.findAll).toHaveBeenCalledWith(customer, TicketStatus.WAITING, 7, 'ASC');
  });

  it('findOne delegates to the service', async () => {
    await controller.findOne(1, customer);
    expect(service.findOne).toHaveBeenCalledWith(1, customer);
  });

  it('callNext delegates to the service with queueId and current user', async () => {
    await controller.callNext(7, customer);
    expect(service.callNext).toHaveBeenCalledWith(7, customer);
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