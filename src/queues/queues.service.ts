import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Queues } from './queues.entity';
import { Services } from '../services/services.entity';
import { QueueStatus } from '../common/enums/queue-status.enum';
import { CreateQueueDto } from './dto/create-queue.dto';
import { UpdateQueueDto } from './dto/update-queue.dto';

@Injectable()
export class QueuesService {
  constructor(
    @InjectRepository(Queues)
    private readonly queuesRepository: Repository<Queues>,
    @InjectRepository(Services)
    private readonly servicesRepository: Repository<Services>,
  ) {}

  async create(dto: CreateQueueDto): Promise<Queues> {
    const service = await this.servicesRepository.findOne({ where: { id: dto.serviceId } });
    if (!service) {
      throw new NotFoundException(`Service with id ${dto.serviceId} not found`);
    }

    const queue = this.queuesRepository.create({
      name: dto.name,
      location: dto.location,
      service,
    });
    return this.queuesRepository.save(queue);
  }

  async findAll(serviceId?: number, status?: QueueStatus): Promise<Queues[]> {
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
    Object.assign(queue, dto);
    return this.queuesRepository.save(queue);
  }

  async open(id: number): Promise<Queues> {
    const queue = await this.findOne(id);
    queue.status = QueueStatus.OPEN;
    return this.queuesRepository.save(queue);
  }

  async close(id: number): Promise<Queues> {
    const queue = await this.findOne(id);
    queue.status = QueueStatus.CLOSED;
    return this.queuesRepository.save(queue);
  }

  async remove(id: number): Promise<void> {
    const queue = await this.findOne(id);
    await this.queuesRepository.remove(queue);
  }
}
