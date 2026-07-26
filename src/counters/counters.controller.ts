import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwtGuard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { roles } from '../auth/roles.decrator';
import { Role } from '../common/enums/role.enum';
import { CountersService } from './counters.service';
import { CreateCounterDto } from './dto/create-counter.dto';
import { AssignStaffDto } from './dto/assign-staff.dto';
import { UpdateCounterStatusDto } from './dto/update-status.dto';

@Controller('counters')
export class CountersController {
  constructor(private readonly countersService: CountersService) {}

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @roles(Role.ADMIN)
  create(@Body() dto: CreateCounterDto) {
    return this.countersService.create(dto);
  }

  @Get()
  @UseGuards(JwtGuard)
  findAll() {
    return this.countersService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.countersService.findOne(id);
  }

  @Patch(':id/assign-staff')
  @UseGuards(JwtGuard, RolesGuard)
  @roles(Role.ADMIN)
  assignStaff(@Param('id', ParseIntPipe) id: number, @Body() dto: AssignStaffDto) {
    return this.countersService.assignStaff(id, dto.staffId);
  }

  @Patch(':id/status')
  @UseGuards(JwtGuard, RolesGuard)
  @roles(Role.ADMIN, Role.STAFF)
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCounterStatusDto) {
    return this.countersService.updateStatus(id, dto);
  }
}
