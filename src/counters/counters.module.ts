import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CountersController } from './counters.controller';
import { CountersService } from './counters.service';
import { Counters } from './counters.entity';
import { Users } from '../users/users.entity';
import { Services } from '../services/services.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Counters, Users, Services])],
  controllers: [CountersController],
  providers: [CountersService],
})
export class CountersModule {}
