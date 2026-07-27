import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Queues } from './queues.entity';
import { Services } from '../services/services.entity';
import { Tickets } from '../tickets/tickets.entity';
import { QueueStatus } from '../common/enums/queue-status.enum';
import { TicketStatus } from '../common/enums/ticket-status.enum';
import { CreateQueueDto } from './dto/create-queue.dto';
import { UpdateQueueDto } from './dto/update-queue.dto';

@Injectable()
export class QueuesService {
  constructor(
    @InjectRepository(Queues)
    private readonly queuesRepository: Repository<Queues>,

    @InjectRepository(Services)
    private readonly servicesRepository: Repository<Services>,

    @InjectRepository(Tickets)
    private readonly ticketsRepository: Repository<Tickets>,
  ) {}

  async create(dto: CreateQueueDto): Promise<Queues> {
    const service = await this.servicesRepository.findOne({
      where: { id: dto.serviceId },
    });

    if (!service) {
      throw new NotFoundException(
        `Service with id ${dto.serviceId} not found`,
      );
    }

    const existingQueue = await this.queuesRepository.findOne({
      where: {
        name: dto.name,
        service: { id: dto.serviceId },
      },
    });

    if (existingQueue) {
      throw new ConflictException(
        'A queue with this name already exists for this service.',
      );
    }

    const queue = this.queuesRepository.create({
      name: dto.name,
      location: dto.location,
      service,
    });

    return this.queuesRepository.save(queue);
  }

  async findAll(
    serviceId?: number,
    status?: QueueStatus,
  ): Promise<Queues[]> {
    const where: Record<string, unknown> = {};

    if (serviceId) where.service = { id: serviceId };
    if (status) where.status = status;

    return this.queuesRepository.find({
      where,
      relations: ['service'],
    });
  }

  async findOne(id: number): Promise<Queues> {
    const queue = await this.queuesRepository.findOne({
      where: { id },
      relations: ['service', 'tickets'],
    });

    if (!queue) {
      throw new NotFoundException(`Queue with id ${id} not found`);
    }

    return queue;
  }

  async update(id: number, dto: UpdateQueueDto): Promise<Queues> {
    const queue = await this.findOne(id);

    if (dto.name !== undefined) {
      queue.name = dto.name;
    }

    if (dto.location !== undefined) {
      queue.location = dto.location;
    }

    return this.queuesRepository.save(queue);
  }

  async updateStatus(
    id: number,
    status: QueueStatus,
  ): Promise<Queues> {
    const queue = await this.findOne(id);

    queue.status = status;

    return this.queuesRepository.save(queue);
  }

  async remove(id: number): Promise<void> {
    const queue = await this.findOne(id);

    const activeTickets = await this.ticketsRepository.count({
      where: [
        {
          queue: { id },
          status: TicketStatus.WAITING,
        },
        {
          queue: { id },
          status: TicketStatus.CALLED,
        },
      ],
    });

    if (activeTickets > 0) {
      throw new BadRequestException(
        'Cannot delete a queue that has active tickets.',
      );
    }

    await this.queuesRepository.remove(queue);
  }
}