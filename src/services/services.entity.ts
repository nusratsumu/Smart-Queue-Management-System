// src/services/services.entity.ts
import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Queues } from 'src/queues/queues.entity';
import { Tickets } from 'src/tickets/tickets.entity';

@Entity('services')
export class Services {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 128 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string;

  @Column({ type: 'int' })
  estimatedTime: number; // in minutes

  @Column({ type: 'varchar', length: 100 })
  department: string;

  @Column({ type: 'bool', default: true })
  isActive: boolean;

  @OneToMany(() => Queues, (queue) => queue.service)
  queues: Queues[];

  @OneToMany(() => Tickets, (ticket) => ticket.service)
  tickets: Tickets[];
}