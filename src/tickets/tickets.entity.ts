// src/tickets/tickets.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TicketStatus } from 'src/common/enums/ticket-status.enum';
import { Users } from 'src/users/users.entity';
import { Services } from 'src/services/services.entity';
import { Queues } from 'src/queues/queues.entity';
import { Counters } from 'src/counters/counters.entity';

@Entity('tickets')
export class Tickets {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 20 })
  ticketNumber: string; // e.g. "A-045"

  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.WAITING })
  status: TicketStatus;

  @Column({ type: 'varchar', length: 20, default: 'normal' })
  priority: string;

  @CreateDateColumn()
  issuedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  calledAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @ManyToOne(() => Users, (user) => user.tickets, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: Users;

  @ManyToOne(() => Services, (service) => service.tickets, { nullable: false })
  @JoinColumn()
  service: Services;

  @ManyToOne(() => Queues, (queue) => queue.tickets, { nullable: false })
  @JoinColumn()
  queue: Queues;

  @ManyToOne(() => Counters, (counter) => counter.tickets, { nullable: true })
  @JoinColumn()
  counter: Counters;
}