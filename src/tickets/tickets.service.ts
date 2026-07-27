import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tickets } from './tickets.entity';
import { Services } from '../services/services.entity';
import { Queues } from '../queues/queues.entity';
import { Counters } from '../counters/counters.entity';
import { Role } from '../common/enums/role.enum';
import { TicketStatus } from '../common/enums/ticket-status.enum';
import { QueueStatus } from '../common/enums/queue-status.enum';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { MailService } from '../mail/mail.service';
import { CounterStatus } from '../common/enums/counter-status.enum';

export interface CurrentUserPayload {
  id: number;
  email: string;
  role: Role;
}

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Tickets)
    private readonly ticketsRepository: Repository<Tickets>,
    @InjectRepository(Services)
    private readonly servicesRepository: Repository<Services>,
    @InjectRepository(Queues)
    private readonly queuesRepository: Repository<Queues>,
    @InjectRepository(Counters)
    private readonly countersRepository: Repository<Counters>,
    private readonly mailService: MailService,
  ) {}

  async create(dto: CreateTicketDto, currentUser: CurrentUserPayload): Promise<Tickets> {
    const service = await this.servicesRepository.findOne({
      where: { id: dto.serviceId, isActive: true },
    });
    if (!service) {
      throw new NotFoundException('Service not found or inactive');
    }

    const queue = await this.queuesRepository.findOne({
      where: { id: dto.queueId },
      relations: ['service'],
    });
    if (!queue) {
      throw new NotFoundException(`Queue with id ${dto.queueId} not found`);
    }
    if (queue.service.id !== dto.serviceId) {
      throw new BadRequestException('That queue does not belong to the given service');
    }
    if (queue.status !== QueueStatus.OPEN) {
      throw new BadRequestException('This queue is not currently open');
    }

    queue.currentTicketNumber += 1;
    await this.queuesRepository.save(queue);

    const ticketNumber = `Q${queue.id}-${String(queue.currentTicketNumber).padStart(3, '0')}`;

    const ticket = this.ticketsRepository.create({
      ticketNumber,
      priority: dto.priority ?? 'normal',
      user: { id: currentUser.id } as any,
      service,
      queue,
    });
    return this.ticketsRepository.save(ticket);
  }

  async findAll(
    currentUser: CurrentUserPayload,
    status?: TicketStatus,
    queueId?: number,
    sort?: 'ASC' | 'DESC',
  ): Promise<Tickets[]> {
    const where: Record<string, unknown> = {};

    if (currentUser.role === Role.CUSTOMER) {
      where.user = { id: currentUser.id };
    }
    if (status) where.status = status;
    if (queueId) where.queue = { id: queueId };

    return this.ticketsRepository.find({
      where,
      relations: ['user', 'service', 'queue', 'counter'],
      order: { issuedAt: sort === 'ASC' ? 'ASC' : 'DESC' },
    });
  }

  async findMyTickets(userId: number): Promise<Tickets[]> {
    return this.ticketsRepository.find({
      where: { user: { id: userId } },
      relations: ['service', 'queue', 'counter'],
      order: { issuedAt: 'DESC' },
    });
  }

  async findOne(id: number, currentUser: CurrentUserPayload): Promise<Tickets> {
    const ticket = await this.ticketsRepository.findOne({
      where: { id },
      relations: ['user', 'service', 'queue', 'counter'],
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket with id ${id} not found`);
    }
    if (currentUser.role === Role.CUSTOMER && ticket.user.id !== currentUser.id) {
      throw new ForbiddenException('You can only view your own tickets');
    }
    return ticket;
  }

  /**
   * Counter agent calls the next WAITING ticket in a given queue
   * (the oldest one still waiting), assigns it to their own counter.
   */
  async callNext(queueId: number, staffUser: CurrentUserPayload): Promise<Tickets> {
    const queue = await this.queuesRepository.findOne({ where: { id: queueId } });
    if (!queue) {
      throw new NotFoundException(`Queue with id ${queueId} not found`);
    }

    const counter = await this.countersRepository.findOne({
      where: { staff: { id: staffUser.id } },
    });
    if (!counter) {
  throw new BadRequestException(
    'You are not currently assigned to a counter',
  );
}

if (counter.status !== CounterStatus.OPEN) {
  throw new BadRequestException(
    'Your assigned counter is currently closed.',
  );
}


    const nextTicket = await this.ticketsRepository.findOne({
      where: { queue: { id: queueId }, status: TicketStatus.WAITING },
      relations: ['user', 'queue'],
      order: { issuedAt: 'ASC' },
    });
    if (!nextTicket) {
      throw new NotFoundException('No waiting tickets in this queue');
    }

    nextTicket.status = TicketStatus.CALLED;
    nextTicket.calledAt = new Date();
    nextTicket.counter = counter;

    const saved = await this.ticketsRepository.save(nextTicket);

    await this.mailService.sendTicketReadyEmail(
      nextTicket.user.email,
      nextTicket.ticketNumber,
      nextTicket.queue.name,
    );

    return saved;
  }

  async complete(id: number): Promise<Tickets> {
    const ticket = await this.ticketsRepository.findOne({ where: { id } });
    if (!ticket) {
      throw new NotFoundException(`Ticket with id ${id} not found`);
    }
    if (ticket.status !== TicketStatus.CALLED) {
      throw new BadRequestException('Only called tickets can be completed');
    }

    ticket.status = TicketStatus.COMPLETED;
    ticket.completedAt = new Date();
    return this.ticketsRepository.save(ticket);
  }

  async cancel(id: number, currentUser: CurrentUserPayload): Promise<Tickets> {
    const ticket = await this.ticketsRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket with id ${id} not found`);
    }

    if (currentUser.role === Role.CUSTOMER) {
      if (ticket.user.id !== currentUser.id) {
        throw new ForbiddenException('You can only cancel your own tickets');
      }
      if (ticket.status !== TicketStatus.WAITING) {
        throw new BadRequestException('Only waiting tickets can be cancelled');
      }
    } else if (
      ticket.status === TicketStatus.COMPLETED ||
      ticket.status === TicketStatus.CANCELLED
    ) {
      throw new BadRequestException('This ticket is already finalized');
    }

    ticket.status = TicketStatus.CANCELLED;
    return this.ticketsRepository.save(ticket);
  }
}