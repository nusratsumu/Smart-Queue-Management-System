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
      where: { service: { id: dto.serviceId }, status: QueueStatus.OPEN },
    });
    if (!queue) {
      throw new NotFoundException('No open queue available for this service right now');
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

  async call(id: number, staffUser: CurrentUserPayload): Promise<Tickets> {
    const ticket = await this.ticketsRepository.findOne({
      where: { id },
      relations: ['user', 'queue', 'service'],
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket with id ${id} not found`);
    }
    if (ticket.status !== TicketStatus.WAITING) {
      throw new BadRequestException('Only waiting tickets can be called');
    }

    const counter = await this.countersRepository.findOne({
      where: { staff: { id: staffUser.id } },
    });
    if (!counter) {
      throw new BadRequestException('You are not currently assigned to a counter');
    }

    ticket.status = TicketStatus.CALLED;
    ticket.calledAt = new Date();
    ticket.counter = counter;

    const saved = await this.ticketsRepository.save(ticket);

    await this.mailService.sendTicketReadyEmail(
      ticket.user.email,
      ticket.ticketNumber,
      ticket.queue.name,
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