import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueuesController } from './queues.controller';
import { QueuesService } from './queues.service';
import { Queues } from './queues.entity';
import { Services } from '../services/services.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Queues, Services])],
  controllers: [QueuesController],
  providers: [QueuesService],
})
export class QueuesModule {}
