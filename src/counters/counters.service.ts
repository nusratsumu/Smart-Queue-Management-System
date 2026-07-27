import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Counters } from './counters.entity';
import { Users } from '../users/users.entity';
import { Services } from '../services/services.entity';
import { Role } from '../common/enums/role.enum';
import { CounterStatus } from '../common/enums/counter-status.enum';
import { CreateCounterDto } from './dto/create-counter.dto';
import { UpdateCounterStatusDto } from './dto/update-status.dto';

@Injectable()
export class CountersService {
  constructor(
    @InjectRepository(Counters)
    private readonly countersRepository: Repository<Counters>,

    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,

    @InjectRepository(Services)
    private readonly servicesRepository: Repository<Services>,
  ) {}

  async create(dto: CreateCounterDto): Promise<Counters> {
    const existingCounter = await this.countersRepository.findOne({
      where: {
        name: dto.name,
      },
    });

    if (existingCounter) {
      throw new ConflictException(
        'A counter with this name already exists.',
      );
    }

    let services: Services[] = [];

    if (dto.serviceIds?.length) {
      services = await this.servicesRepository.find({
        where: {
          id: In(dto.serviceIds),
        },
      });

      if (services.length !== dto.serviceIds.length) {
        throw new NotFoundException(
          'One or more serviceIds do not exist',
        );
      }
    }

    const counter = this.countersRepository.create({
      name: dto.name,
      services,
    });

    return this.countersRepository.save(counter);
  }

  async findAll(): Promise<Counters[]> {
    return this.countersRepository.find({
      relations: ['staff', 'services'],
    });
  }

  async findOne(id: number): Promise<Counters> {
    const counter = await this.countersRepository.findOne({
      where: { id },
      relations: ['staff', 'services', 'tickets'],
    });

    if (!counter) {
      throw new NotFoundException(
        `Counter with id ${id} not found`,
      );
    }

    return counter;
  }

  async assignStaff(
    id: number,
    staffId: number,
  ): Promise<Counters> {
    const counter = await this.findOne(id);

    const staff = await this.usersRepository.findOne({
      where: { id: staffId },
    });

    if (!staff) {
      throw new NotFoundException(
        `User with id ${staffId} not found`,
      );
    }

    if (staff.role !== Role.STAFF) {
      throw new BadRequestException(
        'Assigned user must have the staff role',
      );
    }

    const existingAssignment =
      await this.countersRepository.findOne({
        where: {
          staff: {
            id: staffId,
          },
        },
      });

    if (
      existingAssignment &&
      existingAssignment.id !== id
    ) {
      throw new BadRequestException(
        'This staff member is already assigned to another counter',
      );
    }

    counter.staff = staff;

    return this.countersRepository.save(counter);
  }

  async updateStatus(
    id: number,
    dto: UpdateCounterStatusDto,
  ): Promise<Counters> {
    const counter = await this.findOne(id);

    counter.status = dto.status;

    return this.countersRepository.save(counter);
  }
}