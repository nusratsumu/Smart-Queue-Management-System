import { Test, TestingModule } from '@nestjs/testing';
import { CountersController } from './counters.controller';
import { CountersService } from './counters.service';
import { CounterStatus } from '../common/enums/counter-status.enum';

const mockCountersService = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  assignStaff: jest.fn(),
  updateStatus: jest.fn(),
});

import { Test, TestingModule } from '@nestjs/testing';
import { CountersController } from './counters.controller';
import { CountersService } from './counters.service';
import { CounterStatus } from '../common/enums/counter-status.enum';

const mockCountersService = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  assignStaff: jest.fn(),
  updateStatus: jest.fn(),
});

describe('CountersController', () => {
  let controller: CountersController;
  let service: ReturnType<typeof mockCountersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CountersController],
      providers: [{ provide: CountersService, useFactory: mockCountersService }],
    }).compile();

    controller = module.get<CountersController>(CountersController);
    service = module.get(CountersService);
  });

  