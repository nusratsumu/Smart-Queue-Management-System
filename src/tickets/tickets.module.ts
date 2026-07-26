import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { Tickets } from './tickets.entity';
import { Services } from '../services/services.entity';
import { Queues } from '../queues/queues.entity';
import { Counters } from '../counters/counters.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tickets, Services, Queues, Counters]),
    MailModule,
  ],
  controllers: [TicketsController],
  providers: [TicketsService],
})
export class TicketsModule {}