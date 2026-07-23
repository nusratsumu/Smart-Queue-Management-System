// src/counters/counters.entity.ts
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CounterStatus } from 'src/common/enums/counter-status.enum';
import { Users } from 'src/users/users.entity';
import { Services } from 'src/services/services.entity';
import { Tickets } from 'src/tickets/tickets.entity';

@Entity('counters')
export class Counters {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 128 })
  name: string;

  @Column({ type: 'enum', enum: CounterStatus, default: CounterStatus.CLOSED })
  status: CounterStatus;

  // one counter <-> one staff user (owning side, holds the FK)
  @OneToOne(() => Users, (user) => user.counter, { nullable: true })
  @JoinColumn()
  staff: Users;

  // many counters <-> many services (owning side, creates join table)
  @ManyToMany(() => Services)
  @JoinTable({ name: 'counter_services' })
  services: Services[];

  @OneToMany(() => Tickets, (ticket) => ticket.counter)
  tickets: Tickets[];
}