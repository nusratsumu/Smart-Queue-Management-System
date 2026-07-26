import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/jwtGuard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { roles } from '../auth/roles.decrator';
import { Role } from '../common/enums/role.enum';
import { QueueStatus } from '../common/enums/queue-status.enum';
import { QueuesService } from './queues.service';
import { CreateQueueDto } from './dto/create-queue.dto';
import { UpdateQueueDto } from './dto/update-queue.dto';

@Controller('queues')
export class QueuesController {
  constructor(private readonly queuesService: QueuesService) {}

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @roles(Role.ADMIN)
  create(@Body() dto: CreateQueueDto) {
    return this.queuesService.create(dto);
  }

  @Get()
  findAll(
    @Query('serviceId', new ParseIntPipe({ optional: true })) serviceId?: number,
    @Query('status') status?: QueueStatus,
  ) {
    return this.queuesService.findAll(serviceId, status);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.queuesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @roles(Role.ADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateQueueDto) {
    return this.queuesService.update(id, dto);
  }

  @Patch(':id/open')
  @UseGuards(JwtGuard, RolesGuard)
  @roles(Role.ADMIN, Role.STAFF)
  open(@Param('id', ParseIntPipe) id: number) {
    return this.queuesService.open(id);
  }

  @Patch(':id/close')
  @UseGuards(JwtGuard, RolesGuard)
  @roles(Role.ADMIN, Role.STAFF)
  close(@Param('id', ParseIntPipe) id: number) {
    return this.queuesService.close(id);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @roles(Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.queuesService.remove(id);
  }
}
