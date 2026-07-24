import { Body, Controller, Get, Param, ParseIntPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtGuard } from '../auth/jwtGuard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { roles } from '../auth/roles.decrator';
import { CurrentUser } from '../common/current-user.decorator';
import { Role } from '../common/enums/role.enum';
 
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
 
  @UseGuards(JwtGuard)
  @Get('me')
  getMe(@CurrentUser('id') userId: number) {
    return this.usersService.getUserById(userId);
  }
 
  @UseGuards(JwtGuard)
  @Patch('me')
  updateMe(@CurrentUser('id') userId: number, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }
 
  @UseGuards(JwtGuard, RolesGuard)
  @roles('admin')
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('role') role?: Role,
    @Query('sort') sort?: 'ASC' | 'DESC',
  ) {
    return this.usersService.findAll(search, role, sort);
  }
 
  @UseGuards(JwtGuard, RolesGuard)
  @roles('admin')
  @Patch(':id/role')
  updateRole(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRoleDto) {
    return this.usersService.updateRole(id, dto.role);
  }
}