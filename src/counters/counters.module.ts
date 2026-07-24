import { Module } from '@nestjs/common';
import { CountersController } from './counters.controller';
import { CountersService } from './counters.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Counters } from './counters.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Counters])],
  controllers: [CountersController],
  providers: [CountersService]
})
export class CountersModule {}
