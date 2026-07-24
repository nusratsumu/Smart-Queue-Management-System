import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tickets } from './tickets.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tickets])],
  controllers: [TicketsController],
  providers: [TicketsService]
})
export class TicketsModule {}
