import { Test, TestingModule } from '@nestjs/testing';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

const mockServicesService = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  deactivate: jest.fn(),
  remove: jest.fn(),
});

describe('ServicesController', () => {
  let controller: ServicesController;
  let service: ReturnType<typeof mockServicesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesController],
      providers: [{ provide: ServicesService, useFactory: mockServicesService }],
    }).compile();

    controller = module.get<ServicesController>(ServicesController);
    service = module.get(ServicesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create delegates to the service', async () => {
    const dto = { name: 'Passport Renewal', estimatedTime: 15, department: 'Immigration' };
    await controller.create(dto as any);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('findAll delegates to the service with includeInactive parsed from query', async () => {
    await controller.findAll('true');
    expect(service.findAll).toHaveBeenCalledWith(true);
  });

  it('findOne delegates to the service', async () => {
    await controller.findOne(1);
    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it('update delegates to the service', async () => {
    const dto = { name: 'New Name' };
    await controller.update(1, dto);
    expect(service.update).toHaveBeenCalledWith(1, dto);
  });

  it('deactivate delegates to the service', async () => {
    await controller.deactivate(1);
    expect(service.deactivate).toHaveBeenCalledWith(1);
  });

  it('remove delegates to the service', async () => {
    await controller.remove(1);
    expect(service.remove).toHaveBeenCalledWith(1);
  });
});
