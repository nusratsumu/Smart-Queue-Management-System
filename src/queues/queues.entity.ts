// src/queues/queues.entity.ts
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { QueueStatus } from 'src/common/enums/queue-status.enum';
import { Services } from 'src/services/services.entity';
import { Tickets } from 'src/tickets/tickets.entity';

@Entity('queues')
export class Queues {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 128 })
  name: string;

  @Column({ type: 'varchar', length: 128 })
  location: string;

  @Column({ type: 'enum', enum: QueueStatus, default: QueueStatus.OPEN })
  status: QueueStatus;

  @Column({ type: 'int', default: 0 })
  currentTicketNumber: number;

  @ManyToOne(() => Services, (service) => service.queues, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  service: Services;

  @OneToMany(() => Tickets, (ticket) => ticket.queue)
  tickets: Tickets[];
}