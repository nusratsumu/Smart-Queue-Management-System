import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Services } from './services.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Services)
    private readonly servicesRepository: Repository<Services>,
  ) {}

  async create(dto: CreateServiceDto): Promise<Services> {
    const service = this.servicesRepository.create(dto);
    return this.servicesRepository.save(service);
  }

  async findAll(includeInactive = false): Promise<Services[]> {
    if (includeInactive) {
      return this.servicesRepository.find();
    }
    return this.servicesRepository.find({ where: { isActive: true } });
  }

  async findOne(id: number): Promise<Services> {
    const service = await this.servicesRepository.findOne({
      where: { id },
      relations: ['queues'],
    });
    if (!service) {
      throw new NotFoundException(`Service with id ${id} not found`);
    }
    return service;
  }

  async update(id: number, dto: UpdateServiceDto): Promise<Services> {
    const service = await this.findOne(id);
    Object.assign(service, dto);
    return this.servicesRepository.save(service);
  }

  async deactivate(id: number): Promise<Services> {
    const service = await this.findOne(id);
    service.isActive = false;
    return this.servicesRepository.save(service);
  }

  async remove(id: number): Promise<void> {
    const service = await this.findOne(id);
    await this.servicesRepository.remove(service);
  }
}
