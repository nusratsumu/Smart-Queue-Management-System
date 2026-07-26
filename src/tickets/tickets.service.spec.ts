import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TicketsService } from './tickets.service';
import { Tickets } from './tickets.entity';
import { Services } from '../services/services.entity';
import { Queues } from '../queues/queues.entity';
import { Counters } from '../counters/counters.entity';
import { MailService } from '../mail/mail.service';
import { Role } from '../common/enums/role.enum';
import { TicketStatus } from '../common/enums/ticket-status.enum';
import { QueueStatus } from '../common/enums/queue-status.enum';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
});

const customer = { id: 1, email: 'cust@test.com', role: Role.CUSTOMER };
const staff = { id: 2, email: 'staff@test.com', role: Role.STAFF };
const admin = { id: 3, email: 'admin@test.com', role: Role.ADMIN };

describe('TicketsService', () => {
  let service: TicketsService;
  let ticketsRepo: ReturnType<typeof mockRepository>;
  let servicesRepo: ReturnType<typeof mockRepository>;
  let queuesRepo: ReturnType<typeof mockRepository>;
  let countersRepo: ReturnType<typeof mockRepository>;
  let mailService: { sendTicketReadyEmail: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: getRepositoryToken(Tickets), useFactory: mockRepository },
        { provide: getRepositoryToken(Services), useFactory: mockRepository },
        { provide: getRepositoryToken(Queues), useFactory: mockRepository },
        { provide: getRepositoryToken(Counters), useFactory: mockRepository },
        { provide: MailService, useValue: { sendTicketReadyEmail: jest.fn() } },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
    ticketsRepo = module.get(getRepositoryToken(Tickets));
    servicesRepo = module.get(getRepositoryToken(Services));
    queuesRepo = module.get(getRepositoryToken(Queues));
    countersRepo = module.get(getRepositoryToken(Counters));
    mailService = module.get(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('throws NotFoundException if the service does not exist or is inactive', async () => {
      servicesRepo.findOne.mockResolvedValue(null);
      await expect(service.create({ serviceId: 999 }, customer)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException if no open queue exists for the service', async () => {
      servicesRepo.findOne.mockResolvedValue({ id: 1 });
      queuesRepo.findOne.mockResolvedValue(null);
      await expect(service.create({ serviceId: 1 }, customer)).rejects.toThrow(NotFoundException);
    });

    it('increments the queue counter and creates a ticket with a generated number', async () => {
      servicesRepo.findOne.mockResolvedValue({ id: 1, name: 'Passport Renewal' });
      const queue = { id: 7, name: 'Counter Q7', currentTicketNumber: 4 };
      queuesRepo.findOne.mockResolvedValue(queue);
      queuesRepo.save.mockResolvedValue({ ...queue, currentTicketNumber: 5 });

      const entity = { id: 1, ticketNumber: 'Q7-005' };
      ticketsRepo.create.mockReturnValue(entity);
      ticketsRepo.save.mockResolvedValue(entity);

      const result = await service.create({ serviceId: 1 }, customer);

      expect(queuesRepo.save).toHaveBeenCalledWith(expect.objectContaining({ currentTicketNumber: 5 }));
      expect(ticketsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ ticketNumber: 'Q7-005', priority: 'normal' }),
      );
      expect(result).toEqual(entity);
    });
  });

  describe('findAll', () => {
    it('filters by own user id for customers', async () => {
      ticketsRepo.find.mockResolvedValue([]);
      await service.findAll(customer);
      expect(ticketsRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { user: { id: 1 } } }),
      );
    });

    it('does not filter by user for staff/admin', async () => {
      ticketsRepo.find.mockResolvedValue([]);
      await service.findAll(staff);
      expect(ticketsRepo.find).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when not found', async () => {
      ticketsRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne(999, customer)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException if a customer requests someone else\'s ticket', async () => {
      ticketsRepo.findOne.mockResolvedValue({ id: 1, user: { id: 999 } });
      await expect(service.findOne(1, customer)).rejects.toThrow(ForbiddenException);
    });

    it('allows a customer to view their own ticket', async () => {
      const ticket = { id: 1, user: { id: 1 } };
      ticketsRepo.findOne.mockResolvedValue(ticket);
      const result = await service.findOne(1, customer);
      expect(result).toEqual(ticket);
    });

    it('allows staff to view any ticket', async () => {
      const ticket = { id: 1, user: { id: 999 } };
      ticketsRepo.findOne.mockResolvedValue(ticket);
      const result = await service.findOne(1, staff);
      expect(result).toEqual(ticket);
    });
  });

  describe('call', () => {
    it('throws NotFoundException when the ticket does not exist', async () => {
      ticketsRepo.findOne.mockResolvedValue(null);
      await expect(service.call(999, staff)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException if the ticket is not WAITING', async () => {
      ticketsRepo.findOne.mockResolvedValue({ id: 1, status: TicketStatus.CALLED });
      await expect(service.call(1, staff)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if the staff member has no assigned counter', async () => {
      ticketsRepo.findOne.mockResolvedValue({ id: 1, status: TicketStatus.WAITING });
      countersRepo.findOne.mockResolvedValue(null);
      await expect(service.call(1, staff)).rejects.toThrow(BadRequestException);
    });

    it('calls the ticket, assigns the counter, and sends the ready email', async () => {
      const ticket = {
        id: 1,
        status: TicketStatus.WAITING,
        user: { email: 'cust@test.com' },
        queue: { name: 'Counter Q7' },
        ticketNumber: 'Q7-005',
      };
      ticketsRepo.findOne.mockResolvedValue(ticket);
      const counter = { id: 5, name: 'Counter A' };
      countersRepo.findOne.mockResolvedValue(counter);
      ticketsRepo.save.mockImplementation((t) => Promise.resolve(t));

      const result = await service.call(1, staff);

      expect(result.status).toBe(TicketStatus.CALLED);
      expect(result.counter).toEqual(counter);
      expect(mailService.sendTicketReadyEmail).toHaveBeenCalledWith(
        'cust@test.com',
        'Q7-005',
        'Counter Q7',
      );
    });
  });

  describe('complete', () => {
    it('throws BadRequestException if the ticket is not CALLED', async () => {
      ticketsRepo.findOne.mockResolvedValue({ id: 1, status: TicketStatus.WAITING });
      await expect(service.complete(1)).rejects.toThrow(BadRequestException);
    });

    it('marks the ticket completed', async () => {
      const ticket = { id: 1, status: TicketStatus.CALLED };
      ticketsRepo.findOne.mockResolvedValue(ticket);
      ticketsRepo.save.mockImplementation((t) => Promise.resolve(t));

      const result = await service.complete(1);

      expect(result.status).toBe(TicketStatus.COMPLETED);
      expect(result.completedAt).toBeInstanceOf(Date);
    });
  });

  describe('cancel', () => {
    it('throws ForbiddenException if a customer cancels someone else\'s ticket', async () => {
      ticketsRepo.findOne.mockResolvedValue({ id: 1, user: { id: 999 }, status: TicketStatus.WAITING });
      await expect(service.cancel(1, customer)).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException if a customer cancels a non-waiting ticket', async () => {
      ticketsRepo.findOne.mockResolvedValue({ id: 1, user: { id: 1 }, status: TicketStatus.CALLED });
      await expect(service.cancel(1, customer)).rejects.toThrow(BadRequestException);
    });

    it('allows a customer to cancel their own waiting ticket', async () => {
      const ticket = { id: 1, user: { id: 1 }, status: TicketStatus.WAITING };
      ticketsRepo.findOne.mockResolvedValue(ticket);
      ticketsRepo.save.mockImplementation((t) => Promise.resolve(t));

      const result = await service.cancel(1, customer);

      expect(result.status).toBe(TicketStatus.CANCELLED);
    });

    it('throws BadRequestException if staff cancels an already-finalized ticket', async () => {
      ticketsRepo.findOne.mockResolvedValue({ id: 1, user: { id: 1 }, status: TicketStatus.COMPLETED });
      await expect(service.cancel(1, admin)).rejects.toThrow(BadRequestException);
    });

    it('allows staff to cancel any active ticket', async () => {
      const ticket = { id: 1, user: { id: 1 }, status: TicketStatus.CALLED };
      ticketsRepo.findOne.mockResolvedValue(ticket);
      ticketsRepo.save.mockImplementation((t) => Promise.resolve(t));

      const result = await service.cancel(1, admin);

      expect(result.status).toBe(TicketStatus.CANCELLED);
    });
  });
});