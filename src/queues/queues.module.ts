import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueuesController } from './queues.controller';
import { QueuesService } from './queues.service';
import { Queues } from './queues.entity';
import { Services } from '../services/services.entity';
import { Tickets } from '../tickets/tickets.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Queues,
      Services,
      Tickets,
    ]),
  ],
  controllers: [QueuesController],
  providers: [QueuesService],
})
export class QueuesModule {}