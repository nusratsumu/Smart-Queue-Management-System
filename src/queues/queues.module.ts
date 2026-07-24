import { Module } from '@nestjs/common';
import { QueuesController } from './queues.controller';
import { QueuesService } from './queues.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Queues } from './queues.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Queues])],
  controllers: [QueuesController],
  providers: [QueuesService]
})
export class QueuesModule {}
